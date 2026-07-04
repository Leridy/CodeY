//! Agent 核心循环
//!
//! 实现 Agent 的主对话循环，连接用户输入、LLM 调用、工具执行和响应输出

use anyhow::Result;
use std::str::FromStr;
use std::sync::Arc;
use tracing::{debug, info, warn};

use crate::agent::context::Context;
use crate::agent::types::{
    AgentLoopConfig, AgentResponse, ExecutedToolCall, ToolExecutionResult,
};
use crate::llm::{ChatRequest, LlmProvider, Message as LlmMessage, Tool, ToolCall, Usage};
use crate::permission::{PermissionEngine, PermissionLevel, PermissionResult};
use crate::sandbox::SandboxManager;
use crate::tools::{ToolOrchestrator, ToolRegistry};

/// Agent 核心循环
///
/// 编排 LLM 调用和工具执行的核心模块
pub struct AgentLoop {
    /// LLM 提供商
    llm_provider: Arc<dyn LlmProvider>,

    /// 工具编排器（包含工具注册表）
    tool_orchestrator: ToolOrchestrator,

    /// 权限引擎
    permission_engine: PermissionEngine,

    /// 沙箱管理器
    sandbox_manager: Arc<dyn SandboxManager>,

    /// 当前上下文
    context: Context,

    /// Agent 配置
    config: AgentLoopConfig,
}

impl AgentLoop {
    /// 创建新的 Agent Loop 实例
    ///
    /// # Arguments
    /// * `llm_provider` - LLM 提供商
    /// * `tool_registry` - 工具注册表（内部包装为 ToolOrchestrator）
    /// * `permission_engine` - 权限引擎
    /// * `sandbox_manager` - 沙箱管理器
    /// * `context` - 对话上下文
    /// * `config` - Agent 配置
    pub fn new(
        llm_provider: Arc<dyn LlmProvider>,
        tool_registry: ToolRegistry,
        permission_engine: PermissionEngine,
        sandbox_manager: Arc<dyn SandboxManager>,
        context: Context,
        config: AgentLoopConfig,
    ) -> Self {
        Self {
            llm_provider,
            tool_orchestrator: ToolOrchestrator::new(tool_registry),
            permission_engine,
            sandbox_manager,
            context,
            config,
        }
    }

    /// 处理用户输入并返回最终响应
    ///
    /// 这是 Agent Loop 的主入口点，执行完整的对话循环：
    /// 1. 将用户输入添加到上下文
    /// 2. 调用 LLM 获取响应
    /// 3. 如果有工具调用，执行工具并循环
    /// 4. 返回最终响应
    ///
    /// # Arguments
    /// * `user_input` - 用户输入文本
    ///
    /// # Returns
    /// 最终的 Agent 响应
    pub async fn run(&mut self, user_input: &str) -> Result<AgentResponse> {
        info!("Agent Loop 开始处理用户输入");

        // 1. 添加用户消息到上下文
        self.context.add_user_message(user_input);

        // 2. 开始工具调用循环
        let mut current_round = 0;

        loop {
            if current_round >= self.config.max_tool_rounds {
                warn!(
                    "达到最大工具调用轮次 ({})，强制结束循环",
                    self.config.max_tool_rounds
                );
                return self.create_final_response("已达到最大工具调用轮次限制，请简化您的请求。");
            }

            // 3. 调用 LLM
            let response = self.process_message().await?;

            // 4. 检查是否有工具调用
            if !response.has_tool_calls() {
                info!("Agent Loop 完成，无工具调用");

                // 添加助手消息到上下文（即使没有工具调用）
                self.context
                    .add_assistant_message(&response.content, None);

                return Ok(response);
            }

            // 5. 处理工具调用
            debug!("处理 {} 个工具调用", response.tool_calls.len());

            // 添加助手消息（带工具调用）到上下文
            self.context
                .add_assistant_message(&response.content, Some(response.tool_calls.clone()));

            // 执行每个工具调用
            for tool_call in &response.tool_calls {
                let executed = self.handle_tool_call(tool_call).await?;

                // 添加工具结果到上下文
                self.context
                    .add_tool_result(&executed.call_id, executed.result.content());

                // 记录执行
                self.context.record_tool_execution(crate::agent::context::ExecutedToolCallRecord {
                    call_id: executed.call_id.clone(),
                    tool_name: executed.tool_name.clone(),
                    arguments: executed.arguments.clone(),
                    result_content: executed.result.content().to_string(),
                    is_success: executed.result.is_success(),
                });
            }

            current_round += 1;
        }
    }

    /// 调用 LLM 处理当前上下文
    ///
    /// 构建 ChatRequest 并调用 LLM 提供商获取响应
    ///
    /// # Returns
    /// Agent 响应
    async fn process_message(&mut self) -> Result<AgentResponse> {
        // 构建 LLM 消息列表
        let messages = self.build_llm_messages();

        // 获取工具定义
        let tools = self.build_tool_definitions();

        // 构建请求
        let request = ChatRequest {
            model: self.config.model.clone(),
            messages,
            temperature: self.config.temperature,
            max_tokens: self.config.max_tokens,
            stream: false,
            tools: if tools.is_empty() { None } else { Some(tools) },
        };

        debug!("发送 LLM 请求，模型: {}", self.config.model);

        // 调用 LLM
        let response = self.llm_provider.chat(request).await?;

        debug!(
            "LLM 响应成功，token 使用: {}",
            response.usage.total_tokens
        );

        // 解析响应中的工具调用
        let tool_calls = response
            .message
            .tool_calls
            .unwrap_or_default();

        let is_final = tool_calls.is_empty();

        Ok(AgentResponse {
            content: response.message.content,
            tool_calls,
            is_final,
            usage: response.usage,
        })
    }

    /// 处理单个工具调用
    ///
    /// 检查权限、执行工具并返回结果
    ///
    /// # Arguments
    /// * `tool_call` - 工具调用信息
    ///
    /// # Returns
    /// 工具执行记录
    async fn handle_tool_call(&self, tool_call: &ToolCall) -> Result<ExecutedToolCall> {
        debug!("执行工具调用: {} (ID: {})", tool_call.name, tool_call.id);

        // 1. 检查工具是否存在
        let tool = match self.tool_orchestrator.get(&tool_call.name) {
            Some(t) => t,
            None => {
                warn!("工具不存在: {}", tool_call.name);
                return Ok(ExecutedToolCall {
                    call_id: tool_call.id.clone(),
                    tool_name: tool_call.name.clone(),
                    arguments: tool_call.arguments.clone(),
                    result: ToolExecutionResult::Error(format!(
                        "工具 '{}' 不存在",
                        tool_call.name
                    )),
                });
            }
        };

        // 2. 检查权限
        let required_level = PermissionLevel::from_str(&tool.required_permission)
            .unwrap_or(PermissionLevel::ReadOnly);
        let permission_result =
            self.permission_engine
                .check(&tool_call.name, required_level);

        match permission_result {
            PermissionResult::Denied(reason) => {
                warn!("工具调用被拒绝: {} - {}", tool_call.name, reason);
                return Ok(ExecutedToolCall {
                    call_id: tool_call.id.clone(),
                    tool_name: tool_call.name.clone(),
                    arguments: tool_call.arguments.clone(),
                    result: ToolExecutionResult::Error(format!("权限不足: {}", reason)),
                });
            }
            PermissionResult::NeedApproval => {
                // TODO: 实现用户审批流程
                warn!("工具调用需要用户审批: {}", tool_call.name);
                return Ok(ExecutedToolCall {
                    call_id: tool_call.id.clone(),
                    tool_name: tool_call.name.clone(),
                    arguments: tool_call.arguments.clone(),
                    result: ToolExecutionResult::Error("需要用户审批".to_string()),
                });
            }
            PermissionResult::Allowed => {
                // 继续执行
            }
        }

        // 3. 通过 ToolOrchestrator 执行工具
        info!("工具调用通过权限检查: {}", tool_call.name);

        match self
            .tool_orchestrator
            .execute(&tool_call.name, tool_call.arguments.clone())
            .await
        {
            Ok(output) => Ok(ExecutedToolCall {
                call_id: tool_call.id.clone(),
                tool_name: tool_call.name.clone(),
                arguments: tool_call.arguments.clone(),
                result: ToolExecutionResult::Success(output.to_string()),
            }),
            Err(e) => {
                warn!("工具执行失败: {} - {}", tool_call.name, e);
                Ok(ExecutedToolCall {
                    call_id: tool_call.id.clone(),
                    tool_name: tool_call.name.clone(),
                    arguments: tool_call.arguments.clone(),
                    result: ToolExecutionResult::Error(e.to_string()),
                })
            }
        }
    }

    /// 构建 LLM 消息列表
    ///
    /// 将上下文中的消息转换为 LLM 格式，包含系统提示
    fn build_llm_messages(&self) -> Vec<LlmMessage> {
        let mut messages = Vec::new();

        // 添加系统提示
        if let Some(ref system_prompt) = self.config.system_prompt {
            messages.push(LlmMessage {
                role: "system".to_string(),
                content: system_prompt.clone(),
                tool_calls: None,
            });
        }

        // 添加上下文中的消息
        messages.extend(self.context.to_llm_messages());

        messages
    }

    /// 构建工具定义列表
    ///
    /// 从工具注册表中获取所有工具并转换为 LLM 格式
    fn build_tool_definitions(&self) -> Vec<Tool> {
        self.tool_orchestrator
            .list_all()
            .iter()
            .map(|t| Tool {
                name: t.name.clone(),
                description: t.description.clone(),
                parameters: t.parameters.clone(),
            })
            .collect()
    }

    /// 创建最终响应（当达到最大轮次时使用）
    fn create_final_response(&self, content: &str) -> Result<AgentResponse> {
        Ok(AgentResponse::text(
            content,
            Usage {
                prompt_tokens: 0,
                completion_tokens: 0,
                total_tokens: 0,
            },
        ))
    }

    /// 获取上下文的只读引用
    pub fn context(&self) -> &Context {
        &self.context
    }

    /// 获取上下文的可变引用
    pub fn context_mut(&mut self) -> &mut Context {
        &mut self.context
    }

    /// 获取配置的只读引用
    pub fn config(&self) -> &AgentLoopConfig {
        &self.config
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::agent::context::Context;
    use crate::agent::types::AgentLoopConfig;
    use crate::llm::{ChatRequest, ChatResponse, ChatStream, Model, ToolCall};
    use crate::permission::PermissionLevel;
    use crate::tools::ToolRegistry;
    use async_trait::async_trait;
    use serde_json::json;
    use std::sync::Arc;

    // Mock LLM Provider
    struct MockLlmProvider {
        responses: std::sync::Mutex<Vec<ChatResponse>>,
        call_count: std::sync::atomic::AtomicUsize,
    }

    impl MockLlmProvider {
        fn new(responses: Vec<ChatResponse>) -> Self {
            Self {
                responses: std::sync::Mutex::new(responses),
                call_count: std::sync::atomic::AtomicUsize::new(0),
            }
        }

        fn call_count(&self) -> usize {
            self.call_count.load(std::sync::atomic::Ordering::SeqCst)
        }
    }

    #[async_trait]
    impl LlmProvider for MockLlmProvider {
        fn id(&self) -> &str {
            "mock"
        }

        fn name(&self) -> &str {
            "Mock Provider"
        }

        fn clone_box(&self) -> Box<dyn LlmProvider> {
            panic!("MockLlmProvider 不支持克隆")
        }

        async fn models(&self) -> Result<Vec<Model>> {
            Ok(vec![])
        }

        async fn chat(&self, _request: ChatRequest) -> Result<ChatResponse> {
            self.call_count
                .fetch_add(1, std::sync::atomic::Ordering::SeqCst);
            let mut responses = self.responses.lock().unwrap();
            if responses.is_empty() {
                anyhow::bail!("Mock 响应已耗尽")
            }
            Ok(responses.remove(0))
        }

        async fn stream_chat(&self, _request: ChatRequest) -> Result<ChatStream> {
            let (_tx, rx) = tokio::sync::mpsc::channel(16);
            Ok(ChatStream::new(rx))
        }

        fn supports_streaming(&self) -> bool {
            false
        }

        fn supports_function_calling(&self) -> bool {
            true
        }
    }

    fn create_test_context() -> Context {
        Context::new("test-conv", "/tmp")
    }

    fn create_test_config() -> AgentLoopConfig {
        AgentLoopConfig {
            max_tool_rounds: 3,
            model: "gpt-4o".to_string(),
            temperature: Some(0.7),
            max_tokens: Some(1024),
            system_prompt: Some("You are a helpful assistant.".to_string()),
            enable_streaming: false,
        }
    }

    fn create_test_sandbox_manager() -> Arc<dyn SandboxManager> {
        // 使用平台特定的沙箱管理器
        #[cfg(target_os = "macos")]
        {
            Arc::new(crate::sandbox::SeatbeltSandboxManager::new())
        }
        #[cfg(target_os = "linux")]
        {
            Arc::new(crate::sandbox::BubblewrapSandboxManager::new())
        }
    }

    fn create_simple_response(content: &str) -> ChatResponse {
        ChatResponse {
            id: "resp-1".to_string(),
            model: "gpt-4o".to_string(),
            message: crate::llm::Message {
                role: "assistant".to_string(),
                content: content.to_string(),
                tool_calls: None,
            },
            usage: Usage {
                prompt_tokens: 10,
                completion_tokens: 20,
                total_tokens: 30,
            },
        }
    }

    fn create_tool_call_response(content: &str, tool_calls: Vec<ToolCall>) -> ChatResponse {
        ChatResponse {
            id: "resp-2".to_string(),
            model: "gpt-4o".to_string(),
            message: crate::llm::Message {
                role: "assistant".to_string(),
                content: content.to_string(),
                tool_calls: Some(tool_calls),
            },
            usage: Usage {
                prompt_tokens: 10,
                completion_tokens: 20,
                total_tokens: 30,
            },
        }
    }

    // -------------------------------------------------------
    // 简单对话测试
    // -------------------------------------------------------

    #[tokio::test]
    async fn test_simple_chat_no_tools() {
        let mock_provider = MockLlmProvider::new(vec![create_simple_response(
            "Hello, how can I help you?",
        )]);

        let mut agent = AgentLoop::new(
            Arc::new(mock_provider),
            ToolRegistry::new(),
            PermissionEngine::new(PermissionLevel::FullAccess),
            create_test_sandbox_manager(),
            create_test_context(),
            create_test_config(),
        );

        let response = agent.run("Hello").await.unwrap();

        assert_eq!(response.content, "Hello, how can I help you?");
        assert!(response.tool_calls.is_empty());
        assert!(response.is_final);
        assert_eq!(response.usage.total_tokens, 30);
        assert_eq!(agent.context().message_count(), 2); // user + assistant
    }

    // -------------------------------------------------------
    // 工具调用测试
    // -------------------------------------------------------

    #[tokio::test]
    async fn test_single_tool_call_round() {
        // 第一次响应包含工具调用
        let tool_call = ToolCall {
            id: "call_1".to_string(),
            name: "file/read".to_string(),
            arguments: json!({"path": "/tmp/test.txt"}),
        };

        // 第二次响应是最终文本
        let mock_provider = MockLlmProvider::new(vec![
            create_tool_call_response("Reading file...", vec![tool_call]),
            create_simple_response("File content: Hello, World!"),
        ]);

        let mut agent = AgentLoop::new(
            Arc::new(mock_provider),
            ToolRegistry::new(),
            PermissionEngine::new(PermissionLevel::FullAccess),
            create_test_sandbox_manager(),
            create_test_context(),
            create_test_config(),
        );

        let response = agent.run("读取 /tmp/test.txt").await.unwrap();

        assert_eq!(response.content, "File content: Hello, World!");
        assert!(response.is_final);
        // 上下文应包含: user + assistant(tool_calls) + tool + assistant(final)
        assert_eq!(agent.context().message_count(), 4);
    }

    #[tokio::test]
    async fn test_multiple_tool_calls_in_one_round() {
        let tool_calls = vec![
            ToolCall {
                id: "call_1".to_string(),
                name: "file/read".to_string(),
                arguments: json!({"path": "/tmp/a.txt"}),
            },
            ToolCall {
                id: "call_2".to_string(),
                name: "file/read".to_string(),
                arguments: json!({"path": "/tmp/b.txt"}),
            },
        ];

        let mock_provider = MockLlmProvider::new(vec![
            create_tool_call_response("Reading files...", tool_calls),
            create_simple_response("Both files read successfully."),
        ]);

        let mut agent = AgentLoop::new(
            Arc::new(mock_provider),
            ToolRegistry::new(),
            PermissionEngine::new(PermissionLevel::FullAccess),
            create_test_sandbox_manager(),
            create_test_context(),
            create_test_config(),
        );

        let response = agent.run("读取两个文件").await.unwrap();

        assert_eq!(response.content, "Both files read successfully.");
        // 上下文: user + assistant(2 tool_calls) + tool(1) + tool(2) + assistant
        assert_eq!(agent.context().message_count(), 5);
    }

    #[tokio::test]
    async fn test_max_tool_rounds_exceeded() {
        // 每次响应都包含工具调用，超过最大轮次
        let tool_call = ToolCall {
            id: "call_loop".to_string(),
            name: "file/read".to_string(),
            arguments: json!({"path": "/tmp/test.txt"}),
        };

        let mock_provider = MockLlmProvider::new(vec![
            create_tool_call_response("Round 1", vec![tool_call.clone()]),
            create_tool_call_response("Round 2", vec![tool_call.clone()]),
            create_tool_call_response("Round 3", vec![tool_call.clone()]),
        ]);

        let config = AgentLoopConfig {
            max_tool_rounds: 3,
            ..create_test_config()
        };

        let mut agent = AgentLoop::new(
            Arc::new(mock_provider),
            ToolRegistry::new(),
            PermissionEngine::new(PermissionLevel::FullAccess),
            create_test_sandbox_manager(),
            create_test_context(),
            config,
        );

        let response = agent.run("无限循环测试").await.unwrap();

        assert!(response.content.contains("最大工具调用轮次"));
        assert!(response.is_final);
    }

    // -------------------------------------------------------
    // 权限检查测试
    // -------------------------------------------------------

    #[tokio::test]
    async fn test_tool_permission_denied() {
        let tool_call = ToolCall {
            id: "call_1".to_string(),
            name: "shell/execute".to_string(),
            arguments: json!({"command": "ls -la"}),
        };

        let mock_provider = MockLlmProvider::new(vec![
            create_tool_call_response("Executing...", vec![tool_call]),
            create_simple_response("Permission denied for shell/execute."),
        ]);

        let mut agent = AgentLoop::new(
            Arc::new(mock_provider),
            ToolRegistry::new(),
            PermissionEngine::new(PermissionLevel::ReadOnly), // 权限不足
            create_test_sandbox_manager(),
            create_test_context(),
            create_test_config(),
        );

        let response = agent.run("执行命令").await.unwrap();

        // 工具调用被拒绝，但循环继续
        assert!(!response.is_final || response.content.contains("Permission"));
    }

    // -------------------------------------------------------
    // 上下文管理测试
    // -------------------------------------------------------

    #[tokio::test]
    async fn test_context_preserves_history() {
        let mock_provider = MockLlmProvider::new(vec![create_simple_response("Response 1")]);

        let mut agent = AgentLoop::new(
            Arc::new(mock_provider),
            ToolRegistry::new(),
            PermissionEngine::new(PermissionLevel::FullAccess),
            create_test_sandbox_manager(),
            create_test_context(),
            create_test_config(),
        );

        agent.run("Message 1").await.unwrap();

        // 验证上下文保留了历史
        let messages = agent.context().get_messages();
        assert_eq!(messages.len(), 2);
        assert_eq!(messages[0].role, "user");
        assert_eq!(messages[0].content, "Message 1");
        assert_eq!(messages[1].role, "assistant");
    }

    // -------------------------------------------------------
    // 配置测试
    // -------------------------------------------------------

    #[test]
    fn test_agent_loop_config_default() {
        let config = AgentLoopConfig::default();
        assert_eq!(config.max_tool_rounds, 10);
        assert_eq!(config.model, "gpt-4o");
        assert_eq!(config.temperature, Some(0.7));
        assert_eq!(config.max_tokens, Some(4096));
        assert!(config.system_prompt.is_none());
        assert!(!config.enable_streaming);
    }
}
