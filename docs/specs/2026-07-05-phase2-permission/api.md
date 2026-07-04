# Phase 2.2 权限系统 API 文档

> 反向生成自 `crates/codey-core/src/permission/` 实现
> 最后更新：2026-07-05

---

## 1. PermissionEngine API

### 结构定义

```rust
pub struct PermissionEngine {
    user_level: PermissionLevel,
    rules: Vec<PermissionRule>,
}
```

### 方法

#### `new(user_level: PermissionLevel) -> Self`

创建新的权限引擎实例。

**参数**：
- `user_level`: 用户的权限级别

**返回**：`PermissionEngine` 实例

**示例**：
```rust
use codey_core::permission::{PermissionEngine, PermissionLevel};

let engine = PermissionEngine::new(PermissionLevel::FileWrite);
```

---

#### `add_rule(&mut self, rule: PermissionRule)`

添加权限规则。规则按插入顺序匹配（First Match Wins）。

**参数**：
- `rule`: 权限规则

**示例**：
```rust
use codey_core::permission::{PermissionRule, RuleAction};

engine.add_rule(PermissionRule {
    pattern: "shell/*".to_string(),
    action: RuleAction::Deny,
    level: PermissionLevel::FullAccess,
});
```

---

#### `check(&self, tool_name: &str, required_level: PermissionLevel) -> PermissionResult`

检查工具调用权限。

**参数**：
- `tool_name`: 工具名称
- `required_level`: 工具所需的最低权限级别

**返回**：`PermissionResult`

**检查流程**：
1. 用户级别 < 所需级别 → `Denied`
2. 匹配规则（First Match Wins）
3. 无规则匹配 → `Allowed`

**示例**：
```rust
let result = engine.check("file/read", PermissionLevel::FileRead);
match result {
    PermissionResult::Allowed => println!("允许访问"),
    PermissionResult::Denied(reason) => println!("拒绝: {}", reason),
    PermissionResult::NeedApproval => println!("需要审批"),
}
```

---

#### `matches_pattern(&self, tool_name: &str, pattern: &str) -> bool`

检查工具名称是否匹配模式。

**参数**：
- `tool_name`: 工具名称
- `pattern`: 匹配模式

**返回**：`bool`

**Pattern 语法**：
- `"*"`: 匹配所有
- `"prefix*"`: 前缀匹配
- `"exact"`: 精确匹配

**示例**：
```rust
assert!(engine.matches_pattern("file/read", "file/*"));
assert!(engine.matches_pattern("anything", "*"));
assert!(!engine.matches_pattern("shell/exec", "file/*"));
```

---

## 2. RuleEngine API

### 结构定义

```rust
pub struct RuleEngine {
    rules: Vec<PermissionRule>,
}
```

### 方法

#### `new() -> Self`

创建空的规则引擎实例。

**返回**：`RuleEngine` 实例

**示例**：
```rust
use codey_core::permission::RuleEngine;

let rule_engine = RuleEngine::new();
```

---

#### `load_from_file(&mut self, path: &Path) -> Result<()>`

从文件加载规则。

**参数**：
- `path`: 规则文件路径

**返回**：`Result<()>`

**错误**：
- 文件不存在
- 文件读取失败

**示例**：
```rust
use std::path::Path;

rule_engine.load_from_file(Path::new("permissions.rules"))?;
```

---

#### `parse_rules(&mut self, content: &str) -> Result<()>`

从文本内容解析规则。

**参数**：
- `content`: 规则文本内容

**返回**：`Result<()>`

**格式**：
```
# 注释
<pattern> <action>
```

**Action 类型**：
- `allow`: 允许
- `deny`: 拒绝
- `require_approval`: 需要审批

**示例**：
```rust
rule_engine.parse_rules("
# 文件操作
file/* allow

# 危险命令
shell/rm deny
")?;
```

---

#### `rules(&self) -> &[PermissionRule]`

获取所有已加载的规则。

**返回**：规则切片

**示例**：
```rust
let rules = rule_engine.rules();
println!("已加载 {} 条规则", rules.len());
```

---

## 3. SandboxManager API

### 结构定义

```rust
pub struct SandboxManager {
    working_directory: PathBuf,
    allowed_paths: Vec<PathBuf>,
    denied_paths: Vec<PathBuf>,
}
```

### 方法

#### `new(working_directory: PathBuf) -> Self`

创建沙箱管理器实例。

**参数**：
- `working_directory`: 工作目录路径

**返回**：`SandboxManager` 实例

**示例**：
```rust
use codey_core::permission::SandboxManager;
use std::path::PathBuf;

let sandbox = SandboxManager::new(PathBuf::from("/home/user/project"));
```

---

#### `allow_path(&mut self, path: PathBuf)`

添加允许的路径前缀。

**参数**：
- `path`: 允许的路径前缀

**示例**：
```rust
sandbox.allow_path(PathBuf::from("/tmp/shared"));
```

---

#### `deny_path(&mut self, path: PathBuf)`

添加拒绝的路径前缀（优先级高于允许）。

**参数**：
- `path`: 拒绝的路径前缀

**示例**：
```rust
sandbox.deny_path(PathBuf::from("/etc/secrets"));
```

---

#### `is_path_allowed(&self, path: &Path) -> bool`

检查路径是否允许访问。

**参数**：
- `path`: 要检查的路径

**返回**：`bool`

**检查逻辑**：
1. 检查 `denied_paths`（最高优先级）
2. 检查 `allowed_paths`
3. 默认：路径必须在 `working_directory` 下

**示例**：
```rust
use std::path::Path;

// 工作目录下的路径 - 允许
assert!(sandbox.is_path_allowed(Path::new("/home/user/project/src/main.rs")));

// 工作目录外的路径 - 拒绝
assert!(!sandbox.is_path_allowed(Path::new("/etc/passwd")));
```

---

#### `resolve_path(&self, path: &str) -> Result<PathBuf>`

解析路径字符串并检查沙箱权限。

**参数**：
- `path`: 路径字符串（相对或绝对）

**返回**：`Result<PathBuf>`

**行为**：
- 相对路径：基于 `working_directory` 解析
- 绝对路径：直接使用
- 解析后检查权限，不允许则返回错误

**示例**：
```rust
// 相对路径解析
let resolved = sandbox.resolve_path("src/main.rs")?;
// 返回 /home/user/project/src/main.rs

// 绝对路径检查
let result = sandbox.resolve_path("/etc/passwd");
assert!(result.is_err());
```

---

## 4. 核心类型 API

### PermissionLevel

```rust
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Serialize, Deserialize)]
pub enum PermissionLevel {
    ReadOnly = 1,
    FileRead = 2,
    FileWrite = 3,
    ShellRead = 4,
    ShellWrite = 5,
    Network = 6,
    FullAccess = 7,
}
```

**特性**：
- 支持 `Ord` 比较（高级别 > 低级别）
- 支持 `FromStr` 解析（字符串转枚举）
- 支持 `Serialize` / `Deserialize`

**FromStr 示例**：
```rust
use std::str::FromStr;

let level = PermissionLevel::from_str("FileWrite")?;
assert_eq!(level, PermissionLevel::FileWrite);
```

---

### PermissionResult

```rust
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub enum PermissionResult {
    Allowed,
    Denied(String),
    NeedApproval,
}
```

**变体说明**：
- `Allowed`: 操作允许
- `Denied(String)`: 操作拒绝，包含拒绝原因
- `NeedApproval`: 需要用户审批

---

### RuleAction

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum RuleAction {
    Allow,
    Deny,
    RequireApproval,
}
```

---

### PermissionRule

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PermissionRule {
    pub pattern: String,
    pub action: RuleAction,
    pub level: PermissionLevel,
}
```

**字段说明**：
- `pattern`: 匹配模式（支持 `*` 通配符）
- `action`: 规则动作
- `level`: 关联的权限级别（当前未在检查中使用）

---

## 5. 使用示例

### 完整的权限检查流程

```rust
use codey_core::permission::{
    PermissionEngine, PermissionLevel, PermissionResult,
    PermissionRule, RuleAction, RuleEngine, SandboxManager,
};
use std::path::PathBuf;

// 1. 创建权限引擎
let mut engine = PermissionEngine::new(PermissionLevel::FileWrite);

// 2. 添加规则
engine.add_rule(PermissionRule {
    pattern: "shell/*".to_string(),
    action: RuleAction::RequireApproval,
    level: PermissionLevel::ShellWrite,
});

engine.add_rule(PermissionRule {
    pattern: "network/*".to_string(),
    action: RuleAction::Deny,
    level: PermissionLevel::Network,
});

// 3. 检查权限
let result = engine.check("file/read", PermissionLevel::FileRead);
match result {
    PermissionResult::Allowed => {
        // 执行工具调用
    }
    PermissionResult::Denied(reason) => {
        // 返回错误给用户
        eprintln!("权限拒绝: {}", reason);
    }
    PermissionResult::NeedApproval => {
        // 请求用户审批
    }
}

// 4. 创建沙箱
let mut sandbox = SandboxManager::new(PathBuf::from("/home/user/project"));
sandbox.deny_path(PathBuf::from("/home/user/project/secrets"));

// 5. 解析并检查路径
match sandbox.resolve_path("src/main.rs") {
    Ok(path) => {
        // 路径安全，可以访问
    }
    Err(e) => {
        // 路径不安全，拒绝访问
        eprintln!("路径错误: {}", e);
    }
}
```

### 从文件加载规则

```rust
use codey_core::permission::RuleEngine;
use std::path::Path;

let mut rule_engine = RuleEngine::new();

// 从文件加载
rule_engine.load_from_file(Path::new("config/permissions.rules"))?;

// 获取规则并应用到权限引擎
let rules = rule_engine.rules().to_vec();
for rule in rules {
    engine.add_rule(rule);
}
```

### 集成到工具调用流程

```rust
async fn execute_tool_call(
    engine: &PermissionEngine,
    sandbox: &SandboxManager,
    tool_name: &str,
    required_level: PermissionLevel,
    params: &ToolParams,
) -> Result<ToolResult> {
    // 1. 检查权限
    match engine.check(tool_name, required_level) {
        PermissionResult::Allowed => {}
        PermissionResult::Denied(reason) => {
            return Err(anyhow::anyhow!("权限拒绝: {}", reason));
        }
        PermissionResult::NeedApproval => {
            // TODO: 实现用户审批流程
            return Err(anyhow::anyhow!("需要用户审批"));
        }
    }

    // 2. 检查路径（如果是文件操作）
    if let Some(path) = params.get_path() {
        sandbox.resolve_path(path)?;
    }

    // 3. 执行工具
    execute_tool(tool_name, params).await
}
```

---

## 6. 模块导出

```rust
// crates/codey-core/src/permission/mod.rs

pub mod engine;
pub mod rules;
pub mod sandbox;

#[cfg(test)]
mod tests;

pub use engine::{PermissionEngine, PermissionLevel, PermissionResult};
pub use rules::RuleEngine;
pub use sandbox::SandboxManager;
```
