//! Anthropic LLM provider.

use anyhow::{Context, Result};
use async_trait::async_trait;
use reqwest::Client;
use serde::{Deserialize, Serialize};

use super::provider::{
    ChatRequest, ChatResponse, ChatStream, LlmProvider, Message, Model, StreamChunk, Usage,
};

const DEFAULT_BASE_URL: &str = "https://api.anthropic.com";

/// Anthropic provider implementation.
#[derive(Debug, Clone)]
pub struct AnthropicProvider {
    api_key: String,
    base_url: String,
    client: Client,
}

impl AnthropicProvider {
    /// Create a new Anthropic provider with the given API key.
    pub fn new(api_key: String) -> Self {
        Self {
            api_key,
            base_url: DEFAULT_BASE_URL.to_string(),
            client: Client::new(),
        }
    }

    /// Create a new Anthropic provider with a custom base URL.
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
}

// --- Wire format types for Anthropic API ---

#[derive(Debug, Serialize)]
struct AnthropicChatRequest {
    model: String,
    max_tokens: u32,
    messages: Vec<AnthropicMessage>,
    #[serde(skip_serializing_if = "Option::is_none")]
    temperature: Option<f32>,
    stream: bool,
}

#[derive(Debug, Serialize, Deserialize)]
struct AnthropicMessage {
    role: String,
    content: String,
}

#[derive(Debug, Deserialize)]
#[allow(dead_code)]
struct AnthropicChatResponse {
    id: String,
    model: String,
    content: Vec<AnthropicContentBlock>,
    usage: AnthropicUsage,
    stop_reason: Option<String>,
}

#[derive(Debug, Deserialize)]
#[allow(dead_code)]
struct AnthropicContentBlock {
    #[serde(rename = "type")]
    block_type: String,
    text: Option<String>,
}

#[derive(Debug, Deserialize)]
struct AnthropicUsage {
    input_tokens: u32,
    output_tokens: u32,
}

#[derive(Debug, Deserialize)]
#[allow(dead_code)]
struct AnthropicStreamEvent {
    #[serde(rename = "type")]
    event_type: String,
    delta: Option<AnthropicStreamDelta>,
    usage: Option<AnthropicStreamUsage>,
}

#[derive(Debug, Deserialize)]
#[allow(dead_code)]
struct AnthropicStreamDelta {
    #[serde(rename = "type")]
    delta_type: Option<String>,
    text: Option<String>,
    stop_reason: Option<String>,
}

#[derive(Debug, Deserialize)]
#[allow(dead_code)]
struct AnthropicStreamUsage {
    output_tokens: Option<u32>,
}

/// Convert internal Message to Anthropic wire format.
fn to_anthropic_message(msg: &Message) -> AnthropicMessage {
    AnthropicMessage {
        role: msg.role.clone(),
        content: msg.content.clone(),
    }
}

/// Static model list for Anthropic (since Anthropic doesn't have a public models endpoint).
fn anthropic_models() -> Vec<Model> {
    vec![
        Model {
            id: "claude-sonnet-4-20250514".to_string(),
            name: "Claude Sonnet 4".to_string(),
            context_window: Some(200_000),
            max_output_tokens: Some(8_192),
        },
        Model {
            id: "claude-3-5-haiku-20241022".to_string(),
            name: "Claude 3.5 Haiku".to_string(),
            context_window: Some(200_000),
            max_output_tokens: Some(8_192),
        },
        Model {
            id: "claude-3-opus-20240229".to_string(),
            name: "Claude 3 Opus".to_string(),
            context_window: Some(200_000),
            max_output_tokens: Some(4_096),
        },
    ]
}

#[async_trait]
impl LlmProvider for AnthropicProvider {
    fn id(&self) -> &str {
        "anthropic"
    }

    fn name(&self) -> &str {
        "Anthropic"
    }

    fn clone_box(&self) -> Box<dyn LlmProvider> {
        Box::new(self.clone())
    }

    async fn models(&self) -> Result<Vec<Model>> {
        // Anthropic doesn't expose a public models endpoint.
        // Return the known model list.
        Ok(anthropic_models())
    }

    async fn chat(&self, request: ChatRequest) -> Result<ChatResponse> {
        let url = format!("{}/v1/messages", self.base_url);

        let anthropic_request = AnthropicChatRequest {
            model: request.model.clone(),
            max_tokens: request.max_tokens.unwrap_or(4_096),
            messages: request.messages.iter().map(to_anthropic_message).collect(),
            temperature: request.temperature,
            stream: false,
        };

        let response = self
            .client
            .post(&url)
            .header("x-api-key", &self.api_key)
            .header("anthropic-version", "2023-06-01")
            .header("Content-Type", "application/json")
            .json(&anthropic_request)
            .send()
            .await
            .context("Failed to send chat request to Anthropic")?;

        let anthropic_response: AnthropicChatResponse = response
            .json()
            .await
            .context("Failed to parse Anthropic chat response")?;

        // Extract text from content blocks.
        let content = anthropic_response
            .content
            .iter()
            .filter_map(|block| block.text.as_deref())
            .collect::<Vec<_>>()
            .join("");

        Ok(ChatResponse {
            id: anthropic_response.id,
            model: anthropic_response.model,
            message: Message {
                role: "assistant".to_string(),
                content,
                tool_calls: None,
            },
            usage: Usage {
                prompt_tokens: anthropic_response.usage.input_tokens,
                completion_tokens: anthropic_response.usage.output_tokens,
                total_tokens: anthropic_response.usage.input_tokens
                    + anthropic_response.usage.output_tokens,
            },
        })
    }

    async fn stream_chat(&self, request: ChatRequest) -> Result<ChatStream> {
        let url = format!("{}/v1/messages", self.base_url);

        let anthropic_request = AnthropicChatRequest {
            model: request.model.clone(),
            max_tokens: request.max_tokens.unwrap_or(4_096),
            messages: request.messages.iter().map(to_anthropic_message).collect(),
            temperature: request.temperature,
            stream: true,
        };

        let response = self
            .client
            .post(&url)
            .header("x-api-key", &self.api_key)
            .header("anthropic-version", "2023-06-01")
            .header("Content-Type", "application/json")
            .json(&anthropic_request)
            .send()
            .await
            .context("Failed to send streaming request to Anthropic")?;

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

                    if let Ok(event) = serde_json::from_str::<AnthropicStreamEvent>(data) {
                        match event.event_type.as_str() {
                            "content_block_delta" => {
                                if let Some(delta) = event.delta {
                                    let _ = tx
                                        .send(StreamChunk {
                                            delta: delta.text.unwrap_or_default(),
                                            finish_reason: None,
                                        })
                                        .await;
                                }
                            }
                            "message_stop" => {
                                let _ = tx
                                    .send(StreamChunk {
                                        delta: String::new(),
                                        finish_reason: Some("stop".to_string()),
                                    })
                                    .await;
                                return;
                            }
                            _ => {}
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
        // Anthropic uses "tool use" which is conceptually similar
        // but has a different wire format. Mark as false for now
        // until tool use is fully implemented.
        false
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_anthropic_provider_id() {
        let provider = AnthropicProvider::new("test-key".to_string());
        assert_eq!(provider.id(), "anthropic");
    }

    #[test]
    fn test_anthropic_provider_name() {
        let provider = AnthropicProvider::new("test-key".to_string());
        assert_eq!(provider.name(), "Anthropic");
    }

    #[test]
    fn test_anthropic_provider_supports_streaming() {
        let provider = AnthropicProvider::new("test-key".to_string());
        assert!(provider.supports_streaming());
    }

    #[test]
    fn test_anthropic_provider_does_not_support_function_calling() {
        let provider = AnthropicProvider::new("test-key".to_string());
        assert!(!provider.supports_function_calling());
    }

    #[test]
    fn test_anthropic_provider_custom_base_url() {
        let provider = AnthropicProvider::with_base_url(
            "test-key".to_string(),
            "https://custom.anthropic.com".to_string(),
        );
        assert_eq!(provider.base_url(), "https://custom.anthropic.com");
    }

    #[test]
    fn test_anthropic_provider_default_base_url() {
        let provider = AnthropicProvider::new("test-key".to_string());
        assert_eq!(provider.base_url(), DEFAULT_BASE_URL);
    }

    #[tokio::test]
    async fn test_anthropic_provider_models_returns_list() {
        let provider = AnthropicProvider::new("test-key".to_string());
        let models = provider.models().await.unwrap();
        assert!(!models.is_empty());
        assert!(models.iter().any(|m| m.id == "claude-sonnet-4-20250514"));
        assert!(models.iter().any(|m| m.id == "claude-3-5-haiku-20241022"));
        assert!(models.iter().any(|m| m.id == "claude-3-opus-20240229"));
    }

    #[test]
    fn test_to_anthropic_message() {
        let msg = Message {
            role: "user".to_string(),
            content: "Hello".to_string(),
            tool_calls: None,
        };
        let anthropic_msg = to_anthropic_message(&msg);
        assert_eq!(anthropic_msg.role, "user");
        assert_eq!(anthropic_msg.content, "Hello");
    }

    #[test]
    fn test_clone_box() {
        let provider = AnthropicProvider::new("test-key".to_string());
        let cloned = provider.clone_box();
        assert_eq!(cloned.id(), "anthropic");
        assert_eq!(cloned.name(), "Anthropic");
    }
}
