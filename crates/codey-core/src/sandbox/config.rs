//! 沙箱配置类型定义
//!
//! 定义沙箱系统的所有配置类型，包括 SandboxConfig、NetworkPolicy、ResourceLimits 等

use serde::{Deserialize, Serialize};
use std::path::PathBuf;

/// 沙箱配置
///
/// 定义沙箱的完整配置，包括工作目录、路径访问控制、网络策略和资源限制
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SandboxConfig {
    /// 工作目录
    pub working_dir: PathBuf,

    /// 允许访问的路径列表
    pub allowed_paths: Vec<PathBuf>,

    /// 禁止访问的路径列表
    pub denied_paths: Vec<PathBuf>,

    /// 网络策略
    pub network: NetworkPolicy,

    /// 资源限制
    pub limits: ResourceLimits,
}

impl SandboxConfig {
    /// 检查路径是否允许访问
    ///
    /// # Arguments
    /// * `path` - 要检查的路径
    ///
    /// # Returns
    /// 如果路径允许访问返回 true，否则返回 false
    pub fn is_path_allowed(&self, path: &PathBuf) -> bool {
        // 检查是否是路径遍历攻击
        if self.is_path_traversal(path) {
            return false;
        }

        // 检查是否在禁止列表中
        if self.is_path_denied(path) {
            return false;
        }

        // 检查是否在允许列表中
        if self.is_path_in_allowed_list(path) {
            return true;
        }

        // 默认拒绝
        false
    }

    /// 检查是否是路径遍历攻击
    ///
    /// 使用 `canonicalize()` 解析符号链接后检查真实路径是否超出沙箱边界，
    /// 防止通过符号链接绕过字符串级 `".."` 检测
    fn is_path_traversal(&self, path: &PathBuf) -> bool {
        // 字符串级快速检查：直接包含 ".." 片段
        let path_str = path.to_string_lossy();
        if path_str.contains("..") {
            return true;
        }

        // 解析符号链接得到真实路径
        let resolved = match std::fs::canonicalize(path) {
            Ok(p) => p,
            Err(_) => {
                // 路径不存在时，回退到字符串检查（已在上方通过）
                return false;
            }
        };

        // 检查解析后的真实路径是否仍在沙箱允许的边界内
        let resolved_str = resolved.to_string_lossy();
        let working_str = self.working_dir.to_string_lossy();
        let in_working_dir = resolved_str.starts_with(working_str.as_ref());

        let in_allowed = self.allowed_paths.iter().any(|allowed| {
            if let Ok(allowed_canon) = std::fs::canonicalize(allowed) {
                let allowed_str = allowed_canon.to_string_lossy();
                resolved_str.starts_with(allowed_str.as_ref())
            } else {
                let allowed_str = allowed.to_string_lossy();
                resolved_str.starts_with(allowed_str.as_ref())
            }
        });

        // 如果既不在工作目录内，也不在任何允许路径内，则视为路径遍历
        !(in_working_dir || in_allowed)
    }

    /// 检查路径是否在禁止列表中
    fn is_path_denied(&self, path: &PathBuf) -> bool {
        let path_str = path.to_string_lossy();
        self.denied_paths.iter().any(|denied| {
            let denied_str = denied.to_string_lossy();
            path_str.starts_with(denied_str.as_ref()) || path_str == denied_str.as_ref()
        })
    }

    /// 检查路径是否在允许列表中
    fn is_path_in_allowed_list(&self, path: &PathBuf) -> bool {
        let path_str = path.to_string_lossy();
        self.allowed_paths.iter().any(|allowed| {
            let allowed_str = allowed.to_string_lossy();
            path_str.starts_with(allowed_str.as_ref()) || path_str == allowed_str.as_ref()
        })
    }
}

/// 网络策略
///
/// 定义沙箱的网络访问控制策略
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkPolicy {
    /// 允许出站连接
    pub allow_outbound: bool,

    /// 允许的域名列表
    pub allowed_domains: Vec<String>,

    /// 禁止的端口列表
    pub blocked_ports: Vec<u16>,
}

impl NetworkPolicy {
    /// 检查域名是否允许
    ///
    /// # Arguments
    /// * `domain` - 要检查的域名
    ///
    /// # Returns
    /// 如果域名允许返回 true，否则返回 false
    pub fn is_domain_allowed(&self, domain: &str) -> bool {
        if !self.allow_outbound {
            return false;
        }

        if self.allowed_domains.is_empty() {
            return true;
        }

        self.allowed_domains.iter().any(|allowed| allowed == domain)
    }

    /// 检查端口是否被阻止
    ///
    /// # Arguments
    /// * `port` - 要检查的端口
    ///
    /// # Returns
    /// 如果端口被阻止返回 true，否则返回 false
    pub fn is_port_blocked(&self, port: u16) -> bool {
        self.blocked_ports.contains(&port)
    }
}

/// 资源限制
///
/// 定义沙箱的资源使用限制
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ResourceLimits {
    /// 最大内存 (MB)
    pub max_memory_mb: u32,

    /// 最大 CPU 核数
    pub max_cpu_cores: f32,

    /// 最大进程数
    pub max_processes: u32,

    /// 超时时间 (秒)
    pub timeout_secs: u64,
}

impl ResourceLimits {
    /// 验证资源限制是否有效
    ///
    /// # Returns
    /// 如果资源限制有效返回 true，否则返回 false
    pub fn is_valid(&self) -> bool {
        self.max_memory_mb > 0
            && self.max_cpu_cores > 0.0
            && self.max_processes > 0
            && self.timeout_secs > 0
    }
}

/// 沙箱状态
///
/// 表示沙箱的当前状态
#[derive(Debug, Clone)]
pub enum SandboxStatus {
    /// 运行中
    Running,

    /// 已停止
    Stopped,

    /// 错误
    Error(String),
}

/// 沙箱实例
///
/// 表示一个运行中的沙箱实例
#[derive(Debug, Clone)]
pub struct SandboxInstance {
    /// 沙箱 ID
    pub id: String,

    /// 配置
    pub config: SandboxConfig,

    /// 创建时间
    pub created_at: std::time::Instant,

    /// 平台特定句柄
    pub handle: SandboxHandle,

    /// 沙箱状态
    pub status: SandboxStatus,
}

impl SandboxInstance {
    /// 创建新的沙箱实例
    ///
    /// # Arguments
    /// * `config` - 沙箱配置
    ///
    /// # Returns
    /// 新的沙箱实例
    pub fn new(config: SandboxConfig) -> Self {
        // 使用条件编译设置正确的默认句柄
        #[cfg(target_os = "macos")]
        let default_handle = SandboxHandle::Seatbelt { pid: 0 };
        #[cfg(target_os = "linux")]
        let default_handle = SandboxHandle::Bubblewrap { pid: 0 };
        #[cfg(not(any(target_os = "macos", target_os = "linux")))]
        let default_handle = SandboxHandle::Seatbelt { pid: 0 };

        Self {
            id: uuid::Uuid::new_v4().to_string(),
            config,
            created_at: std::time::Instant::now(),
            handle: default_handle,
            status: SandboxStatus::Running,
        }
    }

    /// 获取沙箱状态
    pub fn status(&self) -> &SandboxStatus {
        &self.status
    }

    /// 设置沙箱状态
    pub fn set_status(&mut self, status: SandboxStatus) {
        self.status = status;
    }
}

/// 平台特定句柄
///
/// 表示不同平台的沙箱实现句柄
#[derive(Debug, Clone)]
pub enum SandboxHandle {
    /// macOS Seatbelt 进程
    Seatbelt { pid: u32 },

    /// Linux bubblewrap 进程
    Bubblewrap { pid: u32 },
}

/// 沙箱执行输出
///
/// 表示沙箱中命令执行的输出结果
#[derive(Debug)]
pub struct SandboxOutput {
    /// 退出码
    pub exit_code: i32,

    /// 标准输出
    pub stdout: String,

    /// 标准错误
    pub stderr: String,

    /// 执行时间
    pub duration: std::time::Duration,
}
