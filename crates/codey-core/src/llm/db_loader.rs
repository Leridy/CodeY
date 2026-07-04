use anyhow::{Context, Result};
use rusqlite::Connection;
use super::provider::LlmProvider;
use super::registry::ProviderRegistry;
use super::openai::OpenAiProvider;
use super::anthropic::AnthropicProvider;
use super::ollama::OllamaProvider;

/// Database provider loader - loads provider configurations from SQLite
pub struct DbProviderLoader {
    db_path: String,
}

/// Configuration row loaded from the `providers` table
#[derive(Debug, Clone)]
pub struct ProviderConfig {
    pub id: String,
    pub name: String,
    pub base_url: String,
    pub api_key_env: Option<String>,
    pub chat_endpoint: String,
    pub default_model: Option<String>,
    pub supports_streaming: bool,
    pub supports_function_calling: bool,
}

impl DbProviderLoader {
    /// Create a new database provider loader pointing at the given SQLite file
    pub fn new(db_path: &str) -> Self {
        Self {
            db_path: db_path.to_string(),
        }
    }

    /// Load all provider configurations from the database.
    ///
    /// Returns the raw configs for inspection. Call `register_loaded` to
    /// register them with a `ProviderRegistry`.
    pub fn load_configs(&self) -> Result<Vec<ProviderConfig>> {
        let conn = Connection::open(&self.db_path)
            .with_context(|| format!("Failed to open database at {}", self.db_path))?;

        let mut stmt = conn
            .prepare(
                "SELECT id, name, base_url, api_key_env, chat_endpoint, \
                 default_model, supports_streaming, supports_function_calling \
                 FROM providers",
            )
            .context("Failed to prepare providers query")?;

        let configs: Vec<ProviderConfig> = stmt
            .query_map([], |row| {
                Ok(ProviderConfig {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    base_url: row.get(2)?,
                    api_key_env: row.get(3)?,
                    chat_endpoint: row.get(4)?,
                    default_model: row.get(5)?,
                    supports_streaming: row.get(6)?,
                    supports_function_calling: row.get(7)?,
                })
            })?
            .collect::<std::result::Result<Vec<_>, _>>()?;

        Ok(configs)
    }

    /// Register loaded configs with the given registry.
    ///
    /// Maps known provider ids to their built-in implementations.
    /// Unknown ids are logged and skipped.
    pub async fn register_configs(
        &self,
        configs: &[ProviderConfig],
        registry: &ProviderRegistry,
    ) {
        for config in configs {
            let api_key = match &config.api_key_env {
                Some(var_name) => match std::env::var(var_name) {
                    Ok(key) if !key.is_empty() => key,
                    Ok(_) => {
                        tracing::warn!(
                            provider = %config.id,
                            env_var = %var_name,
                            "Environment variable is empty for provider; skipping registration"
                        );
                        continue;
                    }
                    Err(_) => {
                        tracing::warn!(
                            provider = %config.id,
                            env_var = %var_name,
                            "Environment variable not set for provider; skipping registration"
                        );
                        continue;
                    }
                },
                None => {
                    tracing::warn!(
                        provider = %config.id,
                        "No env_var configured for provider; skipping registration"
                    );
                    continue;
                }
            };

            // NOTE: This is a simplified registration path. Config fields like
            // `chat_endpoint`, `default_model`, `supports_streaming`, etc. are not
            // forwarded to the provider constructors. Each built-in provider uses
            // its own defaults. A future factory pattern could pass these through.
            let provider: Option<Box<dyn LlmProvider>> = match config.id.as_str() {
                "openai" => Some(Box::new(OpenAiProvider::new(api_key))),
                "anthropic" => Some(Box::new(AnthropicProvider::new(api_key))),
                "ollama" => Some(Box::new(OllamaProvider::new())),
                _ => {
                    tracing::warn!(
                        provider_id = %config.id,
                        "No built-in implementation for provider; skipping"
                    );
                    None
                }
            };

            if let Some(p) = provider {
                registry.register(p).await;
            }
        }
    }

    /// Load configurations from the database and register them with the registry.
    ///
    /// Convenience method that combines `load_configs` and `register_configs`.
    pub async fn load_and_register(
        &self,
        registry: &ProviderRegistry,
    ) -> Result<Vec<ProviderConfig>> {
        let configs = self.load_configs()?;
        self.register_configs(&configs, registry).await;
        Ok(configs)
    }

    /// Read the active provider id from the `config` table.
    pub fn load_active_provider(&self) -> Result<Option<String>> {
        let conn = Connection::open(&self.db_path)
            .with_context(|| format!("Failed to open database at {}", self.db_path))?;

        let result = conn.query_row(
            "SELECT value FROM config WHERE key = 'active_provider'",
            [],
            |row| row.get::<_, String>(0),
        );

        match result {
            Ok(val) => Ok(Some(val)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(e.into()),
        }
    }

    /// Create the required tables if they do not exist.
    pub fn ensure_schema(&self) -> Result<()> {
        let conn = Connection::open(&self.db_path)
            .with_context(|| format!("Failed to open database at {}", self.db_path))?;

        conn.execute_batch(
            "CREATE TABLE IF NOT EXISTS providers (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                base_url TEXT NOT NULL,
                api_key_env TEXT,
                models_endpoint TEXT,
                chat_endpoint TEXT NOT NULL,
                default_model TEXT,
                supports_streaming BOOLEAN DEFAULT 1,
                supports_function_calling BOOLEAN DEFAULT 1,
                headers TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            -- Reserved for future use: model metadata caching and discovery.
            -- Currently providers return models programmatically via `models()`.
            CREATE TABLE IF NOT EXISTS models (
                id TEXT PRIMARY KEY,
                provider_id TEXT NOT NULL,
                name TEXT NOT NULL,
                context_window INTEGER,
                max_output_tokens INTEGER,
                FOREIGN KEY (provider_id) REFERENCES providers(id)
            );
            CREATE TABLE IF NOT EXISTS config (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );",
        )?;

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::NamedTempFile;

    fn create_test_db() -> NamedTempFile {
        let tmp = NamedTempFile::new().unwrap();
        let loader = DbProviderLoader::new(tmp.path().to_str().unwrap());
        loader.ensure_schema().unwrap();
        tmp
    }

    fn insert_provider(conn: &Connection, id: &str, name: &str, base_url: &str) {
        conn.execute(
            "INSERT INTO providers (id, name, base_url, api_key_env, chat_endpoint, default_model) \
             VALUES (?1, ?2, ?3, ?4, '/chat/completions', 'gpt-4')",
            rusqlite::params![id, name, base_url, format!("TEST_{}_API_KEY", id.to_uppercase())],
        )
        .unwrap();
    }

    // -- Schema tests --

    #[test]
    fn test_ensure_schema_creates_tables() {
        let tmp = create_test_db();
        let conn = Connection::open(tmp.path()).unwrap();

        let tables: Vec<String> = conn
            .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
            .unwrap()
            .query_map([], |row| row.get(0))
            .unwrap()
            .filter_map(|r| r.ok())
            .collect();

        assert!(tables.contains(&"providers".to_string()));
        assert!(tables.contains(&"models".to_string()));
        assert!(tables.contains(&"config".to_string()));
    }

    #[test]
    fn test_ensure_schema_idempotent() {
        let tmp = create_test_db();
        let loader = DbProviderLoader::new(tmp.path().to_str().unwrap());
        // Calling twice should not error
        loader.ensure_schema().unwrap();
        loader.ensure_schema().unwrap();
    }

    // -- Load providers tests --

    #[tokio::test]
    async fn test_load_and_register_from_db() {
        let tmp = create_test_db();
        let conn = Connection::open(tmp.path()).unwrap();
        insert_provider(&conn, "openai", "OpenAI", "https://api.openai.com/v1");
        insert_provider(&conn, "anthropic", "Anthropic", "https://api.anthropic.com/v1");
        insert_provider(&conn, "ollama", "Ollama", "http://localhost:11434");
        drop(conn);

        // SAFETY: test-only, single-threaded environment variable manipulation
        unsafe {
            std::env::set_var("TEST_OPENAI_API_KEY", "sk-test-openai");
            std::env::set_var("TEST_ANTHROPIC_API_KEY", "sk-test-anthropic");
            std::env::set_var("TEST_OLLAMA_API_KEY", "ollama-key");
        }

        let registry = ProviderRegistry::new();
        let loader = DbProviderLoader::new(tmp.path().to_str().unwrap());

        let configs = loader.load_and_register(&registry).await.unwrap();
        assert_eq!(configs.len(), 3);

        // Verify they were registered
        assert!(registry.get("openai").await.is_some());
        assert!(registry.get("anthropic").await.is_some());
        assert!(registry.get("ollama").await.is_some());

        // Cleanup
        // SAFETY: test-only cleanup
        unsafe {
            std::env::remove_var("TEST_OPENAI_API_KEY");
            std::env::remove_var("TEST_ANTHROPIC_API_KEY");
            std::env::remove_var("TEST_OLLAMA_API_KEY");
        }
    }

    #[tokio::test]
    async fn test_load_and_register_empty_db() {
        let tmp = create_test_db();
        let registry = ProviderRegistry::new();
        let loader = DbProviderLoader::new(tmp.path().to_str().unwrap());

        let configs = loader.load_and_register(&registry).await.unwrap();
        assert!(configs.is_empty());
        assert!(registry.list().await.is_empty());
    }

    #[tokio::test]
    async fn test_load_and_register_unknown_id_skipped() {
        let tmp = create_test_db();
        let conn = Connection::open(tmp.path()).unwrap();
        insert_provider(&conn, "unknown_provider", "Unknown", "https://example.com");
        drop(conn);

        let registry = ProviderRegistry::new();
        let loader = DbProviderLoader::new(tmp.path().to_str().unwrap());

        let configs = loader.load_and_register(&registry).await.unwrap();
        // Config is returned (it was in the DB) but not registered (no built-in impl)
        assert_eq!(configs.len(), 1);
        assert_eq!(configs[0].id, "unknown_provider");
        assert_eq!(registry.len().await, 0);
    }

    #[tokio::test]
    async fn test_load_and_register_reads_api_key_from_env() {
        let tmp = create_test_db();
        let conn = Connection::open(tmp.path()).unwrap();
        conn.execute(
            "INSERT INTO providers \
             (id, name, base_url, api_key_env, chat_endpoint, default_model) \
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            rusqlite::params![
                "openai",
                "OpenAI",
                "https://api.openai.com/v1",
                "TEST_CODEY_OPENAI_KEY",
                "/chat/completions",
                "gpt-4o"
            ],
        )
        .unwrap();
        drop(conn);

        // Set the env var for this test (unsafe in edition 2024)
        // SAFETY: test-only, single-threaded environment variable manipulation
        unsafe {
            std::env::set_var("TEST_CODEY_OPENAI_KEY", "sk-test-123");
        }

        let registry = ProviderRegistry::new();
        let loader = DbProviderLoader::new(tmp.path().to_str().unwrap());
        let configs = loader.load_and_register(&registry).await.unwrap();

        assert_eq!(configs.len(), 1);
        assert!(registry.get("openai").await.is_some());

        // Cleanup
        // SAFETY: test-only cleanup
        unsafe {
            std::env::remove_var("TEST_CODEY_OPENAI_KEY");
        }
    }

    #[test]
    fn test_load_configs_only() {
        let tmp = create_test_db();
        let conn = Connection::open(tmp.path()).unwrap();
        insert_provider(&conn, "openai", "OpenAI", "https://api.openai.com/v1");
        drop(conn);

        let loader = DbProviderLoader::new(tmp.path().to_str().unwrap());
        let configs = loader.load_configs().unwrap();
        assert_eq!(configs.len(), 1);
        assert_eq!(configs[0].id, "openai");
    }

    // -- Active provider tests --

    #[test]
    fn test_load_active_provider_found() {
        let tmp = create_test_db();
        let conn = Connection::open(tmp.path()).unwrap();
        conn.execute(
            "INSERT INTO config (key, value) VALUES ('active_provider', 'anthropic')",
            [],
        )
        .unwrap();
        drop(conn);

        let loader = DbProviderLoader::new(tmp.path().to_str().unwrap());
        let active = loader.load_active_provider().unwrap();
        assert_eq!(active.as_deref(), Some("anthropic"));
    }

    #[test]
    fn test_load_active_provider_not_set() {
        let tmp = create_test_db();
        let loader = DbProviderLoader::new(tmp.path().to_str().unwrap());

        let active = loader.load_active_provider().unwrap();
        assert!(active.is_none());
    }

    #[test]
    fn test_load_configs_config_fields() {
        let tmp = create_test_db();
        let conn = Connection::open(tmp.path()).unwrap();
        conn.execute(
            "INSERT INTO providers \
             (id, name, base_url, api_key_env, chat_endpoint, default_model, \
              supports_streaming, supports_function_calling) \
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
            rusqlite::params![
                "openai",
                "OpenAI",
                "https://api.openai.com/v1",
                "OPENAI_API_KEY",
                "/chat/completions",
                "gpt-4o",
                true,
                true
            ],
        )
        .unwrap();
        drop(conn);

        let loader = DbProviderLoader::new(tmp.path().to_str().unwrap());
        let configs = loader.load_configs().unwrap();

        assert_eq!(configs.len(), 1);
        let c = &configs[0];
        assert_eq!(c.id, "openai");
        assert_eq!(c.name, "OpenAI");
        assert_eq!(c.base_url, "https://api.openai.com/v1");
        assert_eq!(c.api_key_env.as_deref(), Some("OPENAI_API_KEY"));
        assert_eq!(c.chat_endpoint, "/chat/completions");
        assert_eq!(c.default_model.as_deref(), Some("gpt-4o"));
        assert!(c.supports_streaming);
        assert!(c.supports_function_calling);
    }
}
