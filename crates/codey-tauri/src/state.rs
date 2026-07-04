use std::sync::Arc;
use tokio::sync::Mutex;

pub struct AppState {
    pub config: Arc<Mutex<super::commands::config::AppConfig>>,
}

impl AppState {
    pub fn new() -> Self {
        Self {
            config: Arc::new(Mutex::new(super::commands::config::AppConfig::default())),
        }
    }
}
