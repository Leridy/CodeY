//! 沙箱错误类型定义
//!
//! 定义沙箱系统的所有错误类型

use thiserror::Error;

/// 沙箱错误
#[derive(Debug, Error)]
pub enum SandboxError {
    /// 沙箱创建失败
    #[error("沙箱创建失败: {0}")]
    CreationFailed(String),

    /// 沙箱执行失败
    #[error("沙箱执行失败: {0}")]
    ExecutionFailed(String),

    /// 沙箱超时
    #[error("沙箱超时 ({0}秒)")]
    Timeout(u64),

    /// 资源超限
    #[error("资源超限: {0}")]
    ResourceLimitExceeded(String),

    /// 权限被拒绝
    #[error("权限被拒绝: {0}")]
    PermissionDenied(String),

    /// 平台错误
    #[error("平台错误: {0}")]
    PlatformError(String),

    /// 不支持的平台
    #[error("不支持的平台: {0}")]
    UnsupportedPlatform(String),
}
