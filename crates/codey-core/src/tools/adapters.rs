//! 工具调用适配器
//!
//! 提供不同 LLM 提供商的工具调用格式转换，
//! 支持 OpenAI Function Calling 和 Anthropic Tool Use 两种格式

use anyhow::Result;
use serde_json::{json, Value};

use crate::llm::{Tool, ToolCall};

/// 工具调用适配器 trait
///
/// 定义工具格式转换的统一接口
pub trait ToolCallAdapter: Send + Sync {
    /// 将工具定义转换为对应提供商的格式
    fn to_provider_tools(&self, tools: &[Tool]) -> Value;

    /// 从提供商响应中解析工具调用
    fn parse_tool_calls(&self, response: &Value) -> Result<Vec<ToolCall>>;
}

/// OpenAI Function Calling 适配器
///
/// 将工具定义转换为 OpenAI function calling 格式，
/// 并从 OpenAI 响应中解析工具调用
pub struct FunctionCallingAdapter;

impl ToolCallAdapter for FunctionCallingAdapter {
    /// 将工具列表转换为 OpenAI functions 格式
    ///
    /// # 格式示例
    /// ```json
    /// [
    ///   {
    ///     "type": "function",
    ///     "function": {
    ///       "name": "tool_name",
    ///       "description": "tool description",
    ///       "parameters": { ... }
    ///     }
    ///   }
    /// ]
    /// ```
    fn to_provider_tools(&self, tools: &[Tool]) -> Value {
        let functions: Vec<Value> = tools
            .iter()
            .map(|tool| {
                json!({
                    "type": "function",
                    "function": {
                        "name": tool.name,
                        "description": tool.description,
                        "parameters": tool.parameters,
                    }
                })
            })
            .collect();

        json!(functions)
    }

    /// 从 OpenAI 响应中解析工具调用
    ///
    /// 期望响应格式：
    /// ```json
    /// {
    ///   "choices": [{
    ///     "message": {
    ///       "tool_calls": [{
    ///         "id": "call_xxx",
    ///         "function": {
    ///           "name": "tool_name",
    ///           "arguments": "{ ... }"
    ///         }
    ///       }]
    ///     }
    ///   }]
    /// }
    /// ```
    fn parse_tool_calls(&self, response: &Value) -> Result<Vec<ToolCall>> {
        let tool_calls = response
            .get("choices")
            .and_then(|c| c.as_array())
            .and_then(|arr| arr.first())
            .and_then(|choice| choice.get("message"))
            .and_then(|msg| msg.get("tool_calls"))
            .and_then(|tc| tc.as_array());

        let Some(calls) = tool_calls else {
            return Ok(Vec::new());
        };

        let mut result = Vec::new();
        for call in calls {
            let id = call
                .get("id")
                .and_then(|v| v.as_str())
                .unwrap_or("")
                .to_string();

            let name = call
                .get("function")
                .and_then(|f| f.get("name"))
                .and_then(|v| v.as_str())
                .unwrap_or("")
                .to_string();

            let arguments = call
                .get("function")
                .and_then(|f| f.get("arguments"))
                .and_then(|v| v.as_str())
                .and_then(|s| serde_json::from_str(s).ok())
                .unwrap_or(json!({}));

            result.push(ToolCall {
                id,
                name,
                arguments,
            });
        }

        Ok(result)
    }
}

/// Anthropic Tool Use 适配器
///
/// 将工具定义转换为 Anthropic tool use 格式，
/// 并从 Anthropic 响应中解析工具调用
pub struct ToolUseAdapter;

impl ToolCallAdapter for ToolUseAdapter {
    /// 将工具列表转换为 Anthropic tools 格式
    ///
    /// # 格式示例
    /// ```json
    /// [
    ///   {
    ///     "name": "tool_name",
    ///     "description": "tool description",
    ///     "input_schema": { ... }
    ///   }
    /// ]
    /// ```
    fn to_provider_tools(&self, tools: &[Tool]) -> Value {
        let anthropic_tools: Vec<Value> = tools
            .iter()
            .map(|tool| {
                json!({
                    "name": tool.name,
                    "description": tool.description,
                    "input_schema": tool.parameters,
                })
            })
            .collect();

        json!(anthropic_tools)
    }

    /// 从 Anthropic 响应中解析工具调用
    ///
    /// 期望响应格式：
    /// ```json
    /// {
    ///   "content": [{
    ///     "type": "tool_use",
    ///     "id": "toolu_xxx",
    ///     "name": "tool_name",
    ///     "input": { ... }
    ///   }]
    /// }
    /// ```
    fn parse_tool_calls(&self, response: &Value) -> Result<Vec<ToolCall>> {
        let content = response
            .get("content")
            .and_then(|c| c.as_array());

        let Some(blocks) = content else {
            return Ok(Vec::new());
        };

        let mut result = Vec::new();
        for block in blocks {
            let block_type = block.get("type").and_then(|v| v.as_str());
            if block_type != Some("tool_use") {
                continue;
            }

            let id = block
                .get("id")
                .and_then(|v| v.as_str())
                .unwrap_or("")
                .to_string();

            let name = block
                .get("name")
                .and_then(|v| v.as_str())
                .unwrap_or("")
                .to_string();

            let arguments = block
                .get("input")
                .cloned()
                .unwrap_or(json!({}));

            result.push(ToolCall {
                id,
                name,
                arguments,
            });
        }

        Ok(result)
    }
}

/// 工具调用适配器工厂
///
/// 根据提供商类型创建对应的适配器实例
pub struct ToolCallAdapterFactory;

impl ToolCallAdapterFactory {
    /// 创建 OpenAI Function Calling 适配器
    pub fn openai() -> Box<dyn ToolCallAdapter> {
        Box::new(FunctionCallingAdapter)
    }

    /// 创建 Anthropic Tool Use 适配器
    pub fn anthropic() -> Box<dyn ToolCallAdapter> {
        Box::new(ToolUseAdapter)
    }

    /// 根据提供商名称创建适配器
    ///
    /// # Arguments
    /// * `provider` - 提供商名称 ("openai" 或 "anthropic")
    ///
    /// # Returns
    /// 对应的适配器实例
    ///
    /// # Errors
    /// 不支持的提供商名称时返回错误
    pub fn for_provider(provider: &str) -> Result<Box<dyn ToolCallAdapter>> {
        match provider.to_lowercase().as_str() {
            "openai" | "ollama" => Ok(Self::openai()),
            "anthropic" | "claude" => Ok(Self::anthropic()),
            _ => Err(anyhow::anyhow!("不支持的 LLM 提供商: {}", provider)),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    // 测试用工具定义
    fn create_test_tools() -> Vec<Tool> {
        vec![
            Tool {
                name: "file/read".to_string(),
                description: "Read file contents".to_string(),
                parameters: json!({
                    "type": "object",
                    "properties": {
                        "path": {
                            "type": "string",
                            "description": "File path to read"
                        }
                    },
                    "required": ["path"]
                }),
            },
            Tool {
                name: "shell/execute".to_string(),
                description: "Execute shell command".to_string(),
                parameters: json!({
                    "type": "object",
                    "properties": {
                        "command": {
                            "type": "string",
                            "description": "Command to execute"
                        }
                    },
                    "required": ["command"]
                }),
            },
        ]
    }

    // -------------------------------------------------------
    // FunctionCallingAdapter - to_provider_tools
    // -------------------------------------------------------

    #[test]
    fn test_to_openai_tools_format() {
        let adapter = FunctionCallingAdapter;
        let tools = create_test_tools();
        let result = adapter.to_provider_tools(&tools);

        let arr = result.as_array().unwrap();
        assert_eq!(arr.len(), 2);

        // 验证第一个工具
        assert_eq!(arr[0]["type"], "function");
        assert_eq!(arr[0]["function"]["name"], "file/read");
        assert_eq!(arr[0]["function"]["description"], "Read file contents");
        assert!(arr[0]["function"]["parameters"].is_object());

        // 验证第二个工具
        assert_eq!(arr[1]["function"]["name"], "shell/execute");
    }

    #[test]
    fn test_to_openai_tools_empty() {
        let adapter = FunctionCallingAdapter;
        let result = adapter.to_provider_tools(&[]);
        assert_eq!(result, json!([]));
    }

    // -------------------------------------------------------
    // FunctionCallingAdapter - parse_tool_calls
    // -------------------------------------------------------

    #[test]
    fn test_parse_openai_tool_calls() {
        let adapter = FunctionCallingAdapter;
        let response = json!({
            "choices": [{
                "message": {
                    "tool_calls": [
                        {
                            "id": "call_123",
                            "function": {
                                "name": "file/read",
                                "arguments": "{\"path\": \"/tmp/test.txt\"}"
                            }
                        }
                    ]
                }
            }]
        });

        let tool_calls = adapter.parse_tool_calls(&response).unwrap();
        assert_eq!(tool_calls.len(), 1);
        assert_eq!(tool_calls[0].id, "call_123");
        assert_eq!(tool_calls[0].name, "file/read");
        assert_eq!(tool_calls[0].arguments, json!({"path": "/tmp/test.txt"}));
    }

    #[test]
    fn test_parse_openai_multiple_tool_calls() {
        let adapter = FunctionCallingAdapter;
        let response = json!({
            "choices": [{
                "message": {
                    "tool_calls": [
                        {
                            "id": "call_1",
                            "function": {
                                "name": "file/read",
                                "arguments": "{\"path\": \"/tmp/a.txt\"}"
                            }
                        },
                        {
                            "id": "call_2",
                            "function": {
                                "name": "file/read",
                                "arguments": "{\"path\": \"/tmp/b.txt\"}"
                            }
                        }
                    ]
                }
            }]
        });

        let tool_calls = adapter.parse_tool_calls(&response).unwrap();
        assert_eq!(tool_calls.len(), 2);
        assert_eq!(tool_calls[0].id, "call_1");
        assert_eq!(tool_calls[1].id, "call_2");
    }

    #[test]
    fn test_parse_openai_no_tool_calls() {
        let adapter = FunctionCallingAdapter;
        let response = json!({
            "choices": [{
                "message": {
                    "content": "Hello, how can I help?"
                }
            }]
        });

        let tool_calls = adapter.parse_tool_calls(&response).unwrap();
        assert!(tool_calls.is_empty());
    }

    #[test]
    fn test_parse_openai_empty_response() {
        let adapter = FunctionCallingAdapter;
        let response = json!({});
        let tool_calls = adapter.parse_tool_calls(&response).unwrap();
        assert!(tool_calls.is_empty());
    }

    // -------------------------------------------------------
    // ToolUseAdapter - to_provider_tools
    // -------------------------------------------------------

    #[test]
    fn test_to_anthropic_tools_format() {
        let adapter = ToolUseAdapter;
        let tools = create_test_tools();
        let result = adapter.to_provider_tools(&tools);

        let arr = result.as_array().unwrap();
        assert_eq!(arr.len(), 2);

        // Anthropic 格式使用 input_schema 而非 parameters
        assert_eq!(arr[0]["name"], "file/read");
        assert_eq!(arr[0]["description"], "Read file contents");
        assert!(arr[0]["input_schema"].is_object());

        assert_eq!(arr[1]["name"], "shell/execute");
    }

    #[test]
    fn test_to_anthropic_tools_empty() {
        let adapter = ToolUseAdapter;
        let result = adapter.to_provider_tools(&[]);
        assert_eq!(result, json!([]));
    }

    // -------------------------------------------------------
    // ToolUseAdapter - parse_tool_calls
    // -------------------------------------------------------

    #[test]
    fn test_parse_anthropic_tool_use() {
        let adapter = ToolUseAdapter;
        let response = json!({
            "content": [
                {
                    "type": "text",
                    "text": "I'll read the file for you."
                },
                {
                    "type": "tool_use",
                    "id": "toolu_abc",
                    "name": "file/read",
                    "input": {
                        "path": "/tmp/test.txt"
                    }
                }
            ]
        });

        let tool_calls = adapter.parse_tool_calls(&response).unwrap();
        assert_eq!(tool_calls.len(), 1);
        assert_eq!(tool_calls[0].id, "toolu_abc");
        assert_eq!(tool_calls[0].name, "file/read");
        assert_eq!(tool_calls[0].arguments, json!({"path": "/tmp/test.txt"}));
    }

    #[test]
    fn test_parse_anthropic_multiple_tool_use() {
        let adapter = ToolUseAdapter;
        let response = json!({
            "content": [
                {
                    "type": "tool_use",
                    "id": "toolu_1",
                    "name": "file/read",
                    "input": {"path": "/tmp/a.txt"}
                },
                {
                    "type": "tool_use",
                    "id": "toolu_2",
                    "name": "file/read",
                    "input": {"path": "/tmp/b.txt"}
                }
            ]
        });

        let tool_calls = adapter.parse_tool_calls(&response).unwrap();
        assert_eq!(tool_calls.len(), 2);
        assert_eq!(tool_calls[0].id, "toolu_1");
        assert_eq!(tool_calls[1].id, "toolu_2");
    }

    #[test]
    fn test_parse_anthropic_no_tool_use() {
        let adapter = ToolUseAdapter;
        let response = json!({
            "content": [
                {
                    "type": "text",
                    "text": "Hello, how can I help?"
                }
            ]
        });

        let tool_calls = adapter.parse_tool_calls(&response).unwrap();
        assert!(tool_calls.is_empty());
    }

    #[test]
    fn test_parse_anthropic_empty_response() {
        let adapter = ToolUseAdapter;
        let response = json!({});
        let tool_calls = adapter.parse_tool_calls(&response).unwrap();
        assert!(tool_calls.is_empty());
    }

    // -------------------------------------------------------
    // ToolCallAdapterFactory
    // -------------------------------------------------------

    #[test]
    fn test_factory_openai() {
        let adapter = ToolCallAdapterFactory::openai();
        let tools = create_test_tools();
        let result = adapter.to_provider_tools(&tools);
        assert!(result.as_array().is_some());
    }

    #[test]
    fn test_factory_anthropic() {
        let adapter = ToolCallAdapterFactory::anthropic();
        let tools = create_test_tools();
        let result = adapter.to_provider_tools(&tools);
        assert!(result.as_array().is_some());
    }

    #[test]
    fn test_factory_for_provider_openai() {
        let adapter = ToolCallAdapterFactory::for_provider("openai").unwrap();
        let tools = create_test_tools();
        let result = adapter.to_provider_tools(&tools);
        // OpenAI 格式包含 "type": "function"
        assert_eq!(result.as_array().unwrap()[0]["type"], "function");
    }

    #[test]
    fn test_factory_for_provider_anthropic() {
        let adapter = ToolCallAdapterFactory::for_provider("anthropic").unwrap();
        let tools = create_test_tools();
        let result = adapter.to_provider_tools(&tools);
        // Anthropic 格式包含 "input_schema"
        assert!(result.as_array().unwrap()[0]["input_schema"].is_object());
    }

    #[test]
    fn test_factory_for_provider_claude() {
        let adapter = ToolCallAdapterFactory::for_provider("claude").unwrap();
        let tools = create_test_tools();
        let result = adapter.to_provider_tools(&tools);
        assert!(result.as_array().unwrap()[0]["input_schema"].is_object());
    }

    #[test]
    fn test_factory_for_provider_ollama() {
        let adapter = ToolCallAdapterFactory::for_provider("ollama").unwrap();
        let tools = create_test_tools();
        let result = adapter.to_provider_tools(&tools);
        assert_eq!(result.as_array().unwrap()[0]["type"], "function");
    }

    #[test]
    fn test_factory_for_provider_unsupported() {
        let result = ToolCallAdapterFactory::for_provider("unsupported");
        assert!(result.is_err());
        // 使用 if let 检查错误信息，因为 Box<dyn ToolCallAdapter> 不实现 Debug
        if let Err(e) = result {
            assert!(e.to_string().contains("不支持的 LLM 提供商"));
        }
    }

    #[test]
    fn test_factory_case_insensitive() {
        let adapter = ToolCallAdapterFactory::for_provider("OpenAI").unwrap();
        let tools = create_test_tools();
        let result = adapter.to_provider_tools(&tools);
        assert_eq!(result.as_array().unwrap()[0]["type"], "function");
    }
}
