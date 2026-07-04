use async_trait::async_trait;
use anyhow::Result;

/// Trait for LLM providers
#[async_trait]
pub trait LlmProvider {
    async fn complete(&self, messages: Vec<Message>) -> Result<String>;
}

#[derive(Debug, Clone)]
pub struct Message {
    pub role: String,
    pub content: String,
}
