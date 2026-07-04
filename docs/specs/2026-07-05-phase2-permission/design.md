# Phase 2.2 权限系统设计文档

> 反向生成自 `crates/codey-core/src/permission/` 实现
> 最后更新：2026-07-05

---

## 1. 概述

权限系统为 CodeY Agent 提供细粒度的工具访问控制，基于 7 级权限模型和规则引擎实现安全的工具调用管理。

### 核心组件

| 组件 | 职责 |
|------|------|
| `PermissionEngine` | 权限检查引擎，执行级别检查和规则匹配 |
| `RuleEngine` | 规则加载器，从 `.rules` 文件解析规则 |
| `SandboxManager` | 路径沙箱，限制文件系统访问范围 |

---

## 2. 权限级别模型 (PermissionLevel)

7 级权限模型，从低到高排列：

```rust
pub enum PermissionLevel {
    ReadOnly = 1,      // L1: 只读访问
    FileRead = 2,      // L2: 文件读取
    FileWrite = 3,     // L3: 文件读写
    ShellRead = 4,     // L4: Shell 只读命令
    ShellWrite = 5,    // L5: Shell 读写命令
    Network = 6,       // L6: 网络访问
    FullAccess = 7,    // L7: 完全访问（包含硬件）
}
```

### 级别关系

- 使用 `Ord` trait 实现级别比较
- 高级别自动包含低级别的权限
- 用户级别 >= 工具所需级别时允许访问

---

## 3. 权限检查流程

```
┌─────────────────────────────────────────────────────────────┐
│                    PermissionEngine.check()                  │
├─────────────────────────────────────────────────────────────┤
│  1. 级别检查 (Level Check)                                   │
│     ├─ user_level < required_level → Denied                 │
│     └─ user_level >= required_level → 继续                  │
│                                                             │
│  2. 规则匹配 (Rule Matching)                                 │
│     ├─ 遍历规则列表（按插入顺序）                             │
│     ├─ 第一个匹配的规则生效（First Match Wins）               │
│     └─ 规则动作：                                            │
│         ├─ Allow → Allowed                                  │
│         ├─ Deny → Denied                                    │
│         └─ RequireApproval → NeedApproval                   │
│                                                             │
│  3. 默认行为 (Default)                                       │
│     └─ 无规则匹配 + 级别检查通过 → Allowed                   │
└─────────────────────────────────────────────────────────────┘
```

### 关键设计决策

1. **级别检查优先**：即使规则允许，级别不足仍会拒绝
2. **First Match Wins**：规则按插入顺序匹配，第一个匹配的规则生效
3. **默认允许**：级别检查通过且无规则匹配时默认允许

---

## 4. 规则引擎 DSL 语法

### 文件格式

```
# 注释行（以 # 开头）
<pattern> <action>
```

### Pattern 语法

| Pattern | 说明 | 示例 |
|---------|------|------|
| `exact` | 精确匹配 | `file/read` |
| `*` | 匹配所有 | `*` |
| `prefix*` | 前缀通配 | `file/*` |

### Action 类型

| Action | 说明 |
|--------|------|
| `allow` | 允许访问 |
| `deny` | 拒绝访问 |
| `require_approval` | 需要用户审批 |

### 示例规则文件

```rules
# 允许所有文件操作
file/* allow

# 拒绝危险的 shell 命令
shell/rm deny
shell/format deny

# 网络操作需要审批
network/* require_approval
```

---

## 5. 路径沙箱设计

### 核心逻辑

```
┌─────────────────────────────────────────────────────────────┐
│                  SandboxManager.is_path_allowed()            │
├─────────────────────────────────────────────────────────────┤
│  1. 检查 denied_paths（最高优先级）                           │
│     └─ 路径以 denied 前缀开头 → false                        │
│                                                             │
│  2. 检查 allowed_paths                                      │
│     └─ 路径以 allowed 前缀开头 → true                        │
│                                                             │
│  3. 默认行为                                                 │
│     └─ 路径必须在 working_directory 下                       │
└─────────────────────────────────────────────────────────────┘
```

### 路径解析

- 相对路径：基于 `working_directory` 解析为绝对路径
- 绝对路径：直接使用
- 解析后检查沙箱权限，不允许的路径返回错误

### 优先级规则

1. **Denied > Allowed**：被拒绝的路径即使在允许列表中也会被拒绝
2. **Allowed > Default**：显式允许的路径可以访问工作目录外的位置
3. **Default**：工作目录下的路径默认允许

---

## 6. 类型定义

### PermissionResult

```rust
pub enum PermissionResult {
    Allowed,              // 操作允许
    Denied(String),       // 操作拒绝（包含原因）
    NeedApproval,         // 需要用户审批
}
```

### RuleAction

```rust
pub enum RuleAction {
    Allow,
    Deny,
    RequireApproval,
}
```

### PermissionRule

```rust
pub struct PermissionRule {
    pub pattern: String,           // 匹配模式
    pub action: RuleAction,        // 规则动作
    pub level: PermissionLevel,    // 关联的权限级别
}
```

---

## 7. 已知问题

### P1: 规则级别未使用

**问题**：`PermissionRule.level` 字段在规则匹配时未被使用，仅在构造时设置为 `ReadOnly`。

**影响**：无法为不同规则设置不同的权限级别要求。

**建议**：在 `check()` 方法中增加规则级别检查，或移除该字段避免混淆。

### P2: Pattern 语法有限

**问题**：当前仅支持精确匹配、全匹配 `*` 和前缀通配 `prefix*`，不支持：
- 后缀通配 `*.ext`
- 中间通配 `path/*/file`
- 字符类 `[abc]`

**影响**：某些复杂的匹配需求无法表达。

**建议**：考虑引入 glob 或正则表达式支持。

### P3: 规则文件无级别指定

**问题**：规则文件格式 `<pattern> <action>` 不支持指定权限级别，所有规则默认为 `ReadOnly`。

**影响**：无法通过规则文件控制不同级别的访问。

**建议**：扩展格式为 `<pattern> <action> [level]`。

### P4: 沙箱路径规范化缺失

**问题**：路径比较使用 `starts_with`，未处理 `..` 和符号链接。

**影响**：可能通过路径遍历绕过沙箱限制（如 `../../etc/passwd`）。

**建议**：在比较前规范化路径，解析符号链接。

### P5: 无规则审计日志

**问题**：权限检查结果未记录，无法审计和调试。

**影响**：难以追踪权限拒绝的原因和历史。

**建议**：增加审计日志记录机制。

### P6: 并发访问未考虑

**问题**：`PermissionEngine` 和 `SandboxManager` 未实现 `Sync`，在并发场景下可能有问题。

**影响**：多线程环境下需要额外的同步机制。

**建议**：评估是否需要添加 `Arc<Mutex<>>` 包装或使用无锁设计。

---

## 8. 扩展点

### 未来可扩展方向

1. **动态规则加载**：支持运行时更新规则
2. **规则继承**：支持规则集的继承和覆盖
3. **上下文感知**：基于用户、时间、环境等上下文的动态权限
4. **权限缓存**：缓存检查结果提升性能
5. **RBAC/ABAC 集成**：与角色/属性访问控制模型集成

---

## 9. 依赖关系

```
PermissionEngine
├── PermissionLevel (枚举)
├── PermissionResult (枚举)
├── RuleAction (枚举)
└── PermissionRule (结构体)

RuleEngine
├── PermissionRule (复用)
└── PermissionLevel (复用)

SandboxManager
└── 独立模块，无内部依赖
```
