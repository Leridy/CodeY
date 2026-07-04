//! 沙箱系统模块
//!
//! 提供 OS 级沙箱隔离功能，支持 macOS Seatbelt 和 Linux bubblewrap

pub mod config;
pub mod manager;
pub mod seatbelt;
pub mod bubblewrap;
pub mod error;
pub mod tests;

pub use config::*;
pub use manager::*;
pub use seatbelt::*;
pub use bubblewrap::*;
pub use error::*;

use std::sync::Arc;

/// 创建沙箱管理器
///
/// 根据当前平台创建对应的沙箱管理器实现
///
/// # Returns
/// 沙箱管理器实例
///
/// # Platform Support
/// - macOS: 使用 SeatbeltSandboxManager
/// - Linux: 使用 BubblewrapSandboxManager
pub fn create_sandbox_manager() -> Arc<dyn SandboxManager> {
    #[cfg(target_os = "macos")]
    {
        Arc::new(SeatbeltSandboxManager::new())
    }

    #[cfg(target_os = "linux")]
    {
        Arc::new(BubblewrapSandboxManager::new())
    }

    #[cfg(not(any(target_os = "macos", target_os = "linux")))]
    {
        compile_error!("不支持的操作系统平台")
    }
}

/// 创建沙箱管理器（带自定义配置）
///
/// # Arguments
/// * `platform` - 平台类型 ("macos" 或 "linux")
///
/// # Returns
/// 沙箱管理器实例，不支持的平台返回错误
pub fn create_sandbox_manager_for_platform(
    platform: &str,
) -> Result<Arc<dyn SandboxManager>, SandboxError> {
    match platform {
        "macos" => Ok(Arc::new(SeatbeltSandboxManager::new())),
        "linux" => Ok(Arc::new(BubblewrapSandboxManager::new())),
        _ => Err(SandboxError::UnsupportedPlatform(platform.to_string())),
    }
}

#[cfg(test)]
mod platform_tests {
    use super::*;

    #[test]
    fn test_create_sandbox_manager() {
        let manager = create_sandbox_manager();
        // 确保管理器创建成功
        assert!(std::sync::Arc::strong_count(&manager) > 0);
    }

    #[test]
    fn test_create_sandbox_manager_for_platform() {
        #[cfg(target_os = "macos")]
        {
            let manager = create_sandbox_manager_for_platform("macos").unwrap();
            assert!(std::sync::Arc::strong_count(&manager) > 0);
        }

        #[cfg(target_os = "linux")]
        {
            let manager = create_sandbox_manager_for_platform("linux").unwrap();
            assert!(std::sync::Arc::strong_count(&manager) > 0);
        }
    }

    #[test]
    fn test_create_sandbox_manager_unsupported_platform() {
        let result = create_sandbox_manager_for_platform("windows");
        assert!(result.is_err());
        // 使用 if let 检查错误类型，避免要求 dyn SandboxManager 实现 Debug
        if let Err(ref e) = result {
            assert!(
                matches!(e, SandboxError::UnsupportedPlatform(p) if p == "windows"),
                "期望 UnsupportedPlatform 错误，实际: {:?}",
                e
            );
        }
    }
}
