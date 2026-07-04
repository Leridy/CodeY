#[cfg(test)]
mod tests;

use anyhow::Result;
use serde_json::{json, Value};
use crate::protocol::{Response, ErrorObject, INVALID_PARAMS, PROCESS_ERROR, TIMEOUT};
use std::collections::HashMap;
use std::process::Stdio;
use std::sync::Arc;
use tokio::process::Command;
use tokio::sync::Mutex;

/// Tracks a background child process.
#[derive(Debug)]
struct BackgroundProcess {
    child: tokio::process::Child,
}

/// Shell execution state shared across handler methods.
#[derive(Debug)]
pub struct ShellState {
    pub working_directory: std::path::PathBuf,
    /// Background processes keyed by a unique handle ID (not OS PID).
    background: HashMap<u32, BackgroundProcess>,
    /// Monotonically increasing counter for unique process handles.
    next_handle: u32,
}

/// Shell handler implementing shell/execute, shell/output, shell/exit, shell/kill.
pub struct ShellHandler {
    state: Arc<Mutex<ShellState>>,
}

/// Dangerous command patterns that should be blocked.
const BLOCKED_PATTERNS: &[&str] = &[
    "rm -rf /",
    "mkfs",
    "dd if=",
    ":(){:|:&};:",  // fork bomb
    "> /dev/sd",
    "chmod -R 777 /",
    "shutdown",
    "reboot",
    "halt",
    "poweroff",
    "init 0",
    "init 6",
];

impl ShellHandler {
    pub fn new(working_directory: std::path::PathBuf) -> Self {
        Self {
            state: Arc::new(Mutex::new(ShellState {
                working_directory,
                background: HashMap::new(),
                next_handle: 1,
            })),
        }
    }

    /// Build a JSON-RPC success response.
    fn success(id: Value, result: Value) -> Response {
        Response {
            jsonrpc: "2.0".to_string(),
            id,
            result: Some(result),
            error: None,
        }
    }

    /// Build a JSON-RPC error response.
    fn error(id: Value, code: i32, message: &str) -> Response {
        Response {
            jsonrpc: "2.0".to_string(),
            id,
            result: None,
            error: Some(ErrorObject {
                code,
                message: message.to_string(),
                data: None,
            }),
        }
    }

    /// Validate a command string against the blocklist.
    fn validate_command(command: &str) -> Result<(), String> {
        let lower = command.to_lowercase();
        for pattern in BLOCKED_PATTERNS {
            if lower.contains(&pattern.to_lowercase()) {
                return Err(format!(
                    "Command contains blocked pattern: '{}'",
                    pattern
                ));
            }
        }

        // Block commands that try to change directory outside working dir.
        // This is a heuristic -- a full sandbox would use seccomp/landlock.
        if lower.contains("cd /") || lower.contains("cd ..") {
            return Err("Command attempts to change directory outside working directory".to_string());
        }

        Ok(())
    }

    /// shell/execute - Execute a shell command.
    ///
    /// Params:
    ///   - command (string, required): the command to run
    ///   - timeout (u64, optional): seconds before timeout, default 30
    ///   - background (bool, optional): run in background, default false
    pub async fn execute(&self, id: Value, params: Value) -> Result<Response> {
        let command = match params.get("command").and_then(|v| v.as_str()) {
            Some(cmd) => cmd.trim(),
            None => return Ok(Self::error(id, INVALID_PARAMS, "Missing required parameter: command")),
        };

        if command.is_empty() {
            return Ok(Self::error(id, INVALID_PARAMS, "Command must not be empty"));
        }

        // C1: Validate command against blocklist.
        if let Err(reason) = Self::validate_command(command) {
            return Ok(Self::error(id, PROCESS_ERROR, &reason));
        }

        let timeout = params
            .get("timeout")
            .and_then(|v| v.as_u64())
            .unwrap_or(30);

        let background = params
            .get("background")
            .and_then(|v| v.as_bool())
            .unwrap_or(false);

        let working_dir = {
            let state = self.state.lock().await;
            state.working_directory.clone()
        };

        let mut cmd = if cfg!(target_os = "windows") {
            let mut c = Command::new("cmd");
            c.args(["/C", command]);
            c
        } else {
            let mut c = Command::new("sh");
            c.args(["-c", command]);
            c
        };

        cmd.current_dir(&working_dir)
            .stdout(Stdio::piped())
            .stderr(Stdio::piped());

        if background {
            self.execute_background(id, cmd, command).await
        } else {
            self.execute_foreground(id, cmd, timeout).await
        }
    }

    /// Spawn a background process and return its handle ID.
    async fn execute_background(
        &self,
        id: Value,
        mut cmd: Command,
        command: &str,
    ) -> Result<Response> {
        let child = cmd.spawn().map_err(|e| {
            anyhow::anyhow!("Failed to spawn background process: {}", e)
        })?;

        let mut state = self.state.lock().await;
        let handle_id = state.next_handle;
        state.next_handle += 1;
        state.background.insert(handle_id, BackgroundProcess { child });

        Ok(Self::success(id, json!({
            "handle_id": handle_id,
            "status": "background",
            "command": command
        })))
    }

    /// Run a foreground command with timeout.
    async fn execute_foreground(
        &self,
        id: Value,
        mut cmd: Command,
        timeout: u64,
    ) -> Result<Response> {
        match tokio::time::timeout(
            std::time::Duration::from_secs(timeout),
            cmd.output(),
        )
        .await
        {
            Err(_elapsed) => Ok(Self::error(id, TIMEOUT, "Command timed out")),
            Ok(Err(e)) => Ok(Self::error(id, PROCESS_ERROR, &format!("Failed to execute command: {}", e))),
            Ok(Ok(output)) => Ok(Self::success(id, json!({
                "stdout": String::from_utf8_lossy(&output.stdout).to_string(),
                "stderr": String::from_utf8_lossy(&output.stderr).to_string(),
                "exit_code": output.status.code().unwrap_or(-1),
                "success": output.status.success()
            }))),
        }
    }

    /// shell/output - Retrieve output from a background process.
    ///
    /// Params:
    ///   - handle_id (u64, required): the handle ID of the background process
    pub async fn output(&self, id: Value, params: Value) -> Result<Response> {
        let handle_id = match params.get("handle_id").and_then(|v| v.as_u64()) {
            Some(h) => h as u32,
            None => return Ok(Self::error(id, INVALID_PARAMS, "Missing required parameter: handle_id")),
        };

        let mut state = self.state.lock().await;
        let child = match state.background.get_mut(&handle_id) {
            Some(c) => c,
            None => return Ok(Self::error(id, PROCESS_ERROR, &format!("No background process with handle_id: {}", handle_id))),
        };

        match child.child.try_wait() {
            Ok(Some(_status)) => {
                // Process exited -- collect its output by removing from the map first.
                let entry = state.background.remove(&handle_id).unwrap();
                let output = entry.child.wait_with_output().await;

                match output {
                    Ok(out) => Ok(Self::success(id, json!({
                        "handle_id": handle_id,
                        "done": true,
                        "stdout": String::from_utf8_lossy(&out.stdout).to_string(),
                        "stderr": String::from_utf8_lossy(&out.stderr).to_string(),
                        "exit_code": out.status.code().unwrap_or(-1),
                        "success": out.status.success()
                    }))),
                    Err(e) => Ok(Self::error(id, PROCESS_ERROR, &format!("Failed to collect output: {}", e))),
                }
            }
            Ok(None) => {
                // Still running.
                Ok(Self::success(id, json!({
                    "handle_id": handle_id,
                    "done": false
                })))
            }
            Err(e) => Ok(Self::error(id, PROCESS_ERROR, &format!("Error checking process status: {}", e))),
        }
    }

    /// shell/exit - Check if a background process is still running.
    ///
    /// Params:
    ///   - handle_id (u64, required): the handle ID to check
    pub async fn exit(&self, id: Value, params: Value) -> Result<Response> {
        let handle_id = match params.get("handle_id").and_then(|v| v.as_u64()) {
            Some(h) => h as u32,
            None => return Ok(Self::error(id, INVALID_PARAMS, "Missing required parameter: handle_id")),
        };

        let mut state = self.state.lock().await;
        if let Some(child) = state.background.get_mut(&handle_id) {
            match child.child.try_wait() {
                Ok(Some(status)) => {
                    let exit_code = status.code().unwrap_or(-1);
                    state.background.remove(&handle_id);
                    return Ok(Self::success(id, json!({
                        "handle_id": handle_id,
                        "running": false,
                        "exit_code": exit_code
                    })));
                }
                Ok(None) => {
                    return Ok(Self::success(id, json!({
                        "handle_id": handle_id,
                        "running": true
                    })));
                }
                Err(e) => {
                    return Ok(Self::error(id, PROCESS_ERROR, &format!("Error checking process: {}", e)));
                }
            }
        }

        // Not tracked locally -- report not found.
        Ok(Self::error(id, PROCESS_ERROR, &format!("No background process with handle_id: {}", handle_id)))
    }

    /// shell/kill - Terminate a background process.
    ///
    /// Params:
    ///   - handle_id (u64, required): the handle ID to kill
    pub async fn kill(&self, id: Value, params: Value) -> Result<Response> {
        let handle_id = match params.get("handle_id").and_then(|v| v.as_u64()) {
            Some(h) => h as u32,
            None => return Ok(Self::error(id, INVALID_PARAMS, "Missing required parameter: handle_id")),
        };

        // C3: Only allow killing processes spawned by this handler.
        let mut state = self.state.lock().await;
        if let Some(mut child) = state.background.remove(&handle_id) {
            match child.child.kill().await {
                Ok(()) => {
                    Ok(Self::success(id, json!({
                        "handle_id": handle_id,
                        "success": true,
                        "message": "Process terminated"
                    })))
                }
                Err(e) => {
                    Ok(Self::error(id, PROCESS_ERROR, &format!("Failed to kill process: {}", e)))
                }
            }
        } else {
            Ok(Self::error(id, PROCESS_ERROR, &format!("No background process with handle_id: {}", handle_id)))
        }
    }
}
