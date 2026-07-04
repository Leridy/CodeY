//! LLM Provider trait - unified interface for all LLM providers.

use anyhow::Result;
use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use serde_json::Value;

/// LLM Provider trait - unified interface for all LLM providers.
#[async_trait]
pub trait LlmProvider: Send + Sync {
    /// Get provider ID.
    fn id(&self) -> &str;

    /// Get provider name.
    fn name(&self) -> &str;

    /// Clone into a boxed trait object.
    fn clone_box(&self) -> Box<dyn LlmProvider>;

    /// Get available models.
    async fn models(&self) -> Result<Vec<Model>>;

    /// Chat completion.
    async fn chat(&self, request: ChatRequest) -> Result<ChatResponse>;

    /// Stream chat completion.
    async fn stream_chat(&self, request: ChatRequest) -> Result<ChatStream>;

    /// Check if provider supports streaming.
    fn supports_streaming(&self) -> bool;

    /// Check if provider supports function calling.
    fn supports_function_calling(&self) -> bool;
}

impl Clone for Box<dyn LlmProvider> {
    fn clone(&self) -> Self {
        self.clone_box()
    }
}

/// Model information.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Model {
    pub id: String,
    pub name: String,
    pub context_window: Option<u32>,
    pub max_output_tokens: Option<u32>,
}

/// Chat request.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatRequest {
    pub model: String,
    pub messages: Vec<Message>,
    pub temperature: Option<f32>,
    pub max_tokens: Option<u32>,
    /// Streaming is determined by calling `chat()` vs `stream_chat()`.
    /// This field exists for serialization/deserialization compatibility
    /// with API wire formats that include a `stream` flag.
    pub stream: bool,
    pub tools: Option<Vec<Tool>>,
}

/// Message.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Message {
    pub role: String,
    pub content: String,
    pub tool_calls: Option<Vec<ToolCall>>,
}

/// Tool definition.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Tool {
    pub name: String,
    pub description: String,
    pub parameters: Value,
}

/// Tool call from the model.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct ToolCall {
    pub id: String,
    pub name: String,
    pub arguments: Value,
}

/// Chat response.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatResponse {
    pub id: String,
    pub model: String,
    pub message: Message,
    pub usage: Usage,
}

/// Usage statistics.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Usage {
    pub prompt_tokens: u32,
    pub completion_tokens: u32,
    pub total_tokens: u32,
}

/// Chat stream.
pub struct ChatStream {
    pub receiver: tokio::sync::mpsc::Receiver<StreamChunk>,
}

impl ChatStream {
    /// Create a new ChatStream from a receiver.
    pub fn new(receiver: tokio::sync::mpsc::Receiver<StreamChunk>) -> Self {
        Self { receiver }
    }

    /// Receive the next chunk from the stream.
    pub async fn recv(&mut self) -> Option<StreamChunk> {
        self.receiver.recv().await
    }
}

/// Stream chunk.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct StreamChunk {
    pub delta: String,
    pub finish_reason: Option<String>,
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    // -------------------------------------------------------
    // Model
    // -------------------------------------------------------

    #[test]
    fn test_model_creation() {
        let model = Model {
            id: "gpt-4o".to_string(),
            name: "GPT-4o".to_string(),
            context_window: Some(128_000),
            max_output_tokens: Some(4_096),
        };

        assert_eq!(model.id, "gpt-4o");
        assert_eq!(model.name, "GPT-4o");
        assert_eq!(model.context_window, Some(128_000));
        assert_eq!(model.max_output_tokens, Some(4_096));
    }

    #[test]
    fn test_model_with_optional_fields_none() {
        let model = Model {
            id: "local-model".to_string(),
            name: "Local Model".to_string(),
            context_window: None,
            max_output_tokens: None,
        };

        assert!(model.context_window.is_none());
        assert!(model.max_output_tokens.is_none());
    }

    #[test]
    fn test_model_serialization_roundtrip() {
        let model = Model {
            id: "gpt-4o".to_string(),
            name: "GPT-4o".to_string(),
            context_window: Some(128_000),
            max_output_tokens: Some(4_096),
        };

        let json_str = serde_json::to_string(&model).unwrap();
        let deserialized: Model = serde_json::from_str(&json_str).unwrap();
        assert_eq!(deserialized, model);
    }

    // -------------------------------------------------------
    // Message
    // -------------------------------------------------------

    #[test]
    fn test_message_creation() {
        let msg = Message {
            role: "user".to_string(),
            content: "Hello, world!".to_string(),
            tool_calls: None,
        };

        assert_eq!(msg.role, "user");
        assert_eq!(msg.content, "Hello, world!");
        assert!(msg.tool_calls.is_none());
    }

    #[test]
    fn test_message_with_tool_calls() {
        let tool_call = ToolCall {
            id: "call_123".to_string(),
            name: "get_weather".to_string(),
            arguments: json!({"location": "San Francisco"}),
        };

        let msg = Message {
            role: "assistant".to_string(),
            content: String::new(),
            tool_calls: Some(vec![tool_call]),
        };

        assert_eq!(msg.role, "assistant");
        assert_eq!(msg.tool_calls.as_ref().unwrap().len(), 1);
        assert_eq!(msg.tool_calls.as_ref().unwrap()[0].id, "call_123");
    }

    #[test]
    fn test_message_serialization_roundtrip() {
        let msg = Message {
            role: "user".to_string(),
            content: "test content".to_string(),
            tool_calls: None,
        };

        let json_str = serde_json::to_string(&msg).unwrap();
        let deserialized: Message = serde_json::from_str(&json_str).unwrap();
        assert_eq!(deserialized, msg);
    }

    // -------------------------------------------------------
    // Tool
    // -------------------------------------------------------

    #[test]
    fn test_tool_creation() {
        let tool = Tool {
            name: "get_weather".to_string(),
            description: "Get weather for a location".to_string(),
            parameters: json!({
                "type": "object",
                "properties": {
                    "location": {"type": "string"}
                },
                "required": ["location"]
            }),
        };

        assert_eq!(tool.name, "get_weather");
        assert!(tool.parameters.is_object());
    }

    // -------------------------------------------------------
    // ToolCall
    // -------------------------------------------------------

    #[test]
    fn test_tool_call_serialization_roundtrip() {
        let tool_call = ToolCall {
            id: "call_abc".to_string(),
            name: "read_file".to_string(),
            arguments: json!({"path": "/tmp/test.txt"}),
        };

        let json_str = serde_json::to_string(&tool_call).unwrap();
        let deserialized: ToolCall = serde_json::from_str(&json_str).unwrap();
        assert_eq!(deserialized, tool_call);
    }

    // -------------------------------------------------------
    // ChatRequest
    // -------------------------------------------------------

    #[test]
    fn test_chat_request_creation() {
        let request = ChatRequest {
            model: "gpt-4o".to_string(),
            messages: vec![Message {
                role: "user".to_string(),
                content: "Hello".to_string(),
                tool_calls: None,
            }],
            temperature: Some(0.7),
            max_tokens: Some(1024),
            stream: false,
            tools: None,
        };

        assert_eq!(request.model, "gpt-4o");
        assert_eq!(request.messages.len(), 1);
        assert_eq!(request.temperature, Some(0.7));
        assert!(!request.stream);
    }

    #[test]
    fn test_chat_request_with_tools() {
        let tool = Tool {
            name: "search".to_string(),
            description: "Search the web".to_string(),
            parameters: json!({"type": "object"}),
        };

        let request = ChatRequest {
            model: "gpt-4o".to_string(),
            messages: vec![],
            temperature: None,
            max_tokens: None,
            stream: false,
            tools: Some(vec![tool]),
        };

        assert!(request.tools.is_some());
        assert_eq!(request.tools.unwrap().len(), 1);
    }

    #[test]
    fn test_chat_request_serialization_roundtrip() {
        let request = ChatRequest {
            model: "gpt-4o".to_string(),
            messages: vec![Message {
                role: "user".to_string(),
                content: "Hi".to_string(),
                tool_calls: None,
            }],
            temperature: Some(0.5),
            max_tokens: Some(256),
            stream: true,
            tools: None,
        };

        let json_str = serde_json::to_string(&request).unwrap();
        let deserialized: ChatRequest = serde_json::from_str(&json_str).unwrap();

        assert_eq!(deserialized.model, request.model);
        assert_eq!(deserialized.messages.len(), 1);
        assert_eq!(deserialized.temperature, Some(0.5));
        assert!(deserialized.stream);
    }

    // -------------------------------------------------------
    // ChatResponse
    // -------------------------------------------------------

    #[test]
    fn test_chat_response_creation() {
        let response = ChatResponse {
            id: "chatcmpl-123".to_string(),
            model: "gpt-4o".to_string(),
            message: Message {
                role: "assistant".to_string(),
                content: "Hello! How can I help?".to_string(),
                tool_calls: None,
            },
            usage: Usage {
                prompt_tokens: 10,
                completion_tokens: 8,
                total_tokens: 18,
            },
        };

        assert_eq!(response.id, "chatcmpl-123");
        assert_eq!(response.message.role, "assistant");
        assert_eq!(response.usage.total_tokens, 18);
    }

    #[test]
    fn test_chat_response_serialization_roundtrip() {
        let response = ChatResponse {
            id: "resp-1".to_string(),
            model: "gpt-4o".to_string(),
            message: Message {
                role: "assistant".to_string(),
                content: "Reply".to_string(),
                tool_calls: None,
            },
            usage: Usage {
                prompt_tokens: 5,
                completion_tokens: 3,
                total_tokens: 8,
            },
        };

        let json_str = serde_json::to_string(&response).unwrap();
        let deserialized: ChatResponse = serde_json::from_str(&json_str).unwrap();

        assert_eq!(deserialized.id, response.id);
        assert_eq!(deserialized.usage.total_tokens, 8);
    }

    // -------------------------------------------------------
    // Usage
    // -------------------------------------------------------

    #[test]
    fn test_usage_tokens() {
        let usage = Usage {
            prompt_tokens: 100,
            completion_tokens: 50,
            total_tokens: 150,
        };

        assert_eq!(
            usage.prompt_tokens + usage.completion_tokens,
            usage.total_tokens
        );
    }

    // -------------------------------------------------------
    // StreamChunk
    // -------------------------------------------------------

    #[test]
    fn test_stream_chunk_creation() {
        let chunk = StreamChunk {
            delta: "Hello".to_string(),
            finish_reason: None,
        };

        assert_eq!(chunk.delta, "Hello");
        assert!(chunk.finish_reason.is_none());
    }

    #[test]
    fn test_stream_chunk_with_finish_reason() {
        let chunk = StreamChunk {
            delta: String::new(),
            finish_reason: Some("stop".to_string()),
        };

        assert!(chunk.delta.is_empty());
        assert_eq!(chunk.finish_reason.unwrap(), "stop");
    }

    #[test]
    fn test_stream_chunk_serialization_roundtrip() {
        let chunk = StreamChunk {
            delta: "partial text".to_string(),
            finish_reason: Some("stop".to_string()),
        };

        let json_str = serde_json::to_string(&chunk).unwrap();
        let deserialized: StreamChunk = serde_json::from_str(&json_str).unwrap();
        assert_eq!(deserialized, chunk);
    }

    // -------------------------------------------------------
    // ChatStream
    // -------------------------------------------------------

    #[tokio::test]
    async fn test_chat_stream_receives_chunks() {
        let (tx, rx) = tokio::sync::mpsc::channel(16);
        let stream = ChatStream::new(rx);

        tx.send(StreamChunk {
            delta: "Hello".to_string(),
            finish_reason: None,
        })
        .await
        .unwrap();

        tx.send(StreamChunk {
            delta: " world".to_string(),
            finish_reason: Some("stop".to_string()),
        })
        .await
        .unwrap();

        drop(tx);

        let mut chunks = Vec::new();
        let mut stream = stream;
        while let Some(chunk) = stream.recv().await {
            chunks.push(chunk);
        }

        assert_eq!(chunks.len(), 2);
        assert_eq!(chunks[0].delta, "Hello");
        assert_eq!(chunks[1].delta, " world");
        assert_eq!(chunks[1].finish_reason.as_deref(), Some("stop"));
    }

    #[tokio::test]
    async fn test_chat_stream_empty() {
        let (tx, rx) = tokio::sync::mpsc::channel(16);
        let stream = ChatStream::new(rx);
        drop(tx);

        let mut chunks = Vec::new();
        let mut stream = stream;
        while let Some(chunk) = stream.recv().await {
            chunks.push(chunk);
        }

        assert!(chunks.is_empty());
    }
}
