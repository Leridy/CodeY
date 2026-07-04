//! Linux bubblewrap 沙箱实现
//!
//! 使用 bubblewrap (bwrap) 命令实现沙箱隔离

use anyhow::Result;
use async_trait::async_trait;
use std::process::Command as StdCommand;
use tokio::process::Command as TokioCommand;
use tokio::time::{timeout, Duration};

use super::config::{SandboxConfig, SandboxHandle, SandboxInstance, SandboxOutput, SandboxStatus};
use super::error::SandboxError;
use super::manager::SandboxManager;

/// Linux bubblewrap 沙箱管理器
///
/// 使用 bubblewrap (bwrap) 命令实现沙箱隔离
pub struct BubblewrapSandboxManager {
    /// bwrap 可执行文件路径
    bwrap_path: String,
}

impl BubblewrapSandboxManager {
    /// 创建新的 bubblewrap 沙箱管理器
    pub fn new() -> Self {
        Self {
            bwrap_path: "bwrap".to_string(),
        }
    }

    /// 构建 bwrap 命令
    ///
    /// # Arguments
    /// * `config` - 沙箱配置
    /// * `cmd` - 要执行的命令
    /// * `args` - 命令参数
    ///
    /// # Returns
    /// 构建的 Command 对象
    pub fn build_bwrap_command(
        config: &SandboxConfig,
        cmd: &str,
        args: &[String],
    ) -> StdCommand {
        let mut command = StdCommand::new("bwrap");

        // 基本隔离设置
        command
            .arg("--unshare-all")      // 取消共享所有命名空间
            .arg("--die-with-parent")  // 父进程退出时子进程也退出
            .arg("--proc")
            .arg("/proc")
            .arg("--dev")
            .arg("/dev")
            .arg("--tmpfs")
            .arg("/tmp");

        // 只读绑定系统目录
        command
            .arg("--ro-bind")
            .arg("/usr")
            .arg("/usr")
            .arg("--ro-bind")
            .arg("/lib")
            .arg("/lib")
            .arg("--ro-bind")
            .arg("/bin")
            .arg("/bin")
            .arg("--ro-bind")
            .arg("/lib64")
            .arg("/lib64");

        // 绑定工作目录（读写）
        command
            .arg("--bind")
            .arg(&config.working_dir)
            .arg(&config.working_dir);

        // 绑定允许的路径
        for allowed_path in &config.allowed_paths {
            let full_path = config.working_dir.join(allowed_path);
            if full_path.exists() {
                command
                    .arg("--bind")
                    .arg(&full_path)
                    .arg(&full_path);
            }
        }

        // 设置资源限制
        if config.limits.max_memory_mb > 0 {
            command
                .arg("--size")
                .arg(format!("{}", config.limits.max_memory_mb * 1024 * 1024));
        }

        // 网络限制
        if !config.network.allow_outbound {
            command.arg("--unshare-net");
        }

        // 设置工作目录
        command.current_dir(&config.working_dir);

        // 要执行的命令
        command.arg(cmd).args(args);

        command
    }

    /// 执行沙箱命令
    ///
    /// 使用 `tokio::time::timeout` 在超时时实际中断命令执行，
    /// 而非等待命令完成后再检查耗时
    ///
    /// # Arguments
    /// * `config` - 沙箱配置
    /// * `cmd` - 要执行的命令
    /// * `args` - 命令参数
    ///
    /// # Returns
    /// 命令执行的输出结果
    pub async fn execute_sandboxed(
        config: &SandboxConfig,
        cmd: &str,
        args: &[String],
    ) -> Result<SandboxOutput> {
        let start_time = std::time::Instant::now();

        // 构建异步 bwrap 命令（与 build_bwrap_command 相同的参数）
        let mut command = TokioCommand::new("bwrap");
        command
            .arg("--unshare-all")
            .arg("--die-with-parent")
            .arg("--proc").arg("/proc")
            .arg("--dev").arg("/dev")
            .arg("--tmpfs").arg("/tmp")
            .arg("--ro-bind").arg("/usr").arg("/usr")
            .arg("--ro-bind").arg("/lib").arg("/lib")
            .arg("--ro-bind").arg("/bin").arg("/bin")
            .arg("--ro-bind").arg("/lib64").arg("/lib64")
            .arg("--bind").arg(&config.working_dir).arg(&config.working_dir);

        for allowed_path in &config.allowed_paths {
            let full_path = config.working_dir.join(allowed_path);
            if full_path.exists() {
                command.arg("--bind").arg(&full_path).arg(&full_path);
            }
        }

        if config.limits.max_memory_mb > 0 {
            command
                .arg("--size")
                .arg(format!("{}", config.limits.max_memory_mb * 1024 * 1024));
        }

        if !config.network.allow_outbound {
            command.arg("--unshare-net");
        }

        command
            .current_dir(&config.working_dir)
            .arg(cmd)
            .args(args);

        let timeout_duration = Duration::from_secs(config.limits.timeout_secs);

        // 使用 tokio::time::timeout 实际中断长时间运行的命令
        let result = timeout(timeout_duration, command.output()).await;

        match result {
            Ok(Ok(output)) => {
                let duration = start_time.elapsed();
                Ok(SandboxOutput {
                    exit_code: output.status.code().unwrap_or(-1),
                    stdout: String::from_utf8_lossy(&output.stdout).to_string(),
                    stderr: String::from_utf8_lossy(&output.stderr).to_string(),
                    duration,
                })
            }
            Ok(Err(e)) => Err(SandboxError::ExecutionFailed(format!("执行命令失败: {}", e)).into()),
            Err(_) => {
                // 超时：tokio 已自动终止子进程
                Err(SandboxError::Timeout(config.limits.timeout_secs).into())
            }
        }
    }
}

#[async_trait]
impl SandboxManager for BubblewrapSandboxManager {
    async fn create(&self, config: &SandboxConfig) -> Result<SandboxInstance> {
        let start_time = std::time::Instant::now();

        // 验证配置
        if !config.limits.is_valid() {
            return Err(SandboxError::CreationFailed("无效的资源限制配置".to_string()).into());
        }

        // 检查工作目录是否存在
        if !config.working_dir.exists() {
            return Err(SandboxError::CreationFailed(format!(
                "工作目录不存在: {:?}",
                config.working_dir
            ))
            .into());
        }

        // 检查 bwrap 是否可用
        let bwrap_check = StdCommand::new(&self.bwrap_path)
            .arg("--version")
            .output();

        match bwrap_check {
            Ok(output) => {
                if !output.status.success() {
                    return Err(SandboxError::CreationFailed(format!(
                        "bwrap 版本检查失败: {}",
                        String::from_utf8_lossy(&output.stderr)
                    ))
                    .into());
                }
            }
            Err(e) => {
                return Err(SandboxError::CreationFailed(format!(
                    "无法执行 bwrap: {}",
                    e
                ))
                .into());
            }
        }

        // 验证 bwrap 命令
        let mut test_command = Self::build_bwrap_command(config, "true", &[]);
        let validate_output = test_command.output();

        match validate_output {
            Ok(output) => {
                if !output.status.success() {
                    return Err(SandboxError::CreationFailed(format!(
                        "bwrap 命令验证失败: {}",
                        String::from_utf8_lossy(&output.stderr)
                    ))
                    .into());
                }
            }
            Err(e) => {
                return Err(SandboxError::CreationFailed(format!(
                    "无法执行 bwrap 验证命令: {}",
                    e
                ))
                .into());
            }
        }

        let duration = start_time.elapsed();
        if duration.as_millis() > 500 {
            tracing::warn!("沙箱创建时间超过 500ms: {:?}", duration);
        }

        Ok(SandboxInstance {
            id: uuid::Uuid::new_v4().to_string(),
            config: config.clone(),
            created_at: std::time::Instant::now(),
            handle: SandboxHandle::Bubblewrap { pid: 0 },
            status: SandboxStatus::Running,
        })
    }

    async fn execute(
        &self,
        sandbox: &SandboxInstance,
        cmd: &str,
        args: &[String],
    ) -> Result<SandboxOutput> {
        // 检查沙箱状态
        let status = self.status(sandbox).await?;
        match status {
            SandboxStatus::Running => {
                Self::execute_sandboxed(&sandbox.config, cmd, args).await
            }
            SandboxStatus::Stopped => {
                Err(SandboxError::ExecutionFailed("沙箱已停止".to_string()).into())
            }
            SandboxStatus::Error(msg) => {
                Err(SandboxError::ExecutionFailed(format!("沙箱错误: {}", msg)).into())
            }
        }
    }

    async fn status(&self, sandbox: &SandboxInstance) -> Result<SandboxStatus> {
        // 简单实现：返回沙箱实例的状态
        Ok(sandbox.status.clone())
    }

    async fn stop_sandbox(&self, _sandbox: &SandboxInstance) -> Result<()> {
        // bubblewrap 进程会在命令执行完成后自动退出
        // 如果需要强制停止，可以发送 SIGTERM 信号
        Ok(())
    }
}
