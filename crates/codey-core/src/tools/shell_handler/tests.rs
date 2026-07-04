use super::*;
use serde_json::json;
use std::path::PathBuf;

fn test_handler() -> ShellHandler {
    ShellHandler::new(PathBuf::from("/tmp"))
}

fn id() -> Value {
    json!("test-id")
}

#[tokio::test]
async fn test_execute_simple_command() {
    let handler = test_handler();
    let params = json!({
        "command": "echo hello"
    });

    let resp = handler.execute(id(), params).await.unwrap();
    assert!(resp.error.is_none());
    let result = resp.result.unwrap();
    assert_eq!(result["stdout"].as_str().unwrap().trim(), "hello");
    assert_eq!(result["exit_code"].as_i64().unwrap(), 0);
    assert_eq!(result["success"].as_bool().unwrap(), true);
}

#[tokio::test]
async fn test_execute_command_with_stderr() {
    let handler = test_handler();
    let params = json!({
        "command": "ls /nonexistent_path_xyz_12345"
    });

    let resp = handler.execute(id(), params).await.unwrap();
    assert!(resp.error.is_none());
    let result = resp.result.unwrap();
    assert_ne!(result["exit_code"].as_i64().unwrap(), 0);
    assert_eq!(result["success"].as_bool().unwrap(), false);
    assert!(!result["stderr"].as_str().unwrap().is_empty());
}

#[tokio::test]
async fn test_execute_with_timeout() {
    let handler = test_handler();
    let params = json!({
        "command": "sleep 0.1",
        "timeout": 5
    });

    let resp = handler.execute(id(), params).await.unwrap();
    assert!(resp.error.is_none());
    let result = resp.result.unwrap();
    assert_eq!(result["exit_code"].as_i64().unwrap(), 0);
}

#[tokio::test]
async fn test_execute_timeout_exceeded() {
    let handler = test_handler();
    let params = json!({
        "command": "sleep 10",
        "timeout": 1
    });

    let resp = handler.execute(id(), params).await.unwrap();
    assert!(resp.error.is_some());
    let err = resp.error.unwrap();
    assert_eq!(err.code, TIMEOUT);
}

#[tokio::test]
async fn test_execute_background() {
    let handler = test_handler();
    let params = json!({
        "command": "sleep 0.1",
        "background": true
    });

    let resp = handler.execute(id(), params).await.unwrap();
    assert!(resp.error.is_none());
    let result = resp.result.unwrap();
    assert!(result["handle_id"].as_u64().unwrap() > 0);
    assert_eq!(result["status"].as_str().unwrap(), "background");
}

#[tokio::test]
async fn test_execute_missing_command() {
    let handler = test_handler();
    let params = json!({});

    let resp = handler.execute(id(), params).await.unwrap();
    assert!(resp.error.is_some());
    let err = resp.error.unwrap();
    assert_eq!(err.code, INVALID_PARAMS);
}

#[tokio::test]
async fn test_execute_empty_command() {
    let handler = test_handler();
    let params = json!({
        "command": "   "
    });

    let resp = handler.execute(id(), params).await.unwrap();
    assert!(resp.error.is_some());
    let err = resp.error.unwrap();
    assert_eq!(err.code, INVALID_PARAMS);
}

#[tokio::test]
async fn test_exit_with_invalid_handle_id() {
    let handler = test_handler();
    let params = json!({
        "handle_id": 999999
    });

    let resp = handler.exit(id(), params).await.unwrap();
    assert!(resp.error.is_some());
    let err = resp.error.unwrap();
    assert!(err.message.contains("No background process"));
}

#[tokio::test]
async fn test_exit_missing_handle_id() {
    let handler = test_handler();
    let params = json!({});

    let resp = handler.exit(id(), params).await.unwrap();
    assert!(resp.error.is_some());
    let err = resp.error.unwrap();
    assert_eq!(err.code, INVALID_PARAMS);
}

#[tokio::test]
async fn test_kill_missing_handle_id() {
    let handler = test_handler();
    let params = json!({});

    let resp = handler.kill(id(), params).await.unwrap();
    assert!(resp.error.is_some());
    let err = resp.error.unwrap();
    assert_eq!(err.code, INVALID_PARAMS);
}

#[tokio::test]
async fn test_kill_nonexistent_process() {
    let handler = test_handler();
    let params = json!({
        "handle_id": 999999
    });

    let resp = handler.kill(id(), params).await.unwrap();
    // Should return an error since handle_id is not tracked.
    assert!(resp.error.is_some());
}

#[tokio::test]
async fn test_output_missing_handle_id() {
    let handler = test_handler();
    let params = json!({});

    let resp = handler.output(id(), params).await.unwrap();
    assert!(resp.error.is_some());
    let err = resp.error.unwrap();
    assert_eq!(err.code, INVALID_PARAMS);
}

#[tokio::test]
async fn test_execute_nonexistent_command() {
    let handler = test_handler();
    let params = json!({
        "command": "nonexistent_command_xyz_12345"
    });

    let resp = handler.execute(id(), params).await.unwrap();
    // sh -c returns a non-zero exit code for unknown commands;
    // the response itself succeeds but reports failure in the result.
    assert!(resp.error.is_none());
    let result = resp.result.unwrap();
    assert_eq!(result["success"].as_bool().unwrap(), false);
    assert_ne!(result["exit_code"].as_i64().unwrap(), 0);
}

// ============================================================
// C1 fix: Command injection / blocked pattern tests
// ============================================================

#[tokio::test]
async fn test_execute_blocked_rm_rf_root() {
    let handler = test_handler();
    let params = json!({
        "command": "rm -rf / --no-preserve-root"
    });

    let resp = handler.execute(id(), params).await.unwrap();
    assert!(resp.error.is_some());
    let err = resp.error.unwrap();
    assert_eq!(err.code, PROCESS_ERROR);
    assert!(err.message.contains("blocked pattern"));
}

#[tokio::test]
async fn test_execute_blocked_fork_bomb() {
    let handler = test_handler();
    let params = json!({
        "command": ":(){:|:&};:"
    });

    let resp = handler.execute(id(), params).await.unwrap();
    assert!(resp.error.is_some());
    let err = resp.error.unwrap();
    assert_eq!(err.code, PROCESS_ERROR);
}

#[tokio::test]
async fn test_execute_blocked_shutdown() {
    let handler = test_handler();
    let params = json!({
        "command": "shutdown -h now"
    });

    let resp = handler.execute(id(), params).await.unwrap();
    assert!(resp.error.is_some());
    let err = resp.error.unwrap();
    assert_eq!(err.code, PROCESS_ERROR);
}

#[tokio::test]
async fn test_execute_blocked_cd_root() {
    let handler = test_handler();
    let params = json!({
        "command": "cd / && rm -rf tmp"
    });

    let resp = handler.execute(id(), params).await.unwrap();
    assert!(resp.error.is_some());
    let err = resp.error.unwrap();
    assert_eq!(err.code, PROCESS_ERROR);
}

// ============================================================
// C3 fix: Kill only handler-spawned processes
// ============================================================

#[tokio::test]
async fn test_kill_untracked_process_rejected() {
    let handler = test_handler();
    let params = json!({
        "handle_id": 1
    });

    let resp = handler.kill(id(), params).await.unwrap();
    assert!(resp.error.is_some());
    let err = resp.error.unwrap();
    assert!(err.message.contains("No background process"));
}

// ============================================================
// H2 fix: Response ID propagation
// ============================================================

#[tokio::test]
async fn test_response_preserves_request_id() {
    let handler = test_handler();
    let request_id = json!("my-req-id-42");
    let params = json!({
        "command": "echo test"
    });

    let resp = handler.execute(request_id.clone(), params).await.unwrap();
    assert_eq!(resp.id, request_id);
}

#[tokio::test]
async fn test_error_response_preserves_request_id() {
    let handler = test_handler();
    let request_id = json!(123);

    let resp = handler.execute(request_id.clone(), json!({})).await.unwrap();
    assert_eq!(resp.id, request_id);
    assert!(resp.error.is_some());
}

// ============================================================
// M4 fix: Background process handle IDs are unique
// ============================================================

#[tokio::test]
async fn test_background_handle_ids_are_unique() {
    let handler = test_handler();

    let resp1 = handler.execute(id(), json!({
        "command": "sleep 0.5",
        "background": true
    })).await.unwrap();

    let resp2 = handler.execute(id(), json!({
        "command": "sleep 0.5",
        "background": true
    })).await.unwrap();

    let id1 = resp1.result.unwrap()["handle_id"].as_u64().unwrap();
    let id2 = resp2.result.unwrap()["handle_id"].as_u64().unwrap();

    assert_ne!(id1, id2);
}

// ============================================================
// M3: Verify background lifecycle (start -> output -> done)
// ============================================================

#[tokio::test]
async fn test_background_lifecycle_start_output_done() {
    let handler = test_handler();

    // Start a background process.
    let resp = handler.execute(id(), json!({
        "command": "echo bg_test",
        "background": true
    })).await.unwrap();

    assert!(resp.error.is_none());
    let handle_id = resp.result.unwrap()["handle_id"].as_u64().unwrap();

    // Wait for the process to finish.
    tokio::time::sleep(std::time::Duration::from_millis(200)).await;

    // Get output -- should be done.
    let resp = handler.output(id(), json!({
        "handle_id": handle_id
    })).await.unwrap();

    assert!(resp.error.is_none());
    let result = resp.result.unwrap();
    assert_eq!(result["done"].as_bool().unwrap(), true);
    assert_eq!(result["stdout"].as_str().unwrap().trim(), "bg_test");
    assert_eq!(result["exit_code"].as_i64().unwrap(), 0);
}

// ============================================================
// L2: Concurrent access test
// ============================================================

#[tokio::test]
async fn test_concurrent_execute() {
    let handler = Arc::new(test_handler());
    let mut handles = Vec::new();

    for i in 0..5 {
        let h = handler.clone();
        handles.push(tokio::spawn(async move {
            let params = json!({ "command": format!("echo {}", i) });
            h.execute(json!(i), params).await
        }));
    }

    for handle in handles {
        let result = handle.await.unwrap();
        assert!(result.is_ok());
        let resp = result.unwrap();
        assert!(resp.error.is_none());
    }
}
