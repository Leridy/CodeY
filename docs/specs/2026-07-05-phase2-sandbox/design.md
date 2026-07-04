# Phase 2.3 沙箱系统设计文档

> 日期：2026-07-05
> 版本：v1.0.0
> 状态：Phase 2.3 - 沙箱系统实现

## 1. 概述

Phase 2.3 实现 CodeY 的 OS 级沙箱系统，为 Agent 执行环境提供安全隔离。

### 1.1 设计目标

| 目标 | 说明 |
|------|------|
| 最小权限 | Agent 默认在最严格沙箱中运行 |
| 平台感知 | macOS/Linux 使用不同 OS 机制 |
| 可配置 | 通过配置文件定义沙箱策略 |
| 可观测 | 沙箱事件可审计 |
| 低开销 | Desktop 沙箱性能开销 < 5% |

### 1.2 头脑风暴结果

- **操作范围**: 全部（文件 + Shell + 网络）
- **平台**: macOS + Linux
- **安全级别**: L3 ReadWriteExecute
- **性能**: < 500ms 创建时间 + 会话级复用

---

## 2. 核心类型定义

### 2.1 SandboxConfig

```rust
/// 沙箱配置
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
```

### 2.2 NetworkPolicy

```rust
/// 网络策略
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkPolicy {
    /// 允许出站连接
    pub allow_outbound: bool,

    /// 允许的域名列表
    pub allowed_domains: Vec<String>,

    /// 禁止的端口列表
    pub blocked_ports: Vec<u16>,
}
```

### 2.3 ResourceLimits

```rust
/// 资源限制
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
```

### 2.4 SandboxInstance

```rust
/// 沙箱实例
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
}

/// 平台特定句柄
#[derive(Debug, Clone)]
pub enum SandboxHandle {
    /// macOS Seatbelt 进程
    Seatbelt { pid: u32 },

    /// Linux bubblewrap 进程
    Bubblewrap { pid: u32 },
}
```

### 2.5 SandboxOutput

```rust
/// 沙箱执行输出
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
```

---

## 3. SandboxManager Trait

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

/// 沙箱状态
#[derive(Debug, Clone)]
pub enum SandboxStatus {
    /// 运行中
    Running,

    /// 已停止
    Stopped,

    /// 错误
    Error(String),
}
```

---

## 4. 平台实现

### 4.1 macOS Seatbelt

#### 实现方式

1. 生成 Seatbelt 策略文件 (.sb)
2. 使用 `sandbox-exec` 命令启动沙箱进程
3. 监控进程状态和资源使用

#### 策略文件模板

```scheme
;; CodeY Sandbox Profile
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
(allow process-info-pidinfo)
(deny sysctl-read)
```

### 4.2 Linux bubblewrap

#### 实现方式

1. 使用 bubblewrap 创建隔离环境
2. 配置 mount namespace 隔离文件系统
3. 使用 seccomp 过滤系统调用

#### bubblewrap 命令构建

```bash
bwrap \
  --ro-bind /usr /usr \
  --ro-bind /lib /lib \
  --ro-bind /bin /bin \
  --dev /dev \
  --proc /proc \
  --tmpfs /tmp \
  --bind {working_dir} {working_dir} \
  --unshare-all \
  --die-with-parent \
  {cmd} {args}
```

---

## 5. 配置文件

### 5.1 配置文件位置

```
.codey/
  sandbox/
    default.toml      # 默认沙箱配置
    strict.toml       # 严格模式配置
```

### 5.2 配置文件格式

```toml
# .codey/sandbox/default.toml

[general]
working_dir = "."

[paths]
allowed = [
    "src/**",
    "tests/**",
    "docs/**",
    "Cargo.toml",
    "package.json",
]
denied = [
    ".env*",
    "**/*secret*",
    "**/*key*",
    "**/*.lock",
]

[network]
allow_outbound = true
allowed_domains = [
    "api.openai.com",
    "api.anthropic.com",
    "crates.io",
]
blocked_ports = [22, 23, 3389]

[limits]
max_memory_mb = 512
max_cpu_cores = 1.0
max_processes = 100
timeout_secs = 300
```

---

## 6. 与权限系统集成

### 6.1 集成流程

```
Agent 发起操作
     │
     ▼
┌─────────────────┐
│ 权限检查通过     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 创建/复用沙箱    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 在沙箱中执行     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 返回执行结果     │
└─────────────────┘
```

### 6.2 权限级别与沙箱配置映射

| 权限级别 | 沙箱配置 | 说明 |
|---------|---------|------|
| L0 ReadOnly | strict.toml | 只读访问，禁止执行 |
| L1 ReadExecute | strict.toml + exec | 只读 + 受限执行 |
| L2 ReadWrite | default.toml - exec | 读写，禁止执行 |
| L3 ReadWriteExecute | default.toml | 读写 + 执行 |
| L4 ProjectAccess | development.toml | 项目级访问 |
| L5 SystemAdmin | 无沙箱 | 系统管理 |
| L6 FullAccess | 无沙箱 | 完全访问 |

---

## 7. 错误处理

```rust
/// 沙箱错误
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

## 8. 实现计划

### 8.1 Phase 1: 核心类型和接口

- 定义 SandboxConfig、NetworkPolicy、ResourceLimits
- 定义 SandboxManager trait
- 定义错误类型

### 8.2 Phase 2: 平台实现

- 实现 macOS Seatbelt 沙箱
- 实现 Linux bubblewrap 沙箱

### 8.3 Phase 3: 配置和集成

- 实现配置文件解析
- 与权限系统集成
- 实现沙箱生命周期管理

### 8.4 Phase 4: 测试和优化

- 单元测试
- 集成测试
- 性能优化

---

*文档版本: v1.0.0*
*最后更新: 2026-07-05*
