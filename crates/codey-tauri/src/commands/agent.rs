use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
#[allow(dead_code)]
pub struct AgentMessage {
    pub id: String,
    pub content: String,
    pub role: String,
}

#[tauri::command]
#[allow(dead_code)]
pub async fn send_message(message: String) -> Result<AgentMessage, String> {
    // TODO: Implement agent message sending
    Ok(AgentMessage {
        id: "temp".to_string(),
        content: format!("Echo: {}", message),
        role: "assistant".to_string(),
    })
}
