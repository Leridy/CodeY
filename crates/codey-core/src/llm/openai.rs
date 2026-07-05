//! OpenAI LLM provider.

use anyhow::{Context, Result};
use async_trait::async_trait;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use serde_json::json;

use super::provider::{
    ChatRequest, ChatResponse, ChatStream, LlmProvider, Message, Model, StreamChunk, Tool,
    ToolCall, Usage,
};

const DEFAULT_BASE_URL: &str = "https://api.openai.com/v1";

/// OpenAI provider implementation.
#[derive(Debug, Clone)]
pub struct OpenAiProvider {
    api_key: String,
    base_url: String,
    client: Client,
}

impl OpenAiProvider {
    /// Create a new OpenAI provider with the given API key.
    pub fn new(api_key: String) -> Self {
        Self {
            api_key,
            base_url: DEFAULT_BASE_URL.to_string(),
            client: Client::new(),
        }
    }

    /// Create a new OpenAI provider with a custom base URL.
    pub fn with_base_url(api_key: String, base_url: String) -> Self {
        Self {
            api_key,
            base_url,
            client: Client::new(),
        }
    }

    /// Get the base URL.
    pub fn base_url(&self) -> &str {
        &self.base_url
    }

    /// Build the auth header value.
    fn auth_header(&self) -> String {
        format!("Bearer {}", self.api_key)
    }
}

// --- Wire format types for OpenAI API ---

#[derive(Debug, Serialize)]
struct OpenAiChatRequest {
    model: String,
    messages: Vec<OpenAiMessage>,
    #[serde(skip_serializing_if = "Option::is_none")]
    temperature: Option<f32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    max_tokens: Option<u32>,
    stream: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    tools: Option<Vec<OpenAiTool>>,
}

#[derive(Debug, Serialize, Deserialize)]
struct OpenAiMessage {
    role: String,
    content: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    tool_calls: Option<Vec<OpenAiToolCall>>,
}

#[derive(Debug, Serialize, Deserialize)]
struct OpenAiTool {
    #[serde(rename = "type")]
    tool_type: String,
    function: OpenAiFunction,
}

#[derive(Debug, Serialize, Deserialize)]
struct OpenAiFunction {
    name: String,
    description: String,
    parameters: serde_json::Value,
}

#[derive(Debug, Serialize, Deserialize)]
struct OpenAiToolCall {
    id: String,
    #[serde(rename = "type")]
    call_type: String,
    function: OpenAiFunctionCall,
}

#[derive(Debug, Serialize, Deserialize)]
struct OpenAiFunctionCall {
    name: String,
    arguments: String,
}

#[derive(Debug, Deserialize)]
struct OpenAiChatResponse {
    id: String,
    model: String,
    choices: Vec<OpenAiChoice>,
    usage: OpenAiUsage,
}

#[derive(Debug, Deserialize)]
struct OpenAiChoice {
    message: OpenAiMessage,
}

#[derive(Debug, Deserialize)]
struct OpenAiUsage {
    prompt_tokens: u32,
    completion_tokens: u32,
    total_tokens: u32,
}

#[derive(Debug, Deserialize)]
#[allow(dead_code)]
struct OpenAiStreamResponse {
    id: Option<String>,
    choices: Vec<OpenAiStreamChoice>,
}

#[derive(Debug, Deserialize)]
struct OpenAiStreamChoice {
    delta: OpenAiStreamDelta,
    finish_reason: Option<String>,
}

#[derive(Debug, Deserialize)]
struct OpenAiStreamDelta {
    content: Option<String>,
}

#[derive(Debug, Deserialize)]
struct OpenAiModelsResponse {
    data: Vec<OpenAiModel>,
}

#[derive(Debug, Deserialize)]
struct OpenAiModel {
    id: String,
}

/// Convert internal Message to OpenAI wire format.
fn to_openai_message(msg: &Message) -> OpenAiMessage {
    OpenAiMessage {
        role: msg.role.clone(),
        content: if msg.content.is_empty() {
            None
        } else {
            Some(msg.content.clone())
        },
        tool_calls: msg.tool_calls.as_ref().map(|calls| {
            calls
                .iter()
                .map(|tc| OpenAiToolCall {
                    id: tc.id.clone(),
                    call_type: "function".to_string(),
                    function: OpenAiFunctionCall {
                        name: tc.name.clone(),
                        arguments: tc.arguments.to_string(),
                    },
                })
                .collect()
        }),
    }
}

/// Convert OpenAI wire message back to internal Message.
fn from_openai_message(msg: &OpenAiMessage) -> Message {
    Message {
        role: msg.role.clone(),
        content: msg.content.clone().unwrap_or_default(),
        tool_calls: msg.tool_calls.as_ref().map(|calls| {
            calls
                .iter()
                .map(|tc| {
                    let arguments: serde_json::Value =
                        serde_json::from_str(&tc.function.arguments).unwrap_or_else(|e| {
                            tracing::warn!("Failed to parse tool call arguments: {}, using empty object", e);
                            json!({})
                        });
                    ToolCall {
                        id: tc.id.clone(),
                        name: tc.function.name.clone(),
                        arguments,
                    }
                })
                .collect()
        }),
        tool_call_id: None,
    }
}

/// Convert internal Tool to OpenAI wire format.
fn to_openai_tool(tool: &Tool) -> OpenAiTool {
    OpenAiTool {
        tool_type: "function".to_string(),
        function: OpenAiFunction {
            name: tool.name.clone(),
            description: tool.description.clone(),
            parameters: tool.parameters.clone(),
        },
    }
}

#[async_trait]
impl LlmProvider for OpenAiProvider {
    fn id(&self) -> &str {
        "openai"
    }

    fn name(&self) -> &str {
        "OpenAI"
    }

    fn clone_box(&self) -> Box<dyn LlmProvider> {
        Box::new(self.clone())
    }

    async fn models(&self) -> Result<Vec<Model>> {
        let url = format!("{}/models", self.base_url);
        let response = self
            .client
            .get(&url)
            .header("Authorization", self.auth_header())
            .send()
            .await
            .context("Failed to fetch OpenAI models")?;

        let models_resp: OpenAiModelsResponse = response
            .json()
            .await
            .context("Failed to parse OpenAI models response")?;

        let mut models: Vec<Model> = models_resp
            .data
            .into_iter()
            .map(|m| Model {
                id: m.id.clone(),
                name: m.id,
                context_window: None,
                max_output_tokens: None,
            })
            .collect();

        models.sort_by(|a, b| a.id.cmp(&b.id));
        Ok(models)
    }

    async fn chat(&self, request: ChatRequest) -> Result<ChatResponse> {
        let url = format!("{}/chat/completions", self.base_url);

        let openai_request = OpenAiChatRequest {
            model: request.model,
            messages: request.messages.iter().map(to_openai_message).collect(),
            temperature: request.temperature,
            max_tokens: request.max_tokens,
            stream: false,
            tools: request.tools.as_ref().map(|tools| {
                tools.iter().map(to_openai_tool).collect()
            }),
        };

        let response = self
            .client
            .post(&url)
            .header("Authorization", self.auth_header())
            .header("Content-Type", "application/json")
            .json(&openai_request)
            .send()
            .await
            .context("Failed to send chat request to OpenAI")?;

        let openai_response: OpenAiChatResponse = response
            .json()
            .await
            .context("Failed to parse OpenAI chat response")?;

        let choice = openai_response
            .choices
            .into_iter()
            .next()
            .context("No choices in OpenAI response")?;

        Ok(ChatResponse {
            id: openai_response.id,
            model: openai_response.model,
            message: from_openai_message(&choice.message),
            usage: Usage {
                prompt_tokens: openai_response.usage.prompt_tokens,
                completion_tokens: openai_response.usage.completion_tokens,
                total_tokens: openai_response.usage.total_tokens,
            },
        })
    }

    async fn stream_chat(&self, request: ChatRequest) -> Result<ChatStream> {
        let url = format!("{}/chat/completions", self.base_url);

        let openai_request = OpenAiChatRequest {
            model: request.model,
            messages: request.messages.iter().map(to_openai_message).collect(),
            temperature: request.temperature,
            max_tokens: request.max_tokens,
            stream: true,
            tools: request.tools.as_ref().map(|tools| {
                tools.iter().map(to_openai_tool).collect()
            }),
        };

        let response = self
            .client
            .post(&url)
            .header("Authorization", self.auth_header())
            .header("Content-Type", "application/json")
            .json(&openai_request)
            .send()
            .await
            .context("Failed to send streaming request to OpenAI")?;

        let (tx, rx) = tokio::sync::mpsc::channel(256);

        tokio::spawn(async move {
            use futures::StreamExt;

            let mut stream = response.bytes_stream();
            let mut buffer = String::new();

            while let Some(chunk_result) = stream.next().await {
                let chunk = match chunk_result {
                    Ok(c) => c,
                    Err(_) => break,
                };

                buffer.push_str(&String::from_utf8_lossy(&chunk));

                while let Some(line_end) = buffer.find('\n') {
                    let line = buffer[..line_end].trim().to_string();
                    buffer = buffer[line_end + 1..].to_string();

                    if line.is_empty() || !line.starts_with("data: ") {
                        continue;
                    }

                    let data = &line[6..];
                    if data == "[DONE]" {
                        if tx
                            .send(StreamChunk {
                                delta: String::new(),
                                finish_reason: Some("stop".to_string()),
                            })
                            .await
                            .is_err()
                        {
                            tracing::debug!("Receiver dropped, stopping stream");
                            return;
                        }
                    }

                    if let Ok(stream_resp) =
                        serde_json::from_str::<OpenAiStreamResponse>(data)
                    {
                        for choice in stream_resp.choices {
                            if tx
                                .send(StreamChunk {
                                    delta: choice.delta.content.unwrap_or_default(),
                                    finish_reason: choice.finish_reason,
                                })
                                .await
                                .is_err()
                            {
                                tracing::debug!("Receiver dropped, stopping stream");
                                return;
                            }
                        }
                    }
                }
            }
        });

        Ok(ChatStream::new(rx))
    }

    fn supports_streaming(&self) -> bool {
        true
    }

    fn supports_function_calling(&self) -> bool {
        true
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_openai_provider_id() {
        let provider = OpenAiProvider::new("test-key".to_string());
        assert_eq!(provider.id(), "openai");
    }

    #[test]
    fn test_openai_provider_name() {
        let provider = OpenAiProvider::new("test-key".to_string());
        assert_eq!(provider.name(), "OpenAI");
    }

    #[test]
    fn test_openai_provider_supports_streaming() {
        let provider = OpenAiProvider::new("test-key".to_string());
        assert!(provider.supports_streaming());
    }

    #[test]
    fn test_openai_provider_supports_function_calling() {
        let provider = OpenAiProvider::new("test-key".to_string());
        assert!(provider.supports_function_calling());
    }

    #[test]
    fn test_openai_provider_custom_base_url() {
        let provider = OpenAiProvider::with_base_url(
            "test-key".to_string(),
            "https://custom.openai.com/v1".to_string(),
        );
        assert_eq!(provider.base_url(), "https://custom.openai.com/v1");
    }

    #[test]
    fn test_openai_provider_default_base_url() {
        let provider = OpenAiProvider::new("test-key".to_string());
        assert_eq!(provider.base_url(), DEFAULT_BASE_URL);
    }

    #[test]
    fn test_to_openai_message_user() {
        let msg = Message {
            role: "user".to_string(),
            content: "Hello".to_string(),
            tool_calls: None,
            tool_call_id: None,
        };
        let openai_msg = to_openai_message(&msg);
        assert_eq!(openai_msg.role, "user");
        assert_eq!(openai_msg.content.unwrap(), "Hello");
        assert!(openai_msg.tool_calls.is_none());
    }

    #[test]
    fn test_to_openai_message_empty_content() {
        let msg = Message {
            role: "assistant".to_string(),
            content: String::new(),
            tool_calls: None,
            tool_call_id: None,
        };
        let openai_msg = to_openai_message(&msg);
        assert!(openai_msg.content.is_none());
    }

    #[test]
    fn test_from_openai_message_roundtrip() {
        let msg = Message {
            role: "user".to_string(),
            content: "test".to_string(),
            tool_calls: None,
            tool_call_id: None,
        };
        let openai_msg = to_openai_message(&msg);
        let restored = from_openai_message(&openai_msg);
        assert_eq!(restored.role, msg.role);
        assert_eq!(restored.content, msg.content);
    }

    #[test]
    fn test_to_openai_tool() {
        let tool = Tool {
            name: "search".to_string(),
            description: "Search the web".to_string(),
            parameters: json!({"type": "object"}),
        };
        let openai_tool = to_openai_tool(&tool);
        assert_eq!(openai_tool.tool_type, "function");
        assert_eq!(openai_tool.function.name, "search");
        assert_eq!(openai_tool.function.description, "Search the web");
    }

    #[test]
    fn test_clone_box() {
        let provider = OpenAiProvider::new("test-key".to_string());
        let cloned = provider.clone_box();
        assert_eq!(cloned.id(), "openai");
        assert_eq!(cloned.name(), "OpenAI");
    }
}
