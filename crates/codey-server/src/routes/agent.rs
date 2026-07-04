use axum::{routing::post, Json, Router};
use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize)]
pub struct SendMessageRequest {
    pub message: String,
}

#[derive(Debug, Serialize)]
pub struct SendMessageResponse {
    pub id: String,
    pub content: String,
    pub role: String,
}

pub fn router() -> Router {
    Router::new()
        .route("/api/agent/send", post(send_message))
}

async fn send_message(
    Json(request): Json<SendMessageRequest>,
) -> Json<SendMessageResponse> {
    // TODO: Implement agent message sending
    Json(SendMessageResponse {
        id: "temp".to_string(),
        content: format!("Echo: {}", request.message),
        role: "assistant".to_string(),
    })
}
