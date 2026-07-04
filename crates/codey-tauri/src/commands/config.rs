use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct AppConfig {
    pub llm_provider: String,
    pub model: String,
    pub theme: String,
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            llm_provider: "openai".to_string(),
            model: "gpt-4".to_string(),
            theme: "dark".to_string(),
        }
    }
}

#[tauri::command]
pub async fn get_config() -> Result<AppConfig, String> {
    // TODO: Load from file
    Ok(AppConfig::default())
}
