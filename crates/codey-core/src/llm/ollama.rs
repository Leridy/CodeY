//! Ollama LLM provider for local model deployment.

use anyhow::{Context, Result};
use async_trait::async_trait;
use reqwest::Client;
use serde::{Deserialize, Serialize};

use super::provider::{
    ChatRequest, ChatResponse, ChatStream, LlmProvider, Message, Model, StreamChunk, Usage,
};

const DEFAULT_BASE_URL: &str = "http://localhost:11434";

/// Ollama provider implementation for local models.
#[derive(Debug, Clone)]
pub struct OllamaProvider {
    base_url: String,
    client: Client,
}

impl OllamaProvider {
    /// Create a new Ollama provider with the default base URL.
    pub fn new() -> Self {
        Self {
            base_url: DEFAULT_BASE_URL.to_string(),
            client: Client::new(),
        }
    }

    /// Create a new Ollama provider with a custom base URL.
    pub fn with_base_url(base_url: String) -> Self {
        Self {
            base_url,
            client: Client::new(),
        }
    }

    /// Get the base URL.
    pub fn base_url(&self) -> &str {
        &self.base_url
    }
}

impl Default for OllamaProvider {
    fn default() -> Self {
        Self::new()
    }
}

// --- Wire format types for Ollama API ---

#[derive(Debug, Serialize)]
struct OllamaChatRequest {
    model: String,
    messages: Vec<OllamaMessage>,
    stream: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    options: Option<OllamaOptions>,
}

#[derive(Debug, Serialize, Deserialize)]
struct OllamaMessage {
    role: String,
    content: String,
}

#[derive(Debug, Serialize)]
struct OllamaOptions {
    #[serde(skip_serializing_if = "Option::is_none")]
    temperature: Option<f32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    num_predict: Option<u32>,
}

#[derive(Debug, Deserialize)]
#[allow(dead_code)]
struct OllamaChatResponse {
    model: String,
    message: OllamaMessage,
    done: bool,
    #[serde(default)]
    total_duration: Option<u64>,
    #[serde(default)]
    eval_count: Option<u32>,
    #[serde(default)]
    prompt_eval_count: Option<u32>,
}

#[derive(Debug, Deserialize)]
#[allow(dead_code)]
struct OllamaModel {
    name: String,
    #[serde(default)]
    details: Option<OllamaModelDetails>,
}

#[derive(Debug, Deserialize)]
#[allow(dead_code)]
struct OllamaModelDetails {
    #[serde(default)]
    parameter_size: Option<String>,
}

#[derive(Debug, Deserialize)]
struct OllamaTagsResponse {
    models: Vec<OllamaModel>,
}

/// Convert internal Message to Ollama wire format.
fn to_ollama_message(msg: &Message) -> OllamaMessage {
    OllamaMessage {
        role: msg.role.clone(),
        content: msg.content.clone(),
    }
}

#[async_trait]
impl LlmProvider for OllamaProvider {
    fn id(&self) -> &str {
        "ollama"
    }

    fn name(&self) -> &str {
        "Ollama"
    }

    fn clone_box(&self) -> Box<dyn LlmProvider> {
        Box::new(self.clone())
    }

    async fn models(&self) -> Result<Vec<Model>> {
        let url = format!("{}/api/tags", self.base_url);
        let response = self
            .client
            .get(&url)
            .send()
            .await
            .context("Failed to fetch Ollama models. Is Ollama running?")?;

        let tags: OllamaTagsResponse = response
            .json()
            .await
            .context("Failed to parse Ollama models response")?;

        let models: Vec<Model> = tags
            .models
            .into_iter()
            .map(|m| Model {
                id: m.name.clone(),
                name: m.name,
                context_window: None,
                max_output_tokens: None,
            })
            .collect();

        Ok(models)
    }

    async fn chat(&self, request: ChatRequest) -> Result<ChatResponse> {
        let url = format!("{}/api/chat", self.base_url);

        let ollama_request = OllamaChatRequest {
            model: request.model.clone(),
            messages: request.messages.iter().map(to_ollama_message).collect(),
            stream: false,
            options: Some(OllamaOptions {
                temperature: request.temperature,
                num_predict: request.max_tokens,
            }),
        };

        let response = self
            .client
            .post(&url)
            .json(&ollama_request)
            .send()
            .await
            .context("Failed to send chat request to Ollama")?;

        let ollama_response: OllamaChatResponse = response
            .json()
            .await
            .context("Failed to parse Ollama chat response")?;

        let prompt_tokens = ollama_response.prompt_eval_count.unwrap_or(0);
        let completion_tokens = ollama_response.eval_count.unwrap_or(0);

        Ok(ChatResponse {
            id: format!("ollama-{}", uuid::Uuid::new_v4()),
            model: ollama_response.model,
            message: Message {
                role: "assistant".to_string(),
                content: ollama_response.message.content,
                tool_calls: None,
                tool_call_id: None,
            },
            usage: Usage {
                prompt_tokens,
                completion_tokens,
                total_tokens: prompt_tokens + completion_tokens,
            },
        })
    }

    async fn stream_chat(&self, request: ChatRequest) -> Result<ChatStream> {
        let url = format!("{}/api/chat", self.base_url);

        let ollama_request = OllamaChatRequest {
            model: request.model.clone(),
            messages: request.messages.iter().map(to_ollama_message).collect(),
            stream: true,
            options: Some(OllamaOptions {
                temperature: request.temperature,
                num_predict: request.max_tokens,
            }),
        };

        let response = self
            .client
            .post(&url)
            .json(&ollama_request)
            .send()
            .await
            .context("Failed to send streaming request to Ollama")?;

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

                // Ollama streams newline-delimited JSON.
                while let Some(line_end) = buffer.find('\n') {
                    let line = buffer[..line_end].trim().to_string();
                    buffer = buffer[line_end + 1..].to_string();

                    if line.is_empty() {
                        continue;
                    }

                    if let Ok(resp) = serde_json::from_str::<OllamaChatResponse>(&line) {
                        let finish_reason = if resp.done {
                            Some("stop".to_string())
                        } else {
                            None
                        };

                        if tx
                            .send(StreamChunk {
                                delta: resp.message.content,
                                finish_reason,
                            })
                            .await
                            .is_err()
                        {
                            tracing::debug!("Receiver dropped, stopping stream");
                            return;
                        }

                        if resp.done {
                            return;
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
        false
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_ollama_provider_id() {
        let provider = OllamaProvider::new();
        assert_eq!(provider.id(), "ollama");
    }

    #[test]
    fn test_ollama_provider_name() {
        let provider = OllamaProvider::new();
        assert_eq!(provider.name(), "Ollama");
    }

    #[test]
    fn test_ollama_provider_supports_streaming() {
        let provider = OllamaProvider::new();
        assert!(provider.supports_streaming());
    }

    #[test]
    fn test_ollama_provider_does_not_support_function_calling() {
        let provider = OllamaProvider::new();
        assert!(!provider.supports_function_calling());
    }

    #[test]
    fn test_ollama_provider_custom_base_url() {
        let provider =
            OllamaProvider::with_base_url("http://192.168.1.100:11434".to_string());
        assert_eq!(provider.base_url(), "http://192.168.1.100:11434");
    }

    #[test]
    fn test_ollama_provider_default_base_url() {
        let provider = OllamaProvider::new();
        assert_eq!(provider.base_url(), DEFAULT_BASE_URL);
    }

    #[test]
    fn test_ollama_provider_default_trait() {
        let provider = OllamaProvider::default();
        assert_eq!(provider.base_url(), DEFAULT_BASE_URL);
    }

    #[test]
    fn test_to_ollama_message() {
        let msg = Message {
            role: "user".to_string(),
            content: "Hello".to_string(),
            tool_calls: None,
            tool_call_id: None,
        };
        let ollama_msg = to_ollama_message(&msg);
        assert_eq!(ollama_msg.role, "user");
        assert_eq!(ollama_msg.content, "Hello");
    }

    #[test]
    fn test_clone_box() {
        let provider = OllamaProvider::new();
        let cloned = provider.clone_box();
        assert_eq!(cloned.id(), "ollama");
        assert_eq!(cloned.name(), "Ollama");
    }
}
