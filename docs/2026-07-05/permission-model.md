# 权限模型设计文档

> 日期：2026-07-05
> 阶段：架构设计
> 版本：v1.0.0

## 1. 概述

CodeY 采用 **7 级权限模型**，从只读到完全访问逐级递增。权限系统由三个核心组件构成：

```
┌─────────────────────────────────────────────────────────┐
│                    Permission System                     │
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  7-Level     │  │  Rule Engine │  │  Sandbox     │  │
│  │  Permission  │  │  DSL (.rules)│  │  (OS-level)  │  │
│  │  Model       │  │              │  │              │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
│         │                 │                 │           │
│         └────────┬────────┘                 │           │
│                  │                          │           │
│         ┌────────▼────────┐                 │           │
│         │ Permission      │◄────────────────┘           │
│         │ Check Flow      │                             │
│         └─────────────────┘                             │
└─────────────────────────────────────────────────────────┘
```

设计原则：

- **最小权限**：Agent 默认获得最低权限，按需逐级提升
- **显式授权**：每级权限提升都需要用户明确确认
- **可审计**：所有权限变更记录可追溯
- **平台感知**：Desktop 和 Web 环境使用不同的沙箱策略

## 2. 七级权限模型

### 2.1 权限级别定义

```
Level 0 ─ ReadOnly         只读访问
Level 1 ─ ReadExecute      只读 + 执行命令
Level 2 ─ ReadWrite        读写文件
Level 3 ─ ReadWriteExecute 读写 + 执行命令
Level 4 ─ ProjectAccess    项目级完整访问
Level 5 ─ SystemAdmin      系统管理权限
Level 6 ─ FullAccess       完全访问（包含网络、硬件）

权限递增方向 ──────────────────────────────────►
┌────────┬────────┬────────┬────────┬────────┬────────┬────────┐
│ReadOnly│Read    │Read    │Read    │Project │System  │Full    │
│        │Execute │Write   │Write   │Access  │Admin   │Access  │
│        │        │        │Execute │        │        │        │
│  L0    │  L1    │  L2    │  L3    │  L4    │  L5    │  L6    │
└────────┴────────┴────────┴────────┴────────┴────────┴────────┘
```

### 2.2 各级别详细权限

| 级别 | 名称 | 文件读取 | 文件写入 | 命令执行 | 项目配置 | 系统管理 | 网络 | 典型场景 |
|------|------|---------|---------|---------|---------|---------|------|---------|
| L0 | ReadOnly | 允许 | 禁止 | 禁止 | 禁止 | 禁止 | 禁止 | 代码审查、文档阅读 |
| L1 | ReadExecute | 允许 | 禁止 | 受限 | 禁止 | 禁止 | 禁止 | 运行测试、构建项目 |
| L2 | ReadWrite | 允许 | 允许 | 禁止 | 禁止 | 禁止 | 禁止 | 编辑代码、生成文件 |
| L3 | ReadWriteExecute | 允许 | 允许 | 受限 | 禁止 | 禁止 | 禁止 | 完整开发流程 |
| L4 | ProjectAccess | 允许 | 允许 | 允许 | 允许 | 禁止 | 受限 | 项目配置、依赖管理 |
| L5 | SystemAdmin | 允许 | 允许 | 允许 | 允许 | 允许 | 受限 | 环境配置、服务管理 |
| L6 | FullAccess | 允许 | 允许 | 允许 | 允许 | 允许 | 允许 | 完全自动化运维 |

### 2.3 权限细分（Scope）

每个权限级别由多个 scope 组合而成：

```yaml
# 权限 scope 定义
scopes:
  file.read:          # 读取文件
  file.write:         # 写入/编辑文件
  file.delete:        # 删除文件
  file.list:          # 列出目录
  shell.exec:         # 执行命令（同步）
  shell.spawn:        # 启动后台进程
  shell.stdin:        # 向进程写入 stdin
  project.config:     # 修改项目配置文件
  project.deps:       # 管理项目依赖
  system.env:         # 修改环境变量
  system.service:     # 管理系统服务
  network.http:       # HTTP 网络请求
  network.socket:     # Socket 连接
  hardware.gpu:       # GPU 访问
  hardware.storage:   # 外部存储访问
```

Scope 到级别的映射：

```
L0 ReadOnly:         file.read, file.list
L1 ReadExecute:      L0 + shell.exec(受限), shell.spawn(受限)
L2 ReadWrite:        L0 + file.write, file.delete
L3 ReadWriteExecute: L2 + L1 (合并)
L4 ProjectAccess:    L3 + project.config, project.deps, network.http
L5 SystemAdmin:      L4 + system.env, system.service, network.socket
L6 FullAccess:       L5 + hardware.gpu, hardware.storage
```

## 3. 规则引擎 DSL

### 3.1 规则文件概述

规则文件存放在 `.codey/rules/` 目录下，使用 `.rules` 扩展名。规则引擎支持路径模式匹配、条件判断和动作执行。

```
.codey/
  rules/
    default.rules       # 默认规则
    src.rules           # 源代码目录规则
    config.rules        # 配置文件规则
    test.rules          # 测试目录规则
    deploy.rules        # 部署相关规则
```

### 3.2 语法规范

#### 基本结构

```
# 规则文件头部
@version "1.0"
@description "源代码目录权限规则"

# 规则定义
rule <规则名> {
  when <条件表达式>
  then <动作>
  [priority <数值>]
}
```

#### 条件表达式（When）

```
# 路径匹配
when path matches "src/**/*.rs"
when path matches "config/**"
when path not matches "**/*.test.*"

# 操作类型
when action is "read"
when action is "write"
when action is "execute"
when action is "delete"

# 复合条件
when path matches "src/**" and action is "read"
when path matches "*.env" or path matches ".env.*"
when action is "write" and not path matches "**/*.lock"

# 上下文条件
when agent.name is "codey-agent"
when user.approved is true
when time.hour >= 9 and time.hour <= 18
```

#### 路径模式（Glob）

| 模式 | 说明 | 示例 |
|------|------|------|
| `*` | 匹配单层目录中的文件 | `*.rs` |
| `**` | 匹配任意深度目录 | `src/**` |
| `?` | 匹配单个字符 | `file?.txt` |
| `[abc]` | 匹配括号内的字符 | `file[12].txt` |
| `[!abc]` | 不匹配括号内的字符 | `file[!0].txt` |

#### 动作（Then）

```
# 允许/拒绝
then allow
then deny

# 允许并设置条件
then allow with level ReadWrite
then allow with expiry 3600        # 秒
then allow with confirmation       # 需要用户确认

# 拒绝并给出原因
then deny with reason "禁止修改编译输出目录"

# 设置默认权限
then set level ReadOnly
then set level ReadWrite

# 日志记录
then log "访问了敏感文件: ${path}"
then audit                    # 记录到审计日志
```

### 3.3 完整规则示例

```
# .codey/rules/default.rules
@version "1.0"
@description "CodeY 默认权限规则"

# ── 全局默认 ──────────────────────────────────

rule default_readonly {
  when path matches "**"
  then set level ReadOnly
  priority 0
}

# ── 源代码规则 ────────────────────────────────

rule source_read {
  when path matches "src/**" and action is "read"
  then allow
  priority 10
}

rule source_write {
  when path matches "src/**" and action is "write"
  then allow with level ReadWrite
  priority 10
}

rule source_execute {
  when path matches "src/**" and action is "execute"
  then allow with level ReadExecute
  priority 10
}

# ── 测试目录 ──────────────────────────────────

rule test_files {
  when path matches "tests/**" or path matches "**/*.test.*"
  then allow with level ReadWriteExecute
  priority 15
}

# ── 构建产物保护 ──────────────────────────────

rule protect_build_output {
  when path matches "target/**" and action is "write"
  then deny with reason "禁止直接修改编译输出目录，请通过 cargo build"
  priority 100
}

rule protect_build_output_delete {
  when path matches "target/**" and action is "delete"
  then deny with reason "禁止删除编译输出，请使用 cargo clean"
  priority 100
}

# ── 敏感文件保护 ──────────────────────────────

rule protect_env_files {
  when path matches ".env*" and action is "write"
  then deny with reason "禁止修改环境变量文件，请手动配置"
  priority 200
}

rule protect_secrets {
  when path matches "**/*secret*" or path matches "**/*key*"
  then deny with reason "禁止访问密钥相关文件"
  priority 200
}

rule protect_lock_files {
  when path matches "**/*.lock" and action is "write"
  then deny with reason "禁止手动修改锁文件，请使用包管理器"
  priority 150
}

# ── 配置文件 ──────────────────────────────────

rule config_read {
  when path matches "config/**" and action is "read"
  then allow
  priority 20
}

rule config_write {
  when path matches "config/**" and action is "write"
  then allow with confirmation
  priority 20
}

# ── 部署目录 ──────────────────────────────────

rule deploy_access {
  when path matches "deploy/**"
  then allow with level ProjectAccess
  priority 30
}

rule deploy_execute {
  when path matches "deploy/scripts/**" and action is "execute"
  then allow with confirmation
  priority 30
}

# ── 时间限制 ──────────────────────────────────

rule working_hours_only {
  when action is "execute" and not (time.hour >= 8 and time.hour <= 22)
  then deny with reason "非工作时间（8:00-22:00）禁止执行命令"
  priority 500
}

# ── 审计日志 ──────────────────────────────────

rule audit_all_writes {
  when action is "write" or action is "delete"
  then audit
  priority 999
}
```

### 3.4 规则优先级与冲突解决

```
规则匹配流程：

┌─────────────┐
│  收到操作请求 │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────────┐
│  遍历所有规则文件，收集匹配的规则            │
│  (按 priority 数值从高到低排序)              │
└──────┬──────────────────────────────────────┘
       │
       ▼
┌──────────────────────┐    是    ┌───────────┐
│ 是否存在 deny 规则？  │────────>│ 拒绝操作   │
└──────┬───────────────┘         └───────────┘
       │ 否
       ▼
┌──────────────────────┐    是    ┌───────────────────┐
│ 是否存在 allow 规则？ │────────>│ 允许操作            │
│                      │         │ (使用最高优先级规则) │
└──────┬───────────────┘         └───────────────────┘
       │ 否
       ▼
┌──────────────────────┐
│ 使用 default 规则    │
│ 或拒绝（安全回退）    │
└──────────────────────┘

冲突解决原则：
1. deny 优先于 allow（安全第一）
2. priority 数值越大，优先级越高
3. 相同 priority 时，deny > allow
4. 无匹配规则时，默认拒绝（deny by default）
```

## 4. 沙箱系统

### 4.1 平台架构差异

```
┌─────────────────────────────────────────────────────────────┐
│                    Desktop 沙箱 (OS-level)                   │
│                                                             │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │   Agent      │    │   Host       │    │   OS         │  │
│  │   Process    │◄──►│   Process    │◄──►│   Kernel     │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│                                                             │
│  沙箱机制：macOS Seatbelt / Linux seccomp / Windows Job Obj │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    Web 沙箱 (Server-side)                    │
│                                                             │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │   Browser    │    │   Server     │    │   Container  │  │
│  │   Client     │◄──►│   Gateway    │◄──►│   (Docker)   │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│                                                             │
│  沙箱机制：Docker container + namespace + cgroup             │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Desktop 沙箱（macOS）

#### macOS Seatbelt Profile

```scheme
;; macOS Seatbelt 策略文件 (.sb)
;; 限制 Agent 进程的系统调用能力

(version 1)
(deny default)

;; 允许基本的进程操作
(allow process-exec process-fork)

;; 允许读取项目目录
(allow file-read*
  (require-all
    (subpath "/Users/dev/projects")
    (require-not (regex ".*\\.env.*"))
  )
)

;; 允许写入项目目录（排除敏感路径）
(allow file-write*
  (require-all
    (subpath "/Users/dev/projects")
    (require-not (subpath "/Users/dev/projects/target"))
    (require-not (regex ".*\\.env.*"))
    (require-not (regex ".*\\.lock"))
  )
)

;; 允许网络访问（受限）
(allow network-outbound
  (require-all
    (remote ip "0.0.0.0/0")
    (require-not (local ip "127.0.0.1"))
  )
)

;; 禁止的操作
(deny sysctl-read)
(deny file-write-create (subpath "/etc"))
(deny file-write-create (subpath "/usr"))
(deny file-write-create (subpath "/var"))
```

#### Linux seccomp-bpf

```jsonc
// seccomp 过滤器配置
{
  "defaultAction": "SCMP_ACT_ERRNO",
  "architectures": ["SCMP_ARCH_X86_64"],
  "syscalls": [
    {
      "names": ["read", "write", "open", "close", "stat", "fstat"],
      "action": "SCMP_ACT_ALLOW"
    },
    {
      "names": ["mmap", "mprotect", "munmap", "brk"],
      "action": "SCMP_ACT_ALLOW"
    },
    {
      "names": ["execve"],
      "action": "SCMP_ACT_ALLOW",
      "args": [
        {
          "index": 0,
          "value": "/usr/bin",
          "op": "SCMP_CMP_STR_EQ",
          "valueLength": 9
        }
      ]
    },
    {
      "names": ["kill", "ptrace", "mount", "umount2", "reboot"],
      "action": "SCMP_ACT_ERRNO",
      "comment": "禁止危险系统调用"
    }
  ]
}
```

### 4.3 Web 沙箱（Server-side）

#### Docker Container 配置

```yaml
# docker-compose.sandbox.yml
version: "3.9"

services:
  agent-sandbox:
    image: codey/sandbox:latest
    read_only: true
    security_opt:
      - no-new-privileges:true
    cap_drop:
      - ALL
    cap_add:
      - CHOWN
      - SETUID
      - SETGID
    mem_limit: 512m
    cpus: 1.0
    pids_limit: 100
    volumes:
      - type: bind
        source: ${PROJECT_DIR}
        target: /workspace
        read_only: false
      - type: tmpfs
        target: /tmp
        tmpfs:
          size: 100m
    networks:
      - sandbox-net
    environment:
      - CODEY_SANDBOX=true
      - CODEY_PERMISSION_LEVEL=${PERMISSION_LEVEL}

networks:
  sandbox-net:
    internal: true     # 禁止外部网络访问
```

#### Namespace 和 Cgroup 限制

```
容器隔离层级：

┌─────────────────────────────────────────────┐
│  Host OS                                    │
│  ┌─────────────────────────────────────────┐│
│  │  Docker Engine                          ││
│  │  ┌─────────────────────────────────────┐││
│  │  │  Container (sandbox)                │││
│  │  │                                     │││
│  │  │  Namespaces:                        │││
│  │  │    PID    - 进程隔离                │││
│  │  │    NET    - 网络隔离                │││
│  │  │    MNT    - 文件系统隔离            │││
│  │  │    UTS    - 主机名隔离              │││
│  │  │    IPC    - 进程间通信隔离          │││
│  │  │    USER   - 用户隔离                │││
│  │  │                                     │││
│  │  │  Cgroups:                           │││
│  │  │    CPU    - 限制 1 core             │││
│  │  │    Memory - 限制 512MB              │││
│  │  │    PID    - 最多 100 进程           │││
│  │  │    IO     - 限制磁盘 I/O           │││
│  │  │                                     │││
│  │  │  Filesystem:                        │││
│  │  │    /workspace  - 项目目录（读写）    │││
│  │  │    /tmp        - tmpfs（100MB）      │││
│  │  │    /           - 只读 rootfs         │││
│  │  │                                     │││
│  │  └─────────────────────────────────────┘││
│  └─────────────────────────────────────────┘│
└─────────────────────────────────────────────┘
```

### 4.4 沙箱配置对比

| 特性 | Desktop (macOS) | Desktop (Linux) | Web (Docker) |
|------|----------------|-----------------|--------------|
| 隔离级别 | 进程级 | 进程级 | 容器级 |
| 文件系统 | Seatbelt profile | seccomp + mount ns | bind mount + tmpfs |
| 网络 | 应用层过滤 | iptables/nftables | Docker network |
| 资源限制 | launchd limits | cgroups v2 | Docker limits |
| 热更新 | 重新加载 profile | 重建 filter | 重建 container |
| 性能开销 | 极低 | 低 | 中等 |

## 5. 权限检查流程

### 5.1 完整检查链路

```
Agent 发起操作
     │
     ▼
┌─────────────────┐
│ 1. 解析操作类型  │  识别 action (read/write/execute/...)
│    和目标路径    │  识别 target path
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 2. 查询权限级别  │  检查当前 Agent 的 permission level
│    (Permission   │
│     Model)       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐    权限不足    ┌─────────────────┐
│ 3. 基础权限检查  │──────────────►│ 返回 Permission  │
│    (Level >=     │               │ Denied (-32001)  │
│     Required)    │               │ 并建议所需级别    │
└────────┬────────┘               └─────────────────┘
         │ 权限足够
         ▼
┌─────────────────┐    匹配 deny   ┌─────────────────┐
│ 4. 规则引擎检查  │──────────────►│ 返回规则拒绝原因  │
│    (.rules)      │               │ (附带规则名)      │
└────────┬────────┘               └─────────────────┘
         │ 匹配 allow / 无匹配
         ▼
┌─────────────────┐    需要确认    ┌─────────────────┐
│ 5. 确认检查      │──────────────►│ 发送 permission  │
│    (confirmation)│               │ .request 给用户   │
└────────┬────────┘               └────────┬────────┘
         │ 已确认/无需确认                   │
         │                                 ▼
         │                          ┌─────────────────┐
         │                          │ 用户批准/拒绝    │
         │                          └────────┬────────┘
         │                          批准 ────┘───► 拒绝
         │                            │           │
         ▼                            │           ▼
┌─────────────────┐                   │    ┌──────────────┐
│ 6. 沙箱执行      │◄──────────────────┘    │ 返回拒绝      │
│    (OS-level /   │                        └──────────────┘
│     Container)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 7. 审计日志记录  │  记录操作、结果、时间戳
└────────┬────────┘
         │
         ▼
    返回操作结果
```

### 5.2 权限检查伪代码

```typescript
interface PermissionCheckRequest {
  action: "read" | "write" | "execute" | "delete";
  target: string;           // 文件路径或资源标识
  agentId: string;
  context?: {
    command?: string;       // shell 命令内容
    reason?: string;        // 操作理由
  };
}

interface PermissionCheckResult {
  allowed: boolean;
  level: PermissionLevel;
  rule?: string;            // 匹配的规则名
  requiresConfirmation: boolean;
  denialReason?: string;
}

async function checkPermission(
  request: PermissionCheckRequest
): Promise<PermissionCheckResult> {

  // Step 1: 基础级别检查
  const agentLevel = await getAgentLevel(request.agentId);
  const requiredLevel = getRequiredLevel(request.action);

  if (agentLevel < requiredLevel) {
    return {
      allowed: false,
      level: agentLevel,
      requiresConfirmation: false,
      denialReason: `需要 ${requiredLevel} 级权限，当前 ${agentLevel} 级`,
    };
  }

  // Step 2: 规则引擎检查
  const rules = await loadRules(".codey/rules/*.rules");
  const matchedRules = evaluateRules(rules, {
    path: request.target,
    action: request.action,
    agent: request.agentId,
  });

  // deny 优先
  const denyRule = matchedRules.find(r => r.action === "deny");
  if (denyRule) {
    return {
      allowed: false,
      level: agentLevel,
      rule: denyRule.name,
      requiresConfirmation: false,
      denialReason: denyRule.reason,
    };
  }

  // allow 规则
  const allowRule = matchedRules.find(r => r.action === "allow");
  const needsConfirmation = allowRule?.confirmation ?? false;

  // Step 3: 沙箱检查
  const sandboxAllowed = await checkSandbox({
    action: request.action,
    target: request.target,
    command: request.context?.command,
  });

  if (!sandboxAllowed) {
    return {
      allowed: false,
      level: agentLevel,
      requiresConfirmation: false,
      denialReason: "操作被沙箱策略拒绝",
    };
  }

  // Step 4: 审计记录
  await auditLog({
    agentId: request.agentId,
    action: request.action,
    target: request.target,
    result: "allowed",
    rule: allowRule?.name,
    timestamp: new Date().toISOString(),
  });

  return {
    allowed: true,
    level: allowRule?.level ?? agentLevel,
    rule: allowRule?.name,
    requiresConfirmation: needsConfirmation,
  };
}
```

## 6. 配置示例

### 6.1 项目级配置（`.codey/config.toml`）

```toml
# .codey/config.toml
[project]
name = "my-project"
version = "0.1.0"

[permission]
# 默认权限级别
default_level = "ReadOnly"

# 自动提升（不推荐用于生产）
auto_elevate = false

# 权限有效期（秒），0 表示会话级
grant_ttl = 3600

# 最大允许级别（安全上限）
max_level = "ReadWriteExecute"

# 需要确认的操作
confirm_actions = ["delete", "execute"]

# 规则文件目录
rules_dir = ".codey/rules"

[permission.paths]
# 路径级别的权限覆盖
"src/**" = { level = "ReadWrite", confirm = false }
"tests/**" = { level = "ReadWriteExecute", confirm = false }
"config/**" = { level = "ReadWrite", confirm = true }
"deploy/**" = { level = "ProjectAccess", confirm = true }
"target/**" = { level = "ReadOnly", confirm = false }
".env*" = { level = "ReadOnly", confirm = false }

[permission.shell]
# Shell 命令白名单（Level 1-3 下允许的命令）
allowed_commands = [
  "cargo",
  "npm",
  "git",
  "ls",
  "cat",
  "grep",
  "find",
]

# Shell 命令黑名单（任何级别都禁止）
blocked_commands = [
  "rm -rf /",
  "sudo",
  "chmod 777",
  "curl | bash",
  "wget | sh",
]

# 命令超时（毫秒）
timeout = 60000

# 最大输出大小（字节）
max_output_size = 1048576   # 1MB

[sandbox]
# 沙箱模式: "auto" | "desktop" | "web" | "none"
mode = "auto"

# Desktop 沙箱配置
[sandbox.desktop]
# macOS Seatbelt 配置
seatbelt_profile = ".codey/sandbox/darwin.sb"

# Linux seccomp 配置
seccomp_profile = ".codey/sandbox/linux.json"

# 允许的系统调用
allowed_syscalls = ["read", "write", "open", "close", "stat"]

[sandbox.desktop.network]
# 网络访问策略
mode = "restricted"          # "full" | "restricted" | "none"
allowed_hosts = [
  "crates.io",
  "github.com",
  "registry.npmjs.org",
]
blocked_ports = [22, 3389, 5432, 6379]

# Web 沙箱配置
[sandbox.web]
image = "codey/sandbox:latest"
memory_limit = "512m"
cpu_limit = "1.0"
pid_limit = 100
read_only_root = true

[sandbox.web.volumes]
workspace = { source = "${PROJECT_DIR}", target = "/workspace", readonly = false }
tmp = { target = "/tmp", type = "tmpfs", size = "100m" }

[audit]
# 审计日志配置
enabled = true
log_file = ".codey/audit.log"
log_level = "info"           # "debug" | "info" | "warn" | "error"

# 记录哪些操作
log_actions = ["write", "delete", "execute", "permission_change"]

# 日志保留天数
retention_days = 90
```

### 6.2 用户级配置（`~/.codey/config.toml`）

```toml
# ~/.codey/config.toml
[defaults]
# 新项目的默认权限级别
default_level = "ReadOnly"

# 是否信任已授权的项目
trust_granted_projects = true

# 信任有效期（天）
trust_ttl = 30

[notifications]
# 权限请求通知方式
on_permission_request = "prompt"   # "prompt" | "auto_deny" | "auto_approve"

# 自动批准的 scope（谨慎使用）
auto_approve_scopes = []

[history]
# 权限授权历史记录
max_entries = 1000
```

### 6.3 运行时动态配置

通过 Agent Protocol 运行时调整权限：

```jsonc
// 查询当前配置
{
  "method": "permission.query",
  "params": { "scope": "file.write" },
  "id": "pq-1"
}
// 响应
{
  "result": {
    "granted": true,
    "currentLevel": "ReadWrite",
    "expiresAt": "2026-07-05T23:59:59Z",
    "source": "rule:source_write"
  }
}

// 临时提升权限
{
  "method": "permission.request",
  "params": {
    "scope": "shell.exec",
    "targetLevel": "ReadWriteExecute",
    "reason": "需要执行 cargo test",
    "duration": 1800000
  },
  "id": "pr-1"
}

// 撤销权限
{
  "method": "permission.revoke",
  "params": { "scope": "shell.exec" },
  "id": "prev-1"
}
```

## 7. 安全最佳实践

### 7.1 权限配置检查清单

- [ ] 设置合理的 `default_level`（推荐 ReadOnly）
- [ ] 配置 `max_level` 安全上限
- [ ] 敏感路径设置 `confirm = true`
- [ ] Shell 命令黑名单包含高危命令
- [ ] 沙箱模式与部署环境匹配
- [ ] 审计日志已启用
- [ ] 规则文件经过安全审查

### 7.2 常见安全反模式

```
应避免的配置：

# 反模式 1：全局自动批准
auto_elevate = true              # 危险！

# 反模式 2：无沙箱运行
[sandbox]
mode = "none"                    # 危险！

# 反模式 3：允许 sudo
allowed_commands = ["sudo", ...] # 危险！

# 反模式 4：信任所有网络
[sandbox.desktop.network]
mode = "full"                    # 高风险

# 反模式 5：禁用审计
[audit]
enabled = false                  # 无法追溯问题
```

### 7.3 推荐的安全配置模板

```toml
# 安全加固配置模板
[permission]
default_level = "ReadOnly"
auto_elevate = false
max_level = "ReadWriteExecute"
grant_ttl = 1800                # 30 分钟
confirm_actions = ["delete", "execute"]

[permission.shell]
blocked_commands = [
  "sudo", "su", "chmod", "chown",
  "rm -rf", "mkfs", "dd",
  "curl.*|.*sh", "wget.*|.*sh",
]

[sandbox]
mode = "auto"

[audit]
enabled = true
log_level = "info"
retention_days = 90
```

---

*本文档将随 CodeY 项目迭代持续更新。如有疑问或建议，请提交至项目 Issue Tracker。*
