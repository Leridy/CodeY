use std::sync::Arc;
use tokio::sync::Mutex;

pub struct AppState {
    pub config: Arc<Mutex<serde_json::Value>>,
}

impl AppState {
    pub fn new() -> Self {
        Self {
            config: Arc::new(Mutex::new(serde_json::json!({}))),
        }
    }
}
