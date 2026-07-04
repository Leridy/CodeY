# Phase 2.3 沙箱系统 API 文档

> 日期：2026-07-05
> 版本：v1.0.0

## 1. 核心 API

### 1.1 SandboxManager Trait

```rust
/// 沙箱管理器 trait
#[async_trait]
pub trait SandboxManager: Send + Sync {
    /// 创建沙箱
    async fn create(&self, config: &SandboxConfig) -> Result<SandboxInstance>;

    /// 在沙箱中执行命令
    async fn execute(
        &self,
        sandbox: &SandboxInstance,
        cmd: &str,
        args: &[String],
    ) -> Result<SandboxOutput>;

    /// 销毁沙箱
    async fn destroy(&self, sandbox: &SandboxInstance) -> Result<()>;

    /// 检查沙箱状态
    async fn status(&self, sandbox: &SandboxInstance) -> Result<SandboxStatus>;
}
```

### 1.2 使用示例

```rust
use codey_core::sandbox::{SandboxManager, SandboxConfig, NetworkPolicy, ResourceLimits};

// 创建沙箱管理器
let manager = create_sandbox_manager()?;

// 配置沙箱
let config = SandboxConfig {
    working_dir: PathBuf::from("/path/to/project"),
    allowed_paths: vec![PathBuf::from("src"), PathBuf::from("tests")],
    denied_paths: vec![PathBuf::from(".env"), PathBuf::from("**/*secret*")],
    network: NetworkPolicy {
        allow_outbound: true,
        allowed_domains: vec!["api.openai.com".to_string()],
        blocked_ports: vec![22, 23],
    },
    limits: ResourceLimits {
        max_memory_mb: 512,
        max_cpu_cores: 1.0,
        max_processes: 100,
        timeout_secs: 300,
    },
};

// 创建沙箱
let sandbox = manager.create(&config).await?;

// 在沙箱中执行命令
let output = manager.execute(&sandbox, "cargo", &["test".to_string()]).await?;

// 销毁沙箱
manager.destroy(&sandbox).await?;
```

---

## 2. 类型定义

### 2.1 SandboxConfig

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SandboxConfig {
    pub working_dir: PathBuf,
    pub allowed_paths: Vec<PathBuf>,
    pub denied_paths: Vec<PathBuf>,
    pub network: NetworkPolicy,
    pub limits: ResourceLimits,
}
```

### 2.2 NetworkPolicy

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkPolicy {
    pub allow_outbound: bool,
    pub allowed_domains: Vec<String>,
    pub blocked_ports: Vec<u16>,
}
```

### 2.3 ResourceLimits

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ResourceLimits {
    pub max_memory_mb: u32,
    pub max_cpu_cores: f32,
    pub max_processes: u32,
    pub timeout_secs: u64,
}
```

### 2.4 SandboxInstance

```rust
#[derive(Debug, Clone)]
pub struct SandboxInstance {
    pub id: String,
    pub config: SandboxConfig,
    pub created_at: std::time::Instant,
    pub handle: SandboxHandle,
}

#[derive(Debug, Clone)]
pub enum SandboxHandle {
    Seatbelt { pid: u32 },
    Bubblewrap { pid: u32 },
}
```

### 2.5 SandboxOutput

```rust
#[derive(Debug)]
pub struct SandboxOutput {
    pub exit_code: i32,
    pub stdout: String,
    pub stderr: String,
    pub duration: std::time::Duration,
}
```

### 2.6 SandboxStatus

```rust
#[derive(Debug, Clone)]
pub enum SandboxStatus {
    Running,
    Stopped,
    Error(String),
}
```

### 2.7 SandboxError

```rust
#[derive(Debug, thiserror::Error)]
pub enum SandboxError {
    #[error("沙箱创建失败: {0}")]
    CreationFailed(String),
    #[error("沙箱执行失败: {0}")]
    ExecutionFailed(String),
    #[error("沙箱超时 ({0}秒)")]
    Timeout(u64),
    #[error("资源超限: {0}")]
    ResourceLimitExceeded(String),
    #[error("权限被拒绝: {0}")]
    PermissionDenied(String),
    #[error("平台错误: {0}")]
    PlatformError(String),
}
```

---

## 3. 配置文件 API

### 3.1 配置文件格式

```toml
# .codey/sandbox/default.toml

[general]
working_dir = "."

[paths]
allowed = ["src/**", "tests/**", "docs/**", "Cargo.toml"]
denied = [".env*", "**/*secret*", "**/*key*", "**/*.lock"]

[network]
allow_outbound = true
allowed_domains = ["api.openai.com", "api.anthropic.com", "crates.io"]
blocked_ports = [22, 23, 3389]

[limits]
max_memory_mb = 512
max_cpu_cores = 1.0
max_processes = 100
timeout_secs = 300
```

---

*API 文档版本: v1.0.0*
*最后更新: 2026-07-05*
