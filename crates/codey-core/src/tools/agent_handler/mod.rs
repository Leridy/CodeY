//! Agent handler - manages agent lifecycle and message routing.

pub mod tests;

use serde::{Deserialize, Serialize};
use serde_json::{json, Value};

use crate::protocol::{
    ErrorObject, Notification, Request, Response,
    INVALID_PARAMS, METHOD_NOT_FOUND, STATE_CONFLICT,
};

/// Agent status enumeration.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum AgentStatus {
    Idle,
    Running,
    WaitingForApproval,
    Error,
}

/// Agent state tracked by the handler.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentState {
    pub id: String,
    pub status: AgentStatus,
    pub working_directory: String,
    pub conversation_id: Option<String>,
}

/// Handles agent-related JSON-RPC methods.
pub struct AgentHandler {
    state: tokio::sync::Mutex<AgentState>,
}

impl AgentHandler {
    /// Create a new agent handler for the given working directory.
    pub fn new(working_directory: String) -> Self {
        Self {
            state: tokio::sync::Mutex::new(AgentState {
                id: uuid::Uuid::new_v4().to_string(),
                status: AgentStatus::Idle,
                working_directory,
                conversation_id: None,
            }),
        }
    }

    /// Dispatch a JSON-RPC request to the appropriate agent method.
    pub async fn handle_request(&self, request: Request) -> Response {
        let result = match request.method.as_str() {
            "agent/start" => self.handle_start(request.params).await,
            "agent/stop" => self.handle_stop().await,
            "agent/send" => self.handle_send(request.params).await,
            "agent/cancel" => self.handle_cancel().await,
            _ => Err(ErrorObject {
                code: METHOD_NOT_FOUND,
                message: "Method Not Found".to_string(),
                data: Some(json!({
                    "method": request.method,
                    "available_methods": ["agent/start", "agent/stop", "agent/send", "agent/cancel"]
                })),
            }),
        };

        match result {
            Ok(value) => Response {
                jsonrpc: "2.0".to_string(),
                id: request.id,
                result: Some(value),
                error: None,
            },
            Err(err) => Response {
                jsonrpc: "2.0".to_string(),
                id: request.id,
                result: None,
                error: Some(err),
            },
        }
    }

    /// Dispatch a JSON-RPC notification.
    pub async fn handle_notification(&self, notification: Notification) -> anyhow::Result<()> {
        match notification.method.as_str() {
            "agent/tool_result" => {
                // TODO: Route tool result back to agent loop
                tracing::debug!("Received tool_result notification");
                Ok(())
            }
            "agent/approval_response" => {
                // TODO: Route approval response back to agent loop
                tracing::debug!("Received approval_response notification");
                Ok(())
            }
            _ => {
                tracing::warn!("Unknown agent notification: {}", notification.method);
                Ok(())
            }
        }
    }

    /// Start the agent, transitioning to Running status.
    ///
    /// Note: If `working_directory` is provided in params, it permanently overrides
    /// the constructor-provided directory. This is intentional -- callers can adjust
    /// the working directory between agent runs. The working directory is NOT reset
    /// on stop; use the constructor value if you need a fresh start.
    async fn handle_start(&self, params: Option<Value>) -> Result<Value, ErrorObject> {
        let working_directory = params
            .as_ref()
            .and_then(|p| p.get("working_directory"))
            .and_then(|v| v.as_str())
            .map(String::from);

        let mut state = self.state.lock().await;

        if state.status == AgentStatus::Running {
            return Err(ErrorObject {
                code: STATE_CONFLICT,
                message: "State Conflict".to_string(),
                data: Some(json!({
                    "reason": "Agent is already running",
                    "current_status": state.status,
                })),
            });
        }

        if let Some(dir) = working_directory {
            state.working_directory = dir;
        }

        state.status = AgentStatus::Running;
        state.conversation_id = Some(uuid::Uuid::new_v4().to_string());

        Ok(json!({
            "agent_id": state.id,
            "status": "running",
            "conversation_id": state.conversation_id,
        }))
    }

    /// Stop the agent, transitioning to Idle status.
    async fn handle_stop(&self) -> Result<Value, ErrorObject> {
        let mut state = self.state.lock().await;

        if state.status == AgentStatus::Idle {
            return Err(ErrorObject {
                code: STATE_CONFLICT,
                message: "State Conflict".to_string(),
                data: Some(json!({
                    "reason": "Agent is not running",
                    "current_status": state.status,
                })),
            });
        }

        let agent_id = state.id.clone();
        state.status = AgentStatus::Idle;
        state.conversation_id = None;

        Ok(json!({
            "agent_id": agent_id,
            "status": "stopped",
        }))
    }

    /// Send a message to the agent. Agent must be running.
    async fn handle_send(&self, params: Option<Value>) -> Result<Value, ErrorObject> {
        let state = self.state.lock().await;

        if state.status != AgentStatus::Running {
            return Err(ErrorObject {
                code: STATE_CONFLICT,
                message: "State Conflict".to_string(),
                data: Some(json!({
                    "reason": "Agent is not running",
                    "current_status": state.status,
                    "suggestion": "Call agent/start before sending messages",
                })),
            });
        }

        let message = params
            .as_ref()
            .and_then(|p| p.get("message"))
            .and_then(|v| v.as_str())
            .ok_or_else(|| ErrorObject {
                code: INVALID_PARAMS,
                message: "Invalid Params".to_string(),
                data: Some(json!({
                    "reason": "Missing required parameter: message",
                })),
            })?;

        // Phase 3: 接入 LLM 管道，实现完整的 Agent 对话循环
        // 当前返回明确的"未实现"错误，避免回显消息造成误导
        Err(ErrorObject {
            code: METHOD_NOT_FOUND,
            message: "Not Implemented".to_string(),
            data: Some(json!({
                "reason": "agent/send 的 LLM 管道集成尚未实现（计划在 Phase 3 完成）",
                "received_message": message,
                "conversation_id": state.conversation_id,
            })),
        })
    }

    /// Cancel the current agent operation.
    async fn handle_cancel(&self) -> Result<Value, ErrorObject> {
        let state = self.state.lock().await;

        if state.status != AgentStatus::Running {
            return Err(ErrorObject {
                code: STATE_CONFLICT,
                message: "State Conflict".to_string(),
                data: Some(json!({
                    "reason": "Agent is not running",
                    "current_status": state.status,
                })),
            });
        }

        // TODO: Cancel in-flight LLM request
        Ok(json!({
            "agent_id": state.id,
            "status": "cancelled",
        }))
    }

    /// Get a snapshot of the current agent state (for testing/diagnostics).
    pub async fn state(&self) -> AgentState {
        self.state.lock().await.clone()
    }
}
