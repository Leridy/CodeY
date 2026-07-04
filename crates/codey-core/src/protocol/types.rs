use serde::{Deserialize, Serialize};

// --- JSON-RPC 2.0 standard error codes ---
pub const PARSE_ERROR: i32 = -32700;
pub const INVALID_REQUEST: i32 = -32600;
pub const METHOD_NOT_FOUND: i32 = -32601;
pub const INVALID_PARAMS: i32 = -32602;
pub const INTERNAL_ERROR: i32 = -32603;

// --- Application-specific error codes (reserved -32000 to -32099) ---
pub const STATE_CONFLICT: i32 = -32007;
pub const TIMEOUT: i32 = -32004;
pub const TEXT_NOT_FOUND: i32 = -32002;
pub const PROCESS_ERROR: i32 = -32001;

/// JSON-RPC 2.0 Request
#[derive(Debug, Serialize, Deserialize)]
pub struct Request {
    pub jsonrpc: String,
    pub id: serde_json::Value,
    pub method: String,
    pub params: Option<serde_json::Value>,
}

/// JSON-RPC 2.0 Response
#[derive(Debug, Serialize, Deserialize)]
pub struct Response {
    pub jsonrpc: String,
    pub id: serde_json::Value,
    pub result: Option<serde_json::Value>,
    pub error: Option<ErrorObject>,
}

/// JSON-RPC 2.0 Error
#[derive(Debug, Serialize, Deserialize)]
pub struct ErrorObject {
    pub code: i32,
    pub message: String,
    pub data: Option<serde_json::Value>,
}

/// JSON-RPC 2.0 Notification (no id)
#[derive(Debug, Serialize, Deserialize)]
pub struct Notification {
    pub jsonrpc: String,
    pub method: String,
    pub params: Option<serde_json::Value>,
}
