use std::sync::Arc;
use tokio::sync::Mutex;

#[allow(dead_code)]
pub struct AppState {
    pub config: Arc<Mutex<serde_json::Value>>,
}

#[allow(dead_code)]
impl AppState {
    pub fn new() -> Self {
        Self {
            config: Arc::new(Mutex::new(serde_json::json!({}))),
        }
    }
}
