//! Tests for AgentHandler - written FIRST per TDD workflow.

#[cfg(test)]
mod tests {
    use super::super::*;
    use crate::protocol::Request;
    use serde_json::json;

    fn make_request(method: &str, params: Option<serde_json::Value>) -> Request {
        Request {
            jsonrpc: "2.0".to_string(),
            id: json!("test-1"),
            method: method.to_string(),
            params,
        }
    }

    // -------------------------------------------------------
    // agent/start
    // -------------------------------------------------------

    #[tokio::test]
    async fn test_start_returns_agent_id_and_running_status() {
        let handler = AgentHandler::new("/tmp".to_string());
        let req = make_request("agent/start", Some(json!({})));
        let resp = handler.handle_request(req).await;

        assert!(resp.error.is_none(), "start should not error");
        let result = resp.result.as_ref().unwrap();
        assert!(result.get("agent_id").is_some(), "must return agent_id");
        assert_eq!(result["status"], "running");
        assert!(
            result.get("conversation_id").is_some(),
            "must return conversation_id"
        );
    }

    #[tokio::test]
    async fn test_start_sets_state_to_running() {
        let handler = AgentHandler::new("/tmp".to_string());
        let req = make_request("agent/start", Some(json!({})));
        handler.handle_request(req).await;

        let state = handler.state().await;
        assert_eq!(state.status, AgentStatus::Running);
        assert!(state.conversation_id.is_some());
    }

    #[tokio::test]
    async fn test_start_with_custom_working_directory() {
        let handler = AgentHandler::new("/tmp".to_string());
        let req = make_request(
            "agent/start",
            Some(json!({ "working_directory": "/custom/dir" })),
        );
        handler.handle_request(req).await;

        let state = handler.state().await;
        assert_eq!(state.working_directory, "/custom/dir");
    }

    #[tokio::test]
    async fn test_start_when_already_running_returns_state_conflict() {
        let handler = AgentHandler::new("/tmp".to_string());

        // First start
        let req = make_request("agent/start", Some(json!({})));
        handler.handle_request(req).await;

        // Second start should conflict
        let req = make_request("agent/start", Some(json!({})));
        let resp = handler.handle_request(req).await;

        assert!(resp.result.is_none(), "should not have result");
        let err = resp.error.as_ref().unwrap();
        assert_eq!(err.code, -32007);
        assert_eq!(err.message, "State Conflict");
    }

    // -------------------------------------------------------
    // agent/stop
    // -------------------------------------------------------

    #[tokio::test]
    async fn test_stop_returns_stopped_status() {
        let handler = AgentHandler::new("/tmp".to_string());

        // Start first
        let req = make_request("agent/start", Some(json!({})));
        handler.handle_request(req).await;

        // Stop
        let req = make_request("agent/stop", None);
        let resp = handler.handle_request(req).await;

        assert!(resp.error.is_none(), "stop should not error");
        let result = resp.result.as_ref().unwrap();
        assert_eq!(result["status"], "stopped");
        assert!(result.get("agent_id").is_some());
    }

    #[tokio::test]
    async fn test_stop_sets_state_to_idle() {
        let handler = AgentHandler::new("/tmp".to_string());

        // Start then stop
        handler
            .handle_request(make_request("agent/start", Some(json!({}))))
            .await;
        handler
            .handle_request(make_request("agent/stop", None))
            .await;

        let state = handler.state().await;
        assert_eq!(state.status, AgentStatus::Idle);
        assert!(state.conversation_id.is_none());
    }

    #[tokio::test]
    async fn test_stop_when_not_running_returns_state_conflict() {
        let handler = AgentHandler::new("/tmp".to_string());
        let req = make_request("agent/stop", None);
        let resp = handler.handle_request(req).await;

        assert!(resp.result.is_none());
        let err = resp.error.as_ref().unwrap();
        assert_eq!(err.code, -32007);
        assert_eq!(err.message, "State Conflict");
    }

    // -------------------------------------------------------
    // agent/send
    // -------------------------------------------------------

    #[tokio::test]
    async fn test_send_returns_not_implemented_error() {
        let handler = AgentHandler::new("/tmp".to_string());

        handler
            .handle_request(make_request("agent/start", Some(json!({}))))
            .await;

        let req = make_request("agent/send", Some(json!({ "message": "hello" })));
        let resp = handler.handle_request(req).await;

        // Phase 3: LLM 管道集成前，agent/send 返回"未实现"错误
        assert!(resp.result.is_none(), "should not have result");
        let err = resp.error.as_ref().unwrap();
        assert_eq!(err.code, -32601);
        assert_eq!(err.message, "Not Implemented");
    }

    #[tokio::test]
    async fn test_send_without_start_returns_state_conflict() {
        let handler = AgentHandler::new("/tmp".to_string());

        let req = make_request("agent/send", Some(json!({ "message": "hello" })));
        let resp = handler.handle_request(req).await;

        assert!(resp.result.is_none());
        let err = resp.error.as_ref().unwrap();
        assert_eq!(err.code, -32007);
    }

    #[tokio::test]
    async fn test_send_missing_message_param_returns_invalid_params() {
        let handler = AgentHandler::new("/tmp".to_string());

        handler
            .handle_request(make_request("agent/start", Some(json!({}))))
            .await;

        let req = make_request("agent/send", Some(json!({})));
        let resp = handler.handle_request(req).await;

        assert!(resp.result.is_none());
        let err = resp.error.as_ref().unwrap();
        assert_eq!(err.code, -32602);
        assert_eq!(err.message, "Invalid Params");
    }

    #[tokio::test]
    async fn test_send_null_message_returns_invalid_params() {
        let handler = AgentHandler::new("/tmp".to_string());

        handler
            .handle_request(make_request("agent/start", Some(json!({}))))
            .await;

        let req = make_request("agent/send", Some(json!({ "message": null })));
        let resp = handler.handle_request(req).await;

        assert!(resp.result.is_none());
        let err = resp.error.as_ref().unwrap();
        assert_eq!(err.code, -32602);
    }

    #[tokio::test]
    async fn test_send_without_params_returns_invalid_params() {
        let handler = AgentHandler::new("/tmp".to_string());

        handler
            .handle_request(make_request("agent/start", Some(json!({}))))
            .await;

        let req = make_request("agent/send", None);
        let resp = handler.handle_request(req).await;

        assert!(resp.result.is_none());
        let err = resp.error.as_ref().unwrap();
        assert_eq!(err.code, -32602);
    }

    // -------------------------------------------------------
    // agent/cancel
    // -------------------------------------------------------

    #[tokio::test]
    async fn test_cancel_returns_cancelled_status() {
        let handler = AgentHandler::new("/tmp".to_string());

        handler
            .handle_request(make_request("agent/start", Some(json!({}))))
            .await;

        let req = make_request("agent/cancel", None);
        let resp = handler.handle_request(req).await;

        assert!(resp.error.is_none(), "cancel should not error");
        let result = resp.result.as_ref().unwrap();
        assert_eq!(result["status"], "cancelled");
        assert!(result.get("agent_id").is_some());
    }

    #[tokio::test]
    async fn test_cancel_when_not_running_returns_state_conflict() {
        let handler = AgentHandler::new("/tmp".to_string());

        let req = make_request("agent/cancel", None);
        let resp = handler.handle_request(req).await;

        assert!(resp.result.is_none());
        let err = resp.error.as_ref().unwrap();
        assert_eq!(err.code, -32007);
    }

    // -------------------------------------------------------
    // Unknown methods
    // -------------------------------------------------------

    #[tokio::test]
    async fn test_unknown_method_returns_method_not_found() {
        let handler = AgentHandler::new("/tmp".to_string());

        let req = make_request("agent/nonexistent", None);
        let resp = handler.handle_request(req).await;

        assert!(resp.result.is_none());
        let err = resp.error.as_ref().unwrap();
        assert_eq!(err.code, -32601);
        assert_eq!(err.message, "Method Not Found");
    }

    // -------------------------------------------------------
    // Response format
    // -------------------------------------------------------

    #[tokio::test]
    async fn test_response_has_jsonrpc_and_matching_id() {
        let handler = AgentHandler::new("/tmp".to_string());

        let req = Request {
            jsonrpc: "2.0".to_string(),
            id: json!("my-req-id"),
            method: "agent/start".to_string(),
            params: Some(json!({})),
        };
        let resp = handler.handle_request(req).await;

        assert_eq!(resp.jsonrpc, "2.0");
        assert_eq!(resp.id, json!("my-req-id"));
    }

    #[tokio::test]
    async fn test_error_response_preserves_request_id() {
        let handler = AgentHandler::new("/tmp".to_string());

        let req = Request {
            jsonrpc: "2.0".to_string(),
            id: json!(42),
            method: "agent/send".to_string(),
            params: Some(json!({ "message": "hi" })),
        };
        let resp = handler.handle_request(req).await;

        assert_eq!(resp.id, json!(42));
        assert!(resp.error.is_some());
    }

    // -------------------------------------------------------
    // Notifications
    // -------------------------------------------------------

    #[tokio::test]
    async fn test_handle_notification_tool_result_succeeds() {
        let handler = AgentHandler::new("/tmp".to_string());
        let notif = Notification {
            jsonrpc: "2.0".to_string(),
            method: "agent/tool_result".to_string(),
            params: Some(json!({ "result": "ok" })),
        };
        let result = handler.handle_notification(notif).await;
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_handle_notification_approval_response_succeeds() {
        let handler = AgentHandler::new("/tmp".to_string());
        let notif = Notification {
            jsonrpc: "2.0".to_string(),
            method: "agent/approval_response".to_string(),
            params: Some(json!({ "approved": true })),
        };
        let result = handler.handle_notification(notif).await;
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_handle_notification_unknown_method_does_not_error() {
        let handler = AgentHandler::new("/tmp".to_string());
        let notif = Notification {
            jsonrpc: "2.0".to_string(),
            method: "agent/unknown_notif".to_string(),
            params: None,
        };
        let result = handler.handle_notification(notif).await;
        assert!(result.is_ok());
    }

    // -------------------------------------------------------
    // Full lifecycle
    // -------------------------------------------------------

    #[tokio::test]
    async fn test_full_lifecycle_start_send_stop() {
        let handler = AgentHandler::new("/tmp".to_string());

        // Start
        let resp = handler
            .handle_request(make_request("agent/start", Some(json!({}))))
            .await;
        assert!(resp.error.is_none());
        let agent_id = resp.result.as_ref().unwrap()["agent_id"].clone();

        // Send - Phase 3 LLM 管道集成前返回"未实现"错误
        let resp = handler
            .handle_request(make_request(
                "agent/send",
                Some(json!({ "message": "ping" })),
            ))
            .await;
        assert!(resp.result.is_none());
        let err = resp.error.as_ref().unwrap();
        assert_eq!(err.code, -32601);

        // Cancel
        let resp = handler
            .handle_request(make_request("agent/cancel", None))
            .await;
        assert!(resp.error.is_none());

        // Stop
        let resp = handler
            .handle_request(make_request("agent/stop", None))
            .await;
        assert!(resp.error.is_none());
        assert_eq!(resp.result.as_ref().unwrap()["agent_id"], agent_id);
    }

    #[tokio::test]
    async fn test_restart_after_stop() {
        let handler = AgentHandler::new("/tmp".to_string());

        // Start, stop, start again
        handler
            .handle_request(make_request("agent/start", Some(json!({}))))
            .await;
        handler
            .handle_request(make_request("agent/stop", None))
            .await;
        let resp = handler
            .handle_request(make_request("agent/start", Some(json!({}))))
            .await;

        assert!(resp.error.is_none());
        assert_eq!(resp.result.as_ref().unwrap()["status"], "running");
    }

    #[tokio::test]
    async fn test_agent_id_stable_across_lifecycle() {
        let handler = AgentHandler::new("/tmp".to_string());

        let resp1 = handler
            .handle_request(make_request("agent/start", Some(json!({}))))
            .await;
        let id1 = resp1.result.as_ref().unwrap()["agent_id"].clone();

        handler
            .handle_request(make_request("agent/stop", None))
            .await;

        let resp2 = handler
            .handle_request(make_request("agent/start", Some(json!({}))))
            .await;
        let id2 = resp2.result.as_ref().unwrap()["agent_id"].clone();

        // Agent ID should be the same instance
        assert_eq!(id1, id2);
    }
}
