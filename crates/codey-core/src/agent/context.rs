//! Agent 上下文管理
//!
//! 管理 Agent 对话的完整上下文，包括消息历史、工具调用记录和 LLM 消息转换

use serde::{Deserialize, Serialize};
use serde_json::Value;

use crate::llm::{Message as LlmMessage, ToolCall};

/// Agent 对话上下文
///
/// 维护完整的对话历史，支持消息管理和 LLM 格式转换
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Context {
    /// 会话 ID
    pub conversation_id: String,

    /// 消息列表
    pub messages: Vec<Message>,

    /// 工作目录
    pub working_directory: String,

    /// 已执行的工具调用记录
    pub executed_tool_calls: Vec<ExecutedToolCallRecord>,
}

/// 上下文中的消息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Message {
    /// 角色 (user / assistant / system / tool)
    pub role: String,

    /// 消息内容
    pub content: String,

    /// 工具调用列表（仅 assistant 消息）
    pub tool_calls: Option<Vec<ToolCall>>,

    /// 工具调用 ID（仅 tool 角色消息，用于关联结果）
    pub tool_call_id: Option<String>,
}

/// 已执行的工具调用记录
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExecutedToolCallRecord {
    /// 工具调用 ID
    pub call_id: String,

    /// 工具名称
    pub tool_name: String,

    /// 调用参数
    pub arguments: Value,

    /// 执行结果内容
    pub result_content: String,

    /// 是否执行成功
    pub is_success: bool,
}

impl Context {
    /// 创建新的上下文
    ///
    /// # Arguments
    /// * `conversation_id` - 会话 ID
    /// * `working_directory` - 工作目录路径
    pub fn new(conversation_id: &str, working_directory: &str) -> Self {
        Self {
            conversation_id: conversation_id.to_string(),
            messages: Vec::new(),
            working_directory: working_directory.to_string(),
            executed_tool_calls: Vec::new(),
        }
    }

    /// 添加用户消息
    ///
    /// # Arguments
    /// * `content` - 消息内容
    pub fn add_user_message(&mut self, content: &str) {
        self.messages.push(Message {
            role: "user".to_string(),
            content: content.to_string(),
            tool_calls: None,
            tool_call_id: None,
        });
    }

    /// 添加助手消息（可能包含工具调用）
    ///
    /// # Arguments
    /// * `content` - 消息内容
    /// * `tool_calls` - 工具调用列表（可选）
    pub fn add_assistant_message(&mut self, content: &str, tool_calls: Option<Vec<ToolCall>>) {
        self.messages.push(Message {
            role: "assistant".to_string(),
            content: content.to_string(),
            tool_calls,
            tool_call_id: None,
        });
    }

    /// 添加系统消息
    ///
    /// # Arguments
    /// * `content` - 系统提示内容
    pub fn add_system_message(&mut self, content: &str) {
        self.messages.push(Message {
            role: "system".to_string(),
            content: content.to_string(),
            tool_calls: None,
            tool_call_id: None,
        });
    }

    /// 添加工具执行结果
    ///
    /// # Arguments
    /// * `tool_call_id` - 工具调用 ID
    /// * `content` - 工具执行结果内容
    pub fn add_tool_result(&mut self, tool_call_id: &str, content: &str) {
        self.messages.push(Message {
            role: "tool".to_string(),
            content: content.to_string(),
            tool_calls: None,
            tool_call_id: Some(tool_call_id.to_string()),
        });
    }

    /// 记录已执行的工具调用
    ///
    /// # Arguments
    /// * `record` - 工具调用执行记录
    pub fn record_tool_execution(&mut self, record: ExecutedToolCallRecord) {
        self.executed_tool_calls.push(record);
    }

    /// 将上下文消息转换为 LLM 消息格式
    ///
    /// 过滤掉 system 角色消息（系统提示通过独立参数传递），
    /// 并将 tool 角色消息正确映射为 LLM 格式
    ///
    /// # Returns
    /// LLM 消息列表
    pub fn to_llm_messages(&self) -> Vec<LlmMessage> {
        self.messages
            .iter()
            .filter(|msg| msg.role != "system")
            .map(|msg| LlmMessage {
                role: msg.role.clone(),
                content: msg.content.clone(),
                tool_calls: msg.tool_calls.clone(),
                tool_call_id: msg.tool_call_id.clone(),
            })
            .collect()
    }

    /// 获取所有消息的只读引用
    pub fn get_messages(&self) -> &[Message] {
        &self.messages
    }

    /// 获取消息数量
    pub fn message_count(&self) -> usize {
        self.messages.len()
    }

    /// 清空所有消息
    pub fn clear(&mut self) {
        self.messages.clear();
        self.executed_tool_calls.clear();
    }

    /// 获取已执行的工具调用数量
    pub fn tool_call_count(&self) -> usize {
        self.executed_tool_calls.len()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    // -------------------------------------------------------
    // Context 创建
    // -------------------------------------------------------

    #[test]
    fn test_context_creation() {
        let ctx = Context::new("conv-1", "/tmp");
        assert_eq!(ctx.conversation_id, "conv-1");
        assert_eq!(ctx.working_directory, "/tmp");
        assert!(ctx.messages.is_empty());
        assert!(ctx.executed_tool_calls.is_empty());
    }

    // -------------------------------------------------------
    // 添加消息
    // -------------------------------------------------------

    #[test]
    fn test_add_user_message() {
        let mut ctx = Context::new("conv-1", "/tmp");
        ctx.add_user_message("Hello, world!");

        assert_eq!(ctx.message_count(), 1);
        assert_eq!(ctx.messages[0].role, "user");
        assert_eq!(ctx.messages[0].content, "Hello, world!");
        assert!(ctx.messages[0].tool_calls.is_none());
        assert!(ctx.messages[0].tool_call_id.is_none());
    }

    #[test]
    fn test_add_assistant_message_without_tools() {
        let mut ctx = Context::new("conv-1", "/tmp");
        ctx.add_assistant_message("Hi there!", None);

        assert_eq!(ctx.message_count(), 1);
        assert_eq!(ctx.messages[0].role, "assistant");
        assert_eq!(ctx.messages[0].content, "Hi there!");
        assert!(ctx.messages[0].tool_calls.is_none());
    }

    #[test]
    fn test_add_assistant_message_with_tool_calls() {
        let mut ctx = Context::new("conv-1", "/tmp");
        let tool_calls = vec![ToolCall {
            id: "call_1".to_string(),
            name: "file/read".to_string(),
            arguments: json!({"path": "/tmp/test.txt"}),
        }];
        ctx.add_assistant_message("Reading file...", Some(tool_calls));

        assert_eq!(ctx.message_count(), 1);
        assert_eq!(ctx.messages[0].role, "assistant");
        assert!(ctx.messages[0].tool_calls.is_some());
        assert_eq!(ctx.messages[0].tool_calls.as_ref().unwrap().len(), 1);
    }

    #[test]
    fn test_add_system_message() {
        let mut ctx = Context::new("conv-1", "/tmp");
        ctx.add_system_message("You are a helpful assistant.");

        assert_eq!(ctx.message_count(), 1);
        assert_eq!(ctx.messages[0].role, "system");
        assert_eq!(ctx.messages[0].content, "You are a helpful assistant.");
    }

    #[test]
    fn test_add_tool_result() {
        let mut ctx = Context::new("conv-1", "/tmp");
        ctx.add_tool_result("call_1", "file content here");

        assert_eq!(ctx.message_count(), 1);
        assert_eq!(ctx.messages[0].role, "tool");
        assert_eq!(ctx.messages[0].content, "file content here");
        assert_eq!(
            ctx.messages[0].tool_call_id,
            Some("call_1".to_string())
        );
    }

    // -------------------------------------------------------
    // 工具执行记录
    // -------------------------------------------------------

    #[test]
    fn test_record_tool_execution() {
        let mut ctx = Context::new("conv-1", "/tmp");
        ctx.record_tool_execution(ExecutedToolCallRecord {
            call_id: "call_1".to_string(),
            tool_name: "file/read".to_string(),
            arguments: json!({"path": "/tmp/test.txt"}),
            result_content: "file content".to_string(),
            is_success: true,
        });

        assert_eq!(ctx.tool_call_count(), 1);
        assert_eq!(ctx.executed_tool_calls[0].tool_name, "file/read");
        assert!(ctx.executed_tool_calls[0].is_success);
    }

    // -------------------------------------------------------
    // to_llm_messages
    // -------------------------------------------------------

    #[test]
    fn test_to_llm_messages_filters_system() {
        let mut ctx = Context::new("conv-1", "/tmp");
        ctx.add_system_message("System prompt");
        ctx.add_user_message("Hello");
        ctx.add_assistant_message("Hi!", None);

        let llm_messages = ctx.to_llm_messages();
        assert_eq!(llm_messages.len(), 2);
        assert_eq!(llm_messages[0].role, "user");
        assert_eq!(llm_messages[1].role, "assistant");
    }

    #[test]
    fn test_to_llm_messages_preserves_tool_calls() {
        let mut ctx = Context::new("conv-1", "/tmp");
        let tool_calls = vec![ToolCall {
            id: "call_1".to_string(),
            name: "file/read".to_string(),
            arguments: json!({"path": "/tmp/test.txt"}),
        }];
        ctx.add_assistant_message("Reading...", Some(tool_calls));
        ctx.add_tool_result("call_1", "file content");

        let llm_messages = ctx.to_llm_messages();
        assert_eq!(llm_messages.len(), 2);
        assert!(llm_messages[0].tool_calls.is_some());
        assert_eq!(llm_messages[1].role, "tool");
    }

    #[test]
    fn test_to_llm_messages_empty() {
        let ctx = Context::new("conv-1", "/tmp");
        let llm_messages = ctx.to_llm_messages();
        assert!(llm_messages.is_empty());
    }

    // -------------------------------------------------------
    // 其他方法
    // -------------------------------------------------------

    #[test]
    fn test_get_messages() {
        let mut ctx = Context::new("conv-1", "/tmp");
        ctx.add_user_message("Hello");
        ctx.add_assistant_message("Hi!", None);

        let messages = ctx.get_messages();
        assert_eq!(messages.len(), 2);
    }

    #[test]
    fn test_message_count() {
        let mut ctx = Context::new("conv-1", "/tmp");
        assert_eq!(ctx.message_count(), 0);

        ctx.add_user_message("Hello");
        assert_eq!(ctx.message_count(), 1);

        ctx.add_assistant_message("Hi!", None);
        assert_eq!(ctx.message_count(), 2);
    }

    #[test]
    fn test_clear() {
        let mut ctx = Context::new("conv-1", "/tmp");
        ctx.add_user_message("Hello");
        ctx.add_assistant_message("Hi!", None);
        ctx.record_tool_execution(ExecutedToolCallRecord {
            call_id: "call_1".to_string(),
            tool_name: "file/read".to_string(),
            arguments: json!({}),
            result_content: "content".to_string(),
            is_success: true,
        });

        assert_eq!(ctx.message_count(), 2);
        assert_eq!(ctx.tool_call_count(), 1);

        ctx.clear();
        assert_eq!(ctx.message_count(), 0);
        assert_eq!(ctx.tool_call_count(), 0);
    }

    // -------------------------------------------------------
    // 序列化往返
    // -------------------------------------------------------

    #[test]
    fn test_context_serialization_roundtrip() {
        let mut ctx = Context::new("conv-1", "/tmp");
        ctx.add_system_message("System prompt");
        ctx.add_user_message("Hello");
        ctx.add_assistant_message(
            "Reading...",
            Some(vec![ToolCall {
                id: "call_1".to_string(),
                name: "file/read".to_string(),
                arguments: json!({"path": "/tmp/test.txt"}),
            }]),
        );
        ctx.add_tool_result("call_1", "file content");
        ctx.record_tool_execution(ExecutedToolCallRecord {
            call_id: "call_1".to_string(),
            tool_name: "file/read".to_string(),
            arguments: json!({"path": "/tmp/test.txt"}),
            result_content: "file content".to_string(),
            is_success: true,
        });

        let json_str = serde_json::to_string(&ctx).unwrap();
        let deserialized: Context = serde_json::from_str(&json_str).unwrap();

        assert_eq!(deserialized.conversation_id, "conv-1");
        assert_eq!(deserialized.message_count(), 4);
        assert_eq!(deserialized.tool_call_count(), 1);
    }

    #[test]
    fn test_full_conversation_flow() {
        let mut ctx = Context::new("conv-1", "/tmp");

        // 1. 添加系统提示
        ctx.add_system_message("You are a helpful assistant.");

        // 2. 用户提问
        ctx.add_user_message("读取 /tmp/test.txt 文件内容");

        // 3. 助手响应，调用工具
        let tool_calls = vec![ToolCall {
            id: "call_1".to_string(),
            name: "file/read".to_string(),
            arguments: json!({"path": "/tmp/test.txt"}),
        }];
        ctx.add_assistant_message("我来读取文件。", Some(tool_calls));

        // 4. 工具结果
        ctx.add_tool_result("call_1", "Hello, World!");

        // 5. 记录执行
        ctx.record_tool_execution(ExecutedToolCallRecord {
            call_id: "call_1".to_string(),
            tool_name: "file/read".to_string(),
            arguments: json!({"path": "/tmp/test.txt"}),
            result_content: "Hello, World!".to_string(),
            is_success: true,
        });

        // 6. 助手最终响应
        ctx.add_assistant_message("文件内容是: Hello, World!", None);

        // 验证
        assert_eq!(ctx.message_count(), 5);
        assert_eq!(ctx.tool_call_count(), 1);

        // 验证 LLM 消息（过滤 system）
        let llm_messages = ctx.to_llm_messages();
        assert_eq!(llm_messages.len(), 4);
    }
}
