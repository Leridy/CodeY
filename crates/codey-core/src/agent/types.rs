//! Agent Loop 核心类型定义
//!
//! 定义 Agent 循环中使用的所有核心类型，包括配置、响应、工具调用结果等

use serde::{Deserialize, Serialize};
use serde_json::Value;

use crate::llm::{ToolCall, Usage};

/// Agent Loop 配置
///
/// 控制 Agent 循环的行为参数
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentLoopConfig {
    /// 最大工具调用轮次，防止无限循环
    pub max_tool_rounds: u32,

    /// LLM 模型名称
    pub model: String,

    /// 温度参数 (0.0 - 2.0)
    pub temperature: Option<f32>,

    /// 最大输出 token 数
    pub max_tokens: Option<u32>,

    /// 系统提示词
    pub system_prompt: Option<String>,

    /// 是否启用流式响应
    pub enable_streaming: bool,
}

impl Default for AgentLoopConfig {
    fn default() -> Self {
        Self {
            max_tool_rounds: 10,
            model: "gpt-4o".to_string(),
            temperature: Some(0.7),
            max_tokens: Some(4096),
            system_prompt: None,
            enable_streaming: false,
        }
    }
}

/// Agent 响应
///
/// 包含 LLM 返回的内容、工具调用列表和 token 使用统计
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentResponse {
    /// 响应文本内容
    pub content: String,

    /// 工具调用列表（可能为空）
    pub tool_calls: Vec<ToolCall>,

    /// 是否是最终响应（无更多工具调用）
    pub is_final: bool,

    /// Token 使用统计
    pub usage: Usage,
}

impl AgentResponse {
    /// 创建一个纯文本响应（无工具调用）
    pub fn text(content: impl Into<String>, usage: Usage) -> Self {
        Self {
            content: content.into(),
            tool_calls: Vec::new(),
            is_final: true,
            usage,
        }
    }

    /// 创建一个包含工具调用的响应
    pub fn with_tool_calls(
        content: impl Into<String>,
        tool_calls: Vec<ToolCall>,
        usage: Usage,
    ) -> Self {
        Self {
            content: content.into(),
            tool_calls,
            is_final: false,
            usage,
        }
    }

    /// 检查响应是否包含工具调用
    pub fn has_tool_calls(&self) -> bool {
        !self.tool_calls.is_empty()
    }
}

/// 已执行的工具调用记录
///
/// 记录单个工具调用的完整执行过程
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExecutedToolCall {
    /// 工具调用 ID
    pub call_id: String,

    /// 工具名称
    pub tool_name: String,

    /// 调用参数
    pub arguments: Value,

    /// 执行结果
    pub result: ToolExecutionResult,
}

/// 工具执行结果
///
/// 表示工具执行的成功或失败状态
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ToolExecutionResult {
    /// 执行成功，包含输出内容
    Success(String),

    /// 执行失败，包含错误信息
    Error(String),
}

impl ToolExecutionResult {
    /// 检查是否执行成功
    pub fn is_success(&self) -> bool {
        matches!(self, ToolExecutionResult::Success(_))
    }

    /// 获取结果内容（成功时返回输出，失败时返回错误信息）
    pub fn content(&self) -> &str {
        match self {
            ToolExecutionResult::Success(s) => s,
            ToolExecutionResult::Error(e) => e,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    // -------------------------------------------------------
    // AgentLoopConfig
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

    #[test]
    fn test_agent_loop_config_serialization_roundtrip() {
        let config = AgentLoopConfig {
            max_tool_rounds: 5,
            model: "claude-3-opus".to_string(),
            temperature: Some(0.5),
            max_tokens: Some(2048),
            system_prompt: Some("You are a helpful assistant.".to_string()),
            enable_streaming: true,
        };

        let json_str = serde_json::to_string(&config).unwrap();
        let deserialized: AgentLoopConfig = serde_json::from_str(&json_str).unwrap();

        assert_eq!(deserialized.max_tool_rounds, 5);
        assert_eq!(deserialized.model, "claude-3-opus");
        assert_eq!(deserialized.temperature, Some(0.5));
        assert_eq!(deserialized.max_tokens, Some(2048));
        assert_eq!(
            deserialized.system_prompt,
            Some("You are a helpful assistant.".to_string())
        );
        assert!(deserialized.enable_streaming);
    }

    // -------------------------------------------------------
    // AgentResponse
    // -------------------------------------------------------

    #[test]
    fn test_agent_response_text() {
        let usage = Usage {
            prompt_tokens: 10,
            completion_tokens: 20,
            total_tokens: 30,
        };
        let response = AgentResponse::text("Hello, world!", usage);

        assert_eq!(response.content, "Hello, world!");
        assert!(response.tool_calls.is_empty());
        assert!(response.is_final);
        assert_eq!(response.usage.total_tokens, 30);
    }

    #[test]
    fn test_agent_response_with_tool_calls() {
        let tool_call = ToolCall {
            id: "call_1".to_string(),
            name: "file/read".to_string(),
            arguments: json!({"path": "/tmp/test.txt"}),
        };
        let usage = Usage {
            prompt_tokens: 10,
            completion_tokens: 20,
            total_tokens: 30,
        };
        let response = AgentResponse::with_tool_calls(
            "Reading file...",
            vec![tool_call],
            usage,
        );

        assert_eq!(response.content, "Reading file...");
        assert_eq!(response.tool_calls.len(), 1);
        assert!(!response.is_final);
        assert!(response.has_tool_calls());
    }

    #[test]
    fn test_agent_response_has_tool_calls_false() {
        let usage = Usage {
            prompt_tokens: 10,
            completion_tokens: 20,
            total_tokens: 30,
        };
        let response = AgentResponse::text("Done", usage);
        assert!(!response.has_tool_calls());
    }

    #[test]
    fn test_agent_response_serialization_roundtrip() {
        let usage = Usage {
            prompt_tokens: 10,
            completion_tokens: 20,
            total_tokens: 30,
        };
        let response = AgentResponse::text("Test", usage);

        let json_str = serde_json::to_string(&response).unwrap();
        let deserialized: AgentResponse = serde_json::from_str(&json_str).unwrap();

        assert_eq!(deserialized.content, "Test");
        assert!(deserialized.is_final);
    }

    // -------------------------------------------------------
    // ExecutedToolCall
    // -------------------------------------------------------

    #[test]
    fn test_executed_tool_call_success() {
        let executed = ExecutedToolCall {
            call_id: "call_1".to_string(),
            tool_name: "file/read".to_string(),
            arguments: json!({"path": "/tmp/test.txt"}),
            result: ToolExecutionResult::Success("file content".to_string()),
        };

        assert_eq!(executed.call_id, "call_1");
        assert_eq!(executed.tool_name, "file/read");
        assert!(executed.result.is_success());
        assert_eq!(executed.result.content(), "file content");
    }

    #[test]
    fn test_executed_tool_call_error() {
        let executed = ExecutedToolCall {
            call_id: "call_2".to_string(),
            tool_name: "shell/execute".to_string(),
            arguments: json!({"command": "rm -rf /"}),
            result: ToolExecutionResult::Error("Permission denied".to_string()),
        };

        assert!(!executed.result.is_success());
        assert_eq!(executed.result.content(), "Permission denied");
    }

    #[test]
    fn test_executed_tool_call_serialization_roundtrip() {
        let executed = ExecutedToolCall {
            call_id: "call_3".to_string(),
            tool_name: "file/read".to_string(),
            arguments: json!({"path": "/tmp/test.txt"}),
            result: ToolExecutionResult::Success("content".to_string()),
        };

        let json_str = serde_json::to_string(&executed).unwrap();
        let deserialized: ExecutedToolCall = serde_json::from_str(&json_str).unwrap();

        assert_eq!(deserialized.call_id, "call_3");
        assert!(deserialized.result.is_success());
    }

    // -------------------------------------------------------
    // ToolExecutionResult
    // -------------------------------------------------------

    #[test]
    fn test_tool_execution_result_success() {
        let result = ToolExecutionResult::Success("output".to_string());
        assert!(result.is_success());
        assert_eq!(result.content(), "output");
    }

    #[test]
    fn test_tool_execution_result_error() {
        let result = ToolExecutionResult::Error("not found".to_string());
        assert!(!result.is_success());
        assert_eq!(result.content(), "not found");
    }
}
