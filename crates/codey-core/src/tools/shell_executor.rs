//! ShellExecutor - Shell 命令执行器，集成 PathValidator 进行工作目录校验。

use anyhow::Result;
use serde_json::{json, Value};
use std::process::Stdio;
use std::sync::Arc;
use std::time::Duration;
use tokio::process::Command;

use crate::permission::PathValidator;

/// 危险命令模式列表，复用 ShellHandler 的拦截规则。
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

/// Shell 命令执行器，提供受沙箱保护的命令执行能力。
///
/// 工作目录通过 `PathValidator` 校验，危险命令通过模式匹配拦截。
/// 默认超时 30 秒，可通过构造参数调整。
pub struct ShellExecutor {
    working_directory: std::path::PathBuf,
    path_validator: Arc<PathValidator>,
    default_timeout: u64,
}

impl ShellExecutor {
    /// 默认超时时间（秒）。
    const DEFAULT_TIMEOUT_SECS: u64 = 30;

    /// 创建新的 ShellExecutor 实例。
    ///
    /// # 参数
    /// - `working_directory`: 命令执行的工作目录
    /// - `path_validator`: 路径校验器，用于校验工作目录
    pub fn new(working_directory: std::path::PathBuf, path_validator: Arc<PathValidator>) -> Self {
        Self {
            working_directory,
            path_validator,
            default_timeout: Self::DEFAULT_TIMEOUT_SECS,
        }
    }

    /// 执行 Shell 命令。
    ///
    /// # 流程
    /// 1. 校验命令是否包含危险模式
    /// 2. 校验工作目录是否被 PathValidator 允许
    /// 3. 通过 tokio::process::Command 执行命令
    /// 4. 使用 tokio::time::timeout 设置超时
    ///
    /// # 参数
    /// - `command`: 要执行的 Shell 命令
    ///
    /// # 返回
    /// JSON 对象包含执行结果：
    /// ```json
    /// { "stdout": "...", "stderr": "...", "exit_code": 0, "success": true }
    /// ```
    ///
    /// # 错误
    /// - 命令包含危险模式
    /// - 工作目录不被允许
    /// - 命令执行超时
    /// - 命令执行失败
    pub async fn execute(&self, command: &str) -> Result<Value> {
        // 校验命令安全性
        self.validate_command(command)?;

        // 校验工作目录
        if !self.path_validator.is_path_allowed(&self.working_directory) {
            anyhow::bail!(
                "Working directory not allowed by PathValidator: {}",
                self.working_directory.display()
            );
        }

        tracing::debug!(command = command, "ShellExecutor: executing command");

        let mut cmd = if cfg!(target_os = "windows") {
            let mut c = Command::new("cmd");
            c.args(["/C", command]);
            c
        } else {
            let mut c = Command::new("sh");
            c.args(["-c", command]);
            c
        };

        cmd.current_dir(&self.working_directory)
            .stdout(Stdio::piped())
            .stderr(Stdio::piped());

        match tokio::time::timeout(Duration::from_secs(self.default_timeout), cmd.output()).await {
            Err(_elapsed) => {
                anyhow::bail!("Command timed out after {} seconds", self.default_timeout);
            }
            Ok(Err(e)) => {
                anyhow::bail!("Failed to execute command: {}", e);
            }
            Ok(Ok(output)) => {
                let stdout = String::from_utf8_lossy(&output.stdout).to_string();
                let stderr = String::from_utf8_lossy(&output.stderr).to_string();
                let exit_code = output.status.code().unwrap_or(-1);

                Ok(json!({
                    "stdout": stdout,
                    "stderr": stderr,
                    "exit_code": exit_code,
                    "success": output.status.success()
                }))
            }
        }
    }

    /// 校验命令是否包含危险模式。
    ///
    /// 复用 ShellHandler 的 BLOCKED_PATTERNS 列表，
    /// 同时拦截试图切换到工作目录外的 `cd` 命令。
    fn validate_command(&self, command: &str) -> Result<()> {
        let lower = command.to_lowercase();

        for pattern in BLOCKED_PATTERNS {
            if lower.contains(&pattern.to_lowercase()) {
                anyhow::bail!("Command contains blocked pattern: '{}'", pattern);
            }
        }

        // 拦截试图切换到工作目录外的 cd 命令
        if lower.contains("cd /") || lower.contains("cd ..") {
            anyhow::bail!("Command attempts to change directory outside working directory");
        }

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    /// 创建测试用的 ShellExecutor，工作目录为临时目录。
    fn setup() -> (ShellExecutor, TempDir) {
        let tmp = TempDir::new().expect("failed to create temp dir");
        let validator = PathValidator::new(tmp.path().to_path_buf());
        let executor = ShellExecutor::new(tmp.path().to_path_buf(), Arc::new(validator));
        (executor, tmp)
    }

    #[tokio::test]
    async fn test_shell_executor_simple_command() {
        let (executor, _tmp) = setup();

        let result = executor
            .execute("echo hello")
            .await
            .expect("simple command should succeed");

        assert_eq!(result["stdout"], "hello\n");
        assert_eq!(result["stderr"], "");
        assert_eq!(result["exit_code"], 0);
        assert_eq!(result["success"], true);
    }

    #[tokio::test]
    async fn test_shell_executor_blocked_rm_rf() {
        let (executor, _tmp) = setup();

        let result = executor.execute("rm -rf /").await;
        assert!(
            result.is_err(),
            "rm -rf / should be blocked by validate_command"
        );

        let err_msg = result.unwrap_err().to_string();
        assert!(
            err_msg.contains("blocked pattern"),
            "error should mention blocked pattern, got: {}",
            err_msg
        );
    }

    #[tokio::test]
    async fn test_shell_executor_blocked_other_dangerous_commands() {
        let (executor, _tmp) = setup();

        // 测试其他危险命令
        assert!(executor.execute("mkfs.ext4 /dev/sda1").await.is_err());
        assert!(executor.execute("dd if=/dev/zero of=/dev/sda").await.is_err());
        assert!(executor.execute("shutdown -h now").await.is_err());
        assert!(executor.execute("reboot").await.is_err());
    }

    #[tokio::test]
    async fn test_shell_executor_blocked_cd_outside() {
        let (executor, _tmp) = setup();

        // cd / 应被拦截
        assert!(executor.execute("cd /etc").await.is_err());
        // cd .. 应被拦截
        assert!(executor.execute("cd ..").await.is_err());
    }

    #[tokio::test]
    async fn test_shell_executor_timeout() {
        let tmp = TempDir::new().expect("failed to create temp dir");
        let validator = PathValidator::new(tmp.path().to_path_buf());
        // 使用极短超时
        let executor = ShellExecutor {
            working_directory: tmp.path().to_path_buf(),
            path_validator: Arc::new(validator),
            default_timeout: 1,
        };

        // sleep 5 秒应触发 1 秒超时
        let result = executor.execute("sleep 5").await;
        assert!(result.is_err(), "long command should timeout");

        let err_msg = result.unwrap_err().to_string();
        assert!(
            err_msg.contains("timed out"),
            "error should mention timeout, got: {}",
            err_msg
        );
    }

    #[tokio::test]
    async fn test_shell_executor_command_with_stderr() {
        let (executor, _tmp) = setup();

        let result = executor
            .execute("echo error_output >&2")
            .await
            .expect("command should succeed");

        assert_eq!(result["stdout"], "");
        assert_eq!(result["stderr"], "error_output\n");
        assert_eq!(result["exit_code"], 0);
    }

    #[tokio::test]
    async fn test_shell_executor_nonzero_exit_code() {
        let (executor, _tmp) = setup();

        let result = executor
            .execute("exit 42")
            .await
            .expect("command should execute");

        assert_eq!(result["exit_code"], 42);
        assert_eq!(result["success"], false);
    }

    #[tokio::test]
    async fn test_shell_executor_working_dir_validation() {
        let tmp = TempDir::new().expect("failed to create temp dir");
        // 创建一个 validator，其工作目录与 executor 不同
        let other_dir = TempDir::new().expect("failed to create other temp dir");
        let validator = PathValidator::new(other_dir.path().to_path_buf());

        let executor = ShellExecutor::new(tmp.path().to_path_buf(), Arc::new(validator));

        // 工作目录不在 PathValidator 允许范围内，应被拦截
        let result = executor.execute("echo hello").await;
        assert!(
            result.is_err(),
            "should reject working directory outside PathValidator scope"
        );
    }

    #[tokio::test]
    async fn test_shell_executor_multiline_command() {
        let (executor, _tmp) = setup();

        let result = executor
            .execute("echo line1 && echo line2")
            .await
            .expect("multiline command should succeed");

        assert_eq!(result["stdout"], "line1\nline2\n");
        assert_eq!(result["exit_code"], 0);
    }
}
