//! 沙箱管理器 trait 定义
//!
//! 定义沙箱管理器的核心 trait，提供沙箱的创建、执行、销毁和状态查询功能

use anyhow::Result;
use async_trait::async_trait;

use super::config::{SandboxConfig, SandboxInstance, SandboxOutput, SandboxStatus};

/// 沙箱管理器 trait
///
/// 定义沙箱管理器的核心接口，所有平台特定的沙箱实现都需要实现此 trait
#[async_trait]
pub trait SandboxManager: Send + Sync {
    /// 创建沙箱
    ///
    /// # Arguments
    /// * `config` - 沙箱配置
    ///
    /// # Returns
    /// 创建的沙箱实例
    ///
    /// # Errors
    /// 如果沙箱创建失败，返回 `SandboxError::CreationFailed`
    async fn create(&self, config: &SandboxConfig) -> Result<SandboxInstance>;

    /// 在沙箱中执行命令
    ///
    /// # Arguments
    /// * `sandbox` - 沙箱实例
    /// * `cmd` - 要执行的命令
    /// * `args` - 命令参数
    ///
    /// # Returns
    /// 命令执行的输出结果
    ///
    /// # Errors
    /// 如果命令执行失败，返回 `SandboxError::ExecutionFailed`
    /// 如果执行超时，返回 `SandboxError::Timeout`
    async fn execute(
        &self,
        sandbox: &SandboxInstance,
        cmd: &str,
        args: &[String],
    ) -> Result<SandboxOutput>;

    /// 销毁沙箱
    ///
    /// # Arguments
    /// * `sandbox` - 要销毁的沙箱实例
    ///
    /// # Returns
    /// 销毁成功返回 Ok(())
    ///
    /// # Errors
    /// 如果销毁失败，返回 `SandboxError::PlatformError`
    async fn destroy(&self, sandbox: &SandboxInstance) -> Result<()> {
        // 默认实现：检查沙箱状态
        let status = self.status(sandbox).await?;
        match status {
            SandboxStatus::Running => {
                // 尝试停止沙箱
                self.stop_sandbox(sandbox).await?;
                Ok(())
            }
            SandboxStatus::Stopped => Ok(()),
            SandboxStatus::Error(msg) => {
                Err(anyhow::anyhow!("无法销毁错误状态的沙箱: {}", msg))
            }
        }
    }

    /// 检查沙箱状态
    ///
    /// # Arguments
    /// * `sandbox` - 沙箱实例
    ///
    /// # Returns
    /// 沙箱的当前状态
    ///
    /// # Errors
    /// 如果状态查询失败，返回 `SandboxError::PlatformError`
    async fn status(&self, sandbox: &SandboxInstance) -> Result<SandboxStatus>;

    /// 停止沙箱（内部方法）
    ///
    /// # Arguments
    /// * `sandbox` - 要停止的沙箱实例
    ///
    /// # Returns
    /// 停止成功返回 Ok(())
    async fn stop_sandbox(&self, sandbox: &SandboxInstance) -> Result<()>;
}
