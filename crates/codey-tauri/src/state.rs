use std::sync::Arc;
use tokio::sync::Mutex;

#[allow(dead_code)]
pub struct AppState {
    pub config: Arc<Mutex<super::commands::config::AppConfig>>,
}

#[allow(dead_code)]
impl AppState {
    pub fn new() -> Self {
        Self {
            config: Arc::new(Mutex::new(super::commands::config::AppConfig::default())),
        }
    }
}
