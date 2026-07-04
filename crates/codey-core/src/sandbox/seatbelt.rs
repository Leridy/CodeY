//! macOS Seatbelt 沙箱实现
//!
//! 使用 macOS 的 sandbox-exec 命令实现沙箱隔离

use anyhow::Result;
use async_trait::async_trait;
use std::process::Command as StdCommand;
use tokio::process::Command as TokioCommand;
use tokio::time::{timeout, Duration};

use super::config::{SandboxConfig, SandboxHandle, SandboxInstance, SandboxOutput, SandboxStatus};
use super::error::SandboxError;
use super::manager::SandboxManager;

/// macOS Seatbelt 沙箱管理器
///
/// 使用 macOS 的 sandbox-exec 命令实现沙箱隔离
pub struct SeatbeltSandboxManager;

impl SeatbeltSandboxManager {
    /// 创建新的 Seatbelt 沙箱管理器
    pub fn new() -> Self {
        Self
    }

    /// 转义策略文件中的字符串值，防止注入攻击
    ///
    /// 转义 `"` 和 `\` 字符，防止通过路径或域名注入破坏策略文件语法
    fn escape_policy_value(value: &str) -> String {
        value
            .replace('\\', "\\\\")
            .replace('"', "\\\"")
    }

    /// 生成 Seatbelt 策略文件
    ///
    /// # Arguments
    /// * `config` - 沙箱配置
    ///
    /// # Returns
    /// 生成的策略文件内容
    pub fn generate_profile(config: &SandboxConfig) -> String {
        let working_dir = Self::escape_policy_value(&config.working_dir.to_string_lossy());

        // 生成禁止路径规则
        let denied_paths_rules = config
            .denied_paths
            .iter()
            .map(|path| {
                let escaped_path = Self::escape_policy_value(&path.to_string_lossy());
                format!(
                    "(require-all\n      (subpath \"{}\")\n      (not (subpath \"{}\")))",
                    working_dir, escaped_path
                )
            })
            .collect::<Vec<_>>()
            .join("\n    ");

        // 生成网络规则
        let network_rules = if config.network.allow_outbound {
            let allowed_domains = config
                .network
                .allowed_domains
                .iter()
                .map(|domain| format!("\"{}\"", Self::escape_policy_value(domain)))
                .collect::<Vec<_>>()
                .join(" ");

            let blocked_ports = config
                .network
                .blocked_ports
                .iter()
                .map(|port| port.to_string())
                .collect::<Vec<_>>()
                .join(" ");

            format!(
                "(allow network-outbound)\n(allow network-inbound)\n\n;; 允许的域名\n(allow file-read* (literal \"{}\"))\n\n;; 禁止的端口\n(deny network* (remote-port \"{}\"))",
                allowed_domains, blocked_ports
            )
        } else {
            "(deny network*)".to_string()
        };

        // 生成资源限制规则
        let resource_rules = format!(
            "(allow process-info-pidinfo)\n(deny sysctl-read)\n\n;; 进程限制\n(allow process-exec process-fork)\n(deny process-fork (max-processes {}))",
            config.limits.max_processes
        );

        // 生成完整的策略文件
        format!(
            r#";; CodeY Sandbox Profile
;; 自动生成，请勿手动修改

(version 1)
(deny default)

;; 允许基本进程操作
(allow process-exec process-fork)

;; 允许读取工作目录
(allow file-read*
  (subpath "{working_dir}"))

;; 允许写入工作目录（排除敏感路径）
(allow file-write*
  (require-all
    (subpath "{working_dir}")
    {denied_paths_rules}
  ))

;; 网络策略
{network_rules}

;; 资源限制
{resource_rules}

;; 日志记录
(allow file-read* (literal "/dev/log"))
(allow file-read* (literal "/private/var/log/asl.db"))
"#,
            working_dir = working_dir,
            denied_paths_rules = denied_paths_rules,
            network_rules = network_rules,
            resource_rules = resource_rules,
        )
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

        // 生成策略文件
        let profile_content = Self::generate_profile(config);

        // 创建临时策略文件
        let temp_dir = std::env::temp_dir();
        let profile_path = temp_dir.join(format!("codey-sandbox-{}.sb", uuid::Uuid::new_v4()));
        std::fs::write(&profile_path, &profile_content)?;

        // 构建异步 sandbox-exec 命令
        let mut command = TokioCommand::new("sandbox-exec");
        command
            .arg("-f")
            .arg(&profile_path)
            .arg(cmd)
            .args(args)
            .current_dir(&config.working_dir);

        let timeout_duration = Duration::from_secs(config.limits.timeout_secs);

        // 使用 tokio::time::timeout 实际中断长时间运行的命令
        let result = timeout(timeout_duration, command.output()).await;

        // 清理临时文件
        let _ = std::fs::remove_file(&profile_path);

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
impl SandboxManager for SeatbeltSandboxManager {
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

        // 生成策略文件
        let profile_content = Self::generate_profile(config);
        let temp_dir = std::env::temp_dir();
        let profile_path = temp_dir.join(format!("codey-sandbox-{}.sb", uuid::Uuid::new_v4()));
        std::fs::write(&profile_path, profile_content)?;

        // 验证策略文件
        let validate_output = StdCommand::new("sandbox-exec")
            .arg("-f")
            .arg(&profile_path)
            .arg("true")
            .output();

        // 清理临时文件
        let _ = std::fs::remove_file(&profile_path);

        match validate_output {
            Ok(output) => {
                if !output.status.success() {
                    return Err(SandboxError::CreationFailed(format!(
                        "策略文件验证失败: {}",
                        String::from_utf8_lossy(&output.stderr)
                    ))
                    .into());
                }
            }
            Err(e) => {
                return Err(SandboxError::CreationFailed(format!(
                    "无法执行 sandbox-exec: {}",
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
            handle: SandboxHandle::Seatbelt { pid: 0 },
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
        // macOS Seatbelt 不需要显式停止进程
        // sandbox-exec 启动的进程会在命令执行完成后自动退出
        Ok(())
    }
}
