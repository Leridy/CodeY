use anyhow::Result;
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use super::provider::LlmProvider;

/// Provider Registry - manages all LLM providers.
///
/// Stores providers behind `Arc<RwLock<...>>` for safe concurrent access.
/// Each provider is keyed by its `id()` and can be cloned out via `clone_box()`.
pub struct ProviderRegistry {
    providers: Arc<RwLock<HashMap<String, Box<dyn LlmProvider>>>>,
    active_provider: Arc<RwLock<Option<String>>>,
}

impl ProviderRegistry {
    /// Create a new empty provider registry.
    pub fn new() -> Self {
        Self {
            providers: Arc::new(RwLock::new(HashMap::new())),
            active_provider: Arc::new(RwLock::new(None)),
        }
    }

    /// Register a provider. Overwrites any existing provider with the same id.
    pub async fn register(&self, provider: Box<dyn LlmProvider>) {
        let id = provider.id().to_string();
        let mut providers = self.providers.write().await;
        providers.insert(id, provider);
    }

    /// Get a clone of a provider by id.
    pub async fn get(&self, id: &str) -> Option<Box<dyn LlmProvider>> {
        let providers = self.providers.read().await;
        providers.get(id).map(|p| p.clone_box())
    }

    /// Get the currently active provider.
    pub async fn active(&self) -> Option<Box<dyn LlmProvider>> {
        let active_id = self.active_provider.read().await;
        if let Some(id) = active_id.as_ref() {
            self.get(id).await
        } else {
            None
        }
    }

    /// Set the active provider by id. Fails if the id is not registered.
    pub async fn set_active(&self, id: &str) -> Result<()> {
        let providers = self.providers.read().await;
        if providers.contains_key(id) {
            let mut active = self.active_provider.write().await;
            *active = Some(id.to_string());
            Ok(())
        } else {
            anyhow::bail!("Provider not found: {}", id)
        }
    }

    /// Get the id of the currently active provider.
    pub async fn active_id(&self) -> Option<String> {
        let active = self.active_provider.read().await;
        active.clone()
    }

    /// List all registered provider ids.
    pub async fn list(&self) -> Vec<String> {
        let providers = self.providers.read().await;
        providers.keys().cloned().collect()
    }

    /// Remove a provider by id.
    ///
    /// If it was the active provider, clears the active selection.
    /// Returns `true` if a provider was removed.
    pub async fn remove(&self, id: &str) -> bool {
        let mut providers = self.providers.write().await;
        let removed = providers.remove(id).is_some();
        if removed {
            let mut active = self.active_provider.write().await;
            if active.as_deref() == Some(id) {
                *active = None;
            }
        }
        removed
    }

    /// Get the number of registered providers.
    pub async fn len(&self) -> usize {
        let providers = self.providers.read().await;
        providers.len()
    }

    /// Check if the registry is empty.
    pub async fn is_empty(&self) -> bool {
        let providers = self.providers.read().await;
        providers.is_empty()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use anyhow::Result;
    use async_trait::async_trait;
    use super::super::provider::{
        ChatRequest, ChatResponse, ChatStream, Model,
    };

    // -- Test helper: a minimal mock provider --

    #[derive(Debug, Clone)]
    struct MockProvider {
        provider_id: String,
        provider_name: String,
        supports_stream: bool,
        supports_fc: bool,
    }

    impl MockProvider {
        fn new(id: &str, name: &str) -> Self {
            Self {
                provider_id: id.to_string(),
                provider_name: name.to_string(),
                supports_stream: true,
                supports_fc: false,
            }
        }
    }

    #[async_trait]
    impl LlmProvider for MockProvider {
        fn id(&self) -> &str {
            &self.provider_id
        }

        fn name(&self) -> &str {
            &self.provider_name
        }

        fn clone_box(&self) -> Box<dyn LlmProvider> {
            Box::new(self.clone())
        }

        async fn models(&self) -> Result<Vec<Model>> {
            Ok(vec![])
        }

        async fn chat(&self, _request: ChatRequest) -> Result<ChatResponse> {
            anyhow::bail!("mock: not implemented")
        }

        async fn stream_chat(&self, _request: ChatRequest) -> Result<ChatStream> {
            let (_tx, rx) = tokio::sync::mpsc::channel(1);
            Ok(ChatStream::new(rx))
        }

        fn supports_streaming(&self) -> bool {
            self.supports_stream
        }

        fn supports_function_calling(&self) -> bool {
            self.supports_fc
        }
    }

    // -- Registration tests --

    #[tokio::test]
    async fn test_register_and_get_provider() {
        let registry = ProviderRegistry::new();
        let provider = Box::new(MockProvider::new("test", "Test Provider"));

        registry.register(provider).await;

        let retrieved = registry.get("test").await;
        assert!(retrieved.is_some());
        assert_eq!(retrieved.unwrap().id(), "test");
    }

    #[tokio::test]
    async fn test_get_nonexistent_provider_returns_none() {
        let registry = ProviderRegistry::new();

        let retrieved = registry.get("nonexistent").await;
        assert!(retrieved.is_none());
    }

    #[tokio::test]
    async fn test_register_overwrites_existing() {
        let registry = ProviderRegistry::new();

        registry.register(Box::new(MockProvider::new("dup", "First"))).await;
        registry.register(Box::new(MockProvider::new("dup", "Second"))).await;

        let retrieved = registry.get("dup").await.unwrap();
        assert_eq!(retrieved.name(), "Second");
    }

    #[tokio::test]
    async fn test_list_providers() {
        let registry = ProviderRegistry::new();

        registry.register(Box::new(MockProvider::new("a", "A"))).await;
        registry.register(Box::new(MockProvider::new("b", "B"))).await;
        registry.register(Box::new(MockProvider::new("c", "C"))).await;

        let mut ids = registry.list().await;
        ids.sort();
        assert_eq!(ids, vec!["a", "b", "c"]);
    }

    #[tokio::test]
    async fn test_len_and_is_empty() {
        let registry = ProviderRegistry::new();
        assert!(registry.is_empty().await);
        assert_eq!(registry.len().await, 0);

        registry.register(Box::new(MockProvider::new("x", "X"))).await;
        assert!(!registry.is_empty().await);
        assert_eq!(registry.len().await, 1);
    }

    #[tokio::test]
    async fn test_remove_provider() {
        let registry = ProviderRegistry::new();

        registry.register(Box::new(MockProvider::new("rem", "Removable"))).await;
        assert!(registry.get("rem").await.is_some());

        let removed = registry.remove("rem").await;
        assert!(removed);
        assert!(registry.get("rem").await.is_none());
    }

    #[tokio::test]
    async fn test_remove_nonexistent_returns_false() {
        let registry = ProviderRegistry::new();
        assert!(!registry.remove("nope").await);
    }

    // -- Active provider tests --

    #[tokio::test]
    async fn test_active_is_none_initially() {
        let registry = ProviderRegistry::new();
        assert!(registry.active().await.is_none());
        assert!(registry.active_id().await.is_none());
    }

    #[tokio::test]
    async fn test_set_active_provider() {
        let registry = ProviderRegistry::new();
        registry.register(Box::new(MockProvider::new("x", "X"))).await;

        registry.set_active("x").await.unwrap();

        let active = registry.active().await;
        assert!(active.is_some());
        assert_eq!(active.unwrap().id(), "x");
        assert_eq!(registry.active_id().await.as_deref(), Some("x"));
    }

    #[tokio::test]
    async fn test_set_active_nonexistent_fails() {
        let registry = ProviderRegistry::new();

        let result = registry.set_active("missing").await;
        assert!(result.is_err());
        assert!(registry.active().await.is_none());
    }

    #[tokio::test]
    async fn test_set_active_switches_provider() {
        let registry = ProviderRegistry::new();
        registry.register(Box::new(MockProvider::new("first", "First"))).await;
        registry.register(Box::new(MockProvider::new("second", "Second"))).await;

        registry.set_active("first").await.unwrap();
        assert_eq!(registry.active_id().await.as_deref(), Some("first"));

        registry.set_active("second").await.unwrap();
        assert_eq!(registry.active_id().await.as_deref(), Some("second"));
    }

    #[tokio::test]
    async fn test_remove_active_clears_active() {
        let registry = ProviderRegistry::new();
        registry.register(Box::new(MockProvider::new("ephemeral", "Ephemeral"))).await;

        registry.set_active("ephemeral").await.unwrap();
        assert!(registry.active().await.is_some());

        registry.remove("ephemeral").await;
        assert!(registry.active().await.is_none());
        assert!(registry.active_id().await.is_none());
    }

    // -- Provider capability tests --

    #[tokio::test]
    async fn test_provider_capabilities_preserved() {
        let registry = ProviderRegistry::new();
        registry.register(Box::new(MockProvider::new("cap", "Capable"))).await;

        let provider = registry.get("cap").await.unwrap();
        assert!(provider.supports_streaming());
        assert!(!provider.supports_function_calling());
    }

    #[tokio::test]
    async fn test_clone_is_independent() {
        let registry = ProviderRegistry::new();
        registry.register(Box::new(MockProvider::new("cl", "Clone"))).await;

        let p1 = registry.get("cl").await.unwrap();
        let p2 = registry.get("cl").await.unwrap();

        // Both have the same id but are independent clones
        assert_eq!(p1.id(), p2.id());
        assert_eq!(p1.name(), p2.name());
    }
}
