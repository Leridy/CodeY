# Phase 2.2 权限系统测试文档

> 反向生成自 `crates/codey-core/src/permission/tests.rs` 实现
> 最后更新：2026-07-05

---

## 1. 测试策略

### 测试方法

采用 **TDD (Test-Driven Development)** 方法：
1. 先编写测试（RED）
2. 实现功能（GREEN）
3. 重构优化（REFACTOR）

### 测试分类

| 类别 | 数量 | 覆盖范围 |
|------|------|----------|
| PermissionLevel 测试 | 3 | 级别排序、相等性、完整链 |
| PermissionEngine 测试 | 7 | 级别检查、规则匹配、优先级 |
| Pattern 匹配测试 | 4 | 精确匹配、通配符、前缀 |
| RuleEngine 测试 | 7 | 规则解析、文件加载、注释处理 |
| SandboxManager 测试 | 8 | 路径检查、允许/拒绝、路径解析 |
| **总计** | **36** | - |

---

## 2. 已有测试用例

### 2.1 PermissionLevel 测试 (3 个)

#### `permission_level_ordering`

验证权限级别的基本排序关系。

```rust
#[test]
fn permission_level_ordering() {
    assert!(PermissionLevel::ReadOnly < PermissionLevel::FileRead);
    assert!(PermissionLevel::FileRead < PermissionLevel::FileWrite);
    assert!(PermissionLevel::FileWrite < PermissionLevel::ShellRead);
    assert!(PermissionLevel::ShellRead < PermissionLevel::ShellWrite);
    assert!(PermissionLevel::ShellWrite < PermissionLevel::Network);
    assert!(PermissionLevel::Network < PermissionLevel::FullAccess);
}
```

**覆盖点**：
- 相邻级别的大小关系
- `Ord` trait 实现正确性

---

#### `permission_level_full_chain`

验证所有级别的完整传递性。

```rust
#[test]
fn permission_level_full_chain() {
    let levels = [
        PermissionLevel::ReadOnly,
        PermissionLevel::FileRead,
        PermissionLevel::FileWrite,
        PermissionLevel::ShellRead,
        PermissionLevel::ShellWrite,
        PermissionLevel::Network,
        PermissionLevel::FullAccess,
    ];

    for i in 0..levels.len() {
        for j in (i + 1)..levels.len() {
            assert!(levels[i] < levels[j]);
        }
    }
}
```

**覆盖点**：
- 传递性：A < B 且 B < C 则 A < C
- 所有级别的两两比较

---

#### `permission_level_equality`

验证级别的相等性和不等性。

```rust
#[test]
fn permission_level_equality() {
    assert_eq!(PermissionLevel::ReadOnly, PermissionLevel::ReadOnly);
    assert_eq!(PermissionLevel::FullAccess, PermissionLevel::FullAccess);
    assert_ne!(PermissionLevel::ReadOnly, PermissionLevel::FullAccess);
}
```

**覆盖点**：
- `Eq` trait 实现
- 自反性：A == A
- 对称性：A != B

---

### 2.2 PermissionEngine 测试 (7 个)

#### `engine_allows_when_level_sufficient`

验证用户级别足够时允许访问。

```rust
#[test]
fn engine_allows_when_level_sufficient() {
    let engine = PermissionEngine::new(PermissionLevel::FileWrite);
    let result = engine.check("file/read", PermissionLevel::FileRead);
    assert!(matches!(result, PermissionResult::Allowed));
}
```

**场景**：用户 FileWrite，工具需要 FileRead → 允许

---

#### `engine_denies_when_level_insufficient`

验证用户级别不足时拒绝访问。

```rust
#[test]
fn engine_denies_when_level_insufficient() {
    let engine = PermissionEngine::new(PermissionLevel::ReadOnly);
    let result = engine.check("file/write", PermissionLevel::FileWrite);
    assert!(matches!(result, PermissionResult::Denied(_)));
}
```

**场景**：用户 ReadOnly，工具需要 FileWrite → 拒绝

---

#### `engine_denies_message_includes_levels`

验证拒绝消息包含级别信息。

```rust
#[test]
fn engine_denies_message_includes_levels() {
    let engine = PermissionEngine::new(PermissionLevel::ReadOnly);
    let result = engine.check("file/write", PermissionLevel::FileWrite);
    match result {
        PermissionResult::Denied(msg) => {
            assert!(msg.contains("ReadOnly"));
            assert!(msg.contains("FileWrite"));
        }
        _ => panic!("Expected Denied result"),
    }
}
```

**覆盖点**：错误消息的可读性和调试价值

---

#### `engine_allows_exact_level_match`

验证用户级别等于工具所需级别时允许访问。

```rust
#[test]
fn engine_allows_exact_level_match() {
    let engine = PermissionEngine::new(PermissionLevel::ShellRead);
    let result = engine.check("shell/read", PermissionLevel::ShellRead);
    assert!(matches!(result, PermissionResult::Allowed));
}
```

**场景**：用户 ShellRead，工具需要 ShellRead → 允许

---

#### `engine_rule_deny_overrides_allow`

验证 Deny 规则可以覆盖高级别权限。

```rust
#[test]
fn engine_rule_deny_overrides_allow() {
    let mut engine = PermissionEngine::new(PermissionLevel::FullAccess);
    engine.add_rule(PermissionRule {
        pattern: "dangerous_tool".to_string(),
        action: RuleAction::Deny,
        level: PermissionLevel::FullAccess,
    });

    let result = engine.check("dangerous_tool", PermissionLevel::ReadOnly);
    assert!(matches!(result, PermissionResult::Denied(_)));
}
```

**场景**：用户 FullAccess，但规则 Deny → 拒绝

---

#### `engine_rule_require_approval`

验证 RequireApproval 规则生效。

```rust
#[test]
fn engine_rule_require_approval() {
    let mut engine = PermissionEngine::new(PermissionLevel::FullAccess);
    engine.add_rule(PermissionRule {
        pattern: "sensitive_tool".to_string(),
        action: RuleAction::RequireApproval,
        level: PermissionLevel::FullAccess,
    });

    let result = engine.check("sensitive_tool", PermissionLevel::ReadOnly);
    assert!(matches!(result, PermissionResult::NeedApproval));
}
```

**场景**：规则要求审批 → NeedApproval

---

#### `engine_insufficient_level_even_with_allow_rule`

验证级别检查优先于规则匹配。

```rust
#[test]
fn engine_insufficient_level_even_with_allow_rule() {
    let mut engine = PermissionEngine::new(PermissionLevel::ReadOnly);
    engine.add_rule(PermissionRule {
        pattern: "write_tool".to_string(),
        action: RuleAction::Allow,
        level: PermissionLevel::FullAccess,
    });

    let result = engine.check("write_tool", PermissionLevel::FileWrite);
    assert!(matches!(result, PermissionResult::Denied(_)));
}
```

**场景**：用户级别不足，即使规则 Allow → 拒绝

---

### 2.3 Pattern 匹配测试 (4 个)

#### `pattern_exact_match`

验证精确匹配。

```rust
#[test]
fn pattern_exact_match() {
    let engine = PermissionEngine::new(PermissionLevel::FullAccess);
    assert!(engine.matches_pattern("file/read", "file/read"));
    assert!(!engine.matches_pattern("file/read", "file/write"));
}
```

---

#### `pattern_wildcard_all`

验证全通配符 `*`。

```rust
#[test]
fn pattern_wildcard_all() {
    let engine = PermissionEngine::new(PermissionLevel::FullAccess);
    assert!(engine.matches_pattern("anything", "*"));
    assert!(engine.matches_pattern("", "*"));
}
```

---

#### `pattern_prefix_wildcard`

验证前缀通配符 `prefix*`。

```rust
#[test]
fn pattern_prefix_wildcard() {
    let engine = PermissionEngine::new(PermissionLevel::FullAccess);
    assert!(engine.matches_pattern("file/read", "file/*"));
    assert!(engine.matches_pattern("file/write", "file/*"));
    assert!(!engine.matches_pattern("shell/exec", "file/*"));
}
```

---

#### `pattern_no_match_different_prefix`

验证不同前缀不匹配。

```rust
#[test]
fn pattern_no_match_different_prefix() {
    let engine = PermissionEngine::new(PermissionLevel::FullAccess);
    assert!(!engine.matches_pattern("network/http", "file/*"));
}
```

---

### 2.4 RuleEngine 测试 (7 个)

#### `rule_engine_parse_allow_rules`

验证解析 Allow 规则。

```rust
#[test]
fn rule_engine_parse_allow_rules() {
    let mut rule_engine = RuleEngine::new();
    rule_engine.parse_rules("file/* allow").unwrap();

    let rules = rule_engine.rules();
    assert_eq!(rules.len(), 1);
    assert_eq!(rules[0].pattern, "file/*");
    assert!(matches!(rules[0].action, RuleAction::Allow));
}
```

---

#### `rule_engine_parse_deny_rules`

验证解析 Deny 规则。

```rust
#[test]
fn rule_engine_parse_deny_rules() {
    let mut rule_engine = RuleEngine::new();
    rule_engine.parse_rules("dangerous deny").unwrap();

    let rules = rule_engine.rules();
    assert_eq!(rules.len(), 1);
    assert_eq!(rules[0].pattern, "dangerous");
    assert!(matches!(rules[0].action, RuleAction::Deny));
}
```

---

#### `rule_engine_parse_require_approval`

验证解析 RequireApproval 规则。

```rust
#[test]
fn rule_engine_parse_require_approval() {
    let mut rule_engine = RuleEngine::new();
    rule_engine.parse_rules("sensitive require_approval").unwrap();

    let rules = rule_engine.rules();
    assert_eq!(rules.len(), 1);
    assert!(matches!(rules[0].action, RuleAction::RequireApproval));
}
```

---

#### `rule_engine_skips_comments`

验证跳过注释行。

```rust
#[test]
fn rule_engine_skips_comments() {
    let mut rule_engine = RuleEngine::new();
    rule_engine.parse_rules("# this is a comment\nfile/* allow").unwrap();

    let rules = rule_engine.rules();
    assert_eq!(rules.len(), 1);
}
```

---

#### `rule_engine_skips_empty_lines`

验证跳过空行。

```rust
#[test]
fn rule_engine_skips_empty_lines() {
    let mut rule_engine = RuleEngine::new();
    rule_engine.parse_rules("\n\nfile/* allow\n\n").unwrap();

    let rules = rule_engine.rules();
    assert_eq!(rules.len(), 1);
}
```

---

#### `rule_engine_multiple_rules`

验证解析多条规则。

```rust
#[test]
fn rule_engine_multiple_rules() {
    let mut rule_engine = RuleEngine::new();
    rule_engine
        .parse_rules("file/* allow\nshell/* deny\nnet/* require_approval")
        .unwrap();

    let rules = rule_engine.rules();
    assert_eq!(rules.len(), 3);
}
```

---

#### `rule_engine_load_from_file`

验证从文件加载规则。

```rust
#[test]
fn rule_engine_load_from_file() {
    let tmp = TempDir::new().unwrap();
    let rules_file = tmp.path().join("test.rules");
    std::fs::write(&rules_file, "# test rules\nfile/* allow\nshell/* deny\n").unwrap();

    let mut rule_engine = RuleEngine::new();
    rule_engine.load_from_file(&rules_file).unwrap();

    let rules = rule_engine.rules();
    assert_eq!(rules.len(), 2);
}
```

---

#### `rule_engine_load_nonexistent_file`

验证加载不存在的文件返回错误。

```rust
#[test]
fn rule_engine_load_nonexistent_file() {
    let mut rule_engine = RuleEngine::new();
    let result = rule_engine.load_from_file(PathBuf::from("/nonexistent/path.rules").as_path());
    assert!(result.is_err());
}
```

---

### 2.5 SandboxManager 测试 (8 个)

#### `sandbox_path_under_working_dir_is_allowed`

验证工作目录下的路径允许访问。

```rust
#[test]
fn sandbox_path_under_working_dir_is_allowed() {
    let tmp = TempDir::new().unwrap();
    let sandbox = SandboxManager::new(tmp.path().to_path_buf());

    let path = tmp.path().join("src/main.rs");
    assert!(sandbox.is_path_allowed(&path));
}
```

---

#### `sandbox_path_outside_working_dir_is_denied`

验证工作目录外的路径拒绝访问。

```rust
#[test]
fn sandbox_path_outside_working_dir_is_denied() {
    let tmp = TempDir::new().unwrap();
    let sandbox = SandboxManager::new(tmp.path().to_path_buf());

    assert!(!sandbox.is_path_allowed(PathBuf::from("/etc/passwd").as_path()));
}
```

---

#### `sandbox_allowed_path_override`

验证允许列表可以覆盖默认限制。

```rust
#[test]
fn sandbox_allowed_path_override() {
    let tmp = TempDir::new().unwrap();
    let mut sandbox = SandboxManager::new(tmp.path().to_path_buf());
    sandbox.allow_path(PathBuf::from("/tmp/shared"));

    assert!(sandbox.is_path_allowed(PathBuf::from("/tmp/shared/data.txt").as_path()));
}
```

---

#### `sandbox_denied_path_override`

验证拒绝列表生效。

```rust
#[test]
fn sandbox_denied_path_override() {
    let tmp = TempDir::new().unwrap();
    let mut sandbox = SandboxManager::new(tmp.path().to_path_buf());
    sandbox.deny_path(tmp.path().join("secrets"));

    assert!(!sandbox.is_path_allowed(tmp.path().join("secrets/key.pem").as_path()));
}
```

---

#### `sandbox_denied_takes_precedence_over_allowed`

验证拒绝优先于允许。

```rust
#[test]
fn sandbox_denied_takes_precedence_over_allowed() {
    let tmp = TempDir::new().unwrap();
    let mut sandbox = SandboxManager::new(tmp.path().to_path_buf());
    let sensitive = tmp.path().join("sensitive");
    sandbox.allow_path(tmp.path().to_path_buf());
    sandbox.deny_path(sensitive.clone());

    assert!(!sandbox.is_path_allowed(sensitive.join("data.txt").as_path()));
}
```

---

#### `sandbox_resolve_relative_path`

验证相对路径解析。

```rust
#[test]
fn sandbox_resolve_relative_path() {
    let tmp = TempDir::new().unwrap();
    let sandbox = SandboxManager::new(tmp.path().to_path_buf());

    let resolved = sandbox.resolve_path("src/main.rs").unwrap();
    assert_eq!(resolved, tmp.path().join("src/main.rs"));
}
```

---

#### `sandbox_resolve_absolute_path_allowed`

验证允许的绝对路径解析。

```rust
#[test]
fn sandbox_resolve_absolute_path_allowed() {
    let tmp = TempDir::new().unwrap();
    let sandbox = SandboxManager::new(tmp.path().to_path_buf());

    let target = tmp.path().join("src/main.rs");
    let resolved = sandbox.resolve_path(target.to_str().unwrap()).unwrap();
    assert_eq!(resolved, target);
}
```

---

#### `sandbox_resolve_absolute_path_denied`

验证拒绝的绝对路径返回错误。

```rust
#[test]
fn sandbox_resolve_absolute_path_denied() {
    let tmp = TempDir::new().unwrap();
    let sandbox = SandboxManager::new(tmp.path().to_path_buf());

    let result = sandbox.resolve_path("/etc/passwd");
    assert!(result.is_err());
}
```

---

## 3. 缺失的测试用例（建议补充）

### 3.1 PermissionLevel 缺失测试

#### `permission_level_from_str`

测试字符串解析为权限级别。

```rust
#[test]
fn permission_level_from_str() {
    assert_eq!(PermissionLevel::from_str("ReadOnly").unwrap(), PermissionLevel::ReadOnly);
    assert_eq!(PermissionLevel::from_str("FileRead").unwrap(), PermissionLevel::FileRead);
    assert_eq!(PermissionLevel::from_str("FullAccess").unwrap(), PermissionLevel::FullAccess);
    assert!(PermissionLevel::from_str("InvalidLevel").is_err());
}
```

**覆盖点**：`FromStr` trait 实现

---

#### `permission_level_serialization`

测试序列化和反序列化。

```rust
#[test]
fn permission_level_serialization() {
    let level = PermissionLevel::FileWrite;
    let json = serde_json::to_string(&level).unwrap();
    let deserialized: PermissionLevel = serde_json::from_str(&json).unwrap();
    assert_eq!(level, deserialized);
}
```

**覆盖点**：`Serialize` / `Deserialize` 实现

---

### 3.2 PermissionEngine 缺失测试

#### `engine_first_match_wins_with_multiple_rules`

测试多条规则的优先级。

```rust
#[test]
fn engine_first_match_wins_with_multiple_rules() {
    let mut engine = PermissionEngine::new(PermissionLevel::FullAccess);
    engine.add_rule(PermissionRule {
        pattern: "tool_*".to_string(),
        action: RuleAction::Allow,
        level: PermissionLevel::FullAccess,
    });
    engine.add_rule(PermissionRule {
        pattern: "tool_*".to_string(),
        action: RuleAction::Deny,
        level: PermissionLevel::FullAccess,
    });

    // 第一条规则生效
    let result = engine.check("tool_x", PermissionLevel::ReadOnly);
    assert!(matches!(result, PermissionResult::Allowed));
}
```

**覆盖点**：First Match Wins 策略

---

#### `engine_no_rules_default_allow`

测试无规则时默认允许。

```rust
#[test]
fn engine_no_rules_default_allow() {
    let engine = PermissionEngine::new(PermissionLevel::FullAccess);
    let result = engine.check("any_tool", PermissionLevel::ReadOnly);
    assert!(matches!(result, PermissionResult::Allowed));
}
```

**覆盖点**：默认行为

---

#### `engine_add_rule_mutability`

测试规则动态添加。

```rust
#[test]
fn engine_add_rule_mutability() {
    let mut engine = PermissionEngine::new(PermissionLevel::FullAccess);

    // 初始无规则
    let result = engine.check("tool", PermissionLevel::ReadOnly);
    assert!(matches!(result, PermissionResult::Allowed));

    // 添加规则后
    engine.add_rule(PermissionRule {
        pattern: "tool".to_string(),
        action: RuleAction::Deny,
        level: PermissionLevel::FullAccess,
    });

    let result = engine.check("tool", PermissionLevel::ReadOnly);
    assert!(matches!(result, PermissionResult::Denied(_)));
}
```

**覆盖点**：动态规则管理

---

### 3.3 RuleEngine 缺失测试

#### `rule_engine_skips_unknown_actions`

测试跳过未知的 action。

```rust
#[test]
fn rule_engine_skips_unknown_actions() {
    let mut rule_engine = RuleEngine::new();
    rule_engine
        .parse_rules("file/* unknown_action\nshell/* allow")
        .unwrap();

    let rules = rule_engine.rules();
    assert_eq!(rules.len(), 1);
    assert_eq!(rules[0].pattern, "shell/*");
}
```

**覆盖点**：错误容错

---

#### `rule_engine_parse_rules_error_handling`

测试解析错误处理。

```rust
#[test]
fn rule_engine_parse_rules_error_handling() {
    let mut rule_engine = RuleEngine::new();

    // 单字段行（缺少 action）
    let result = rule_engine.parse_rules("file/*");
    assert!(result.is_ok()); // 应该跳过而不是报错
    assert_eq!(rule_engine.rules().len(), 0);
}
```

**覆盖点**：格式错误处理

---

### 3.4 SandboxManager 缺失测试

#### `sandbox_resolve_relative_path_outside_denied`

测试相对路径解析后被拒绝。

```rust
#[test]
fn sandbox_resolve_relative_path_outside_denied() {
    let tmp = TempDir::new().unwrap();
    let sandbox = SandboxManager::new(tmp.path().to_path_buf());

    // 相对路径解析后指向工作目录外
    let result = sandbox.resolve_path("../../../etc/passwd");
    assert!(result.is_err());
}
```

**覆盖点**：路径遍历防护

---

#### `sandbox_empty_working_directory`

测试空工作目录的行为。

```rust
#[test]
fn sandbox_empty_working_directory() {
    let sandbox = SandboxManager::new(PathBuf::new());

    // 空工作目录下，任何路径都不应该允许
    assert!(!sandbox.is_path_allowed(PathBuf::from("/any/path").as_path()));
}
```

**覆盖点**：边界条件

---

#### `sandbox_nested_denied_paths`

测试嵌套的拒绝路径。

```rust
#[test]
fn sandbox_nested_denied_paths() {
    let tmp = TempDir::new().unwrap();
    let mut sandbox = SandboxManager::new(tmp.path().to_path_buf());

    sandbox.deny_path(tmp.path().join("a"));
    sandbox.deny_path(tmp.path().join("a/b"));

    // 两个拒绝路径都应该生效
    assert!(!sandbox.is_path_allowed(tmp.path().join("a/file.txt").as_path()));
    assert!(!sandbox.is_path_allowed(tmp.path().join("a/b/file.txt").as_path()));
}
```

**覆盖点**：嵌套路径处理

---

## 4. 测试覆盖率目标

### 当前覆盖率

| 模块 | 测试数 | 估计覆盖率 |
|------|--------|-----------|
| PermissionLevel | 3 | ~80% |
| PermissionEngine | 7 | ~85% |
| RuleEngine | 7 | ~80% |
| SandboxManager | 8 | ~85% |
| **总计** | **36** | **~82%** |

### 目标覆盖率

| 模块 | 目标覆盖率 | 缺口 |
|------|-----------|------|
| PermissionLevel | 90% | 需补充 FromStr、序列化测试 |
| PermissionEngine | 90% | 需补充边界条件测试 |
| RuleEngine | 90% | 需补充错误处理测试 |
| SandboxManager | 90% | 需补充路径遍历防护测试 |

### 建议补充的测试用例

1. **PermissionLevel**: 2 个
   - `permission_level_from_str`
   - `permission_level_serialization`

2. **PermissionEngine**: 3 个
   - `engine_first_match_wins_with_multiple_rules`
   - `engine_no_rules_default_allow`
   - `engine_add_rule_mutability`

3. **RuleEngine**: 2 个
   - `rule_engine_skips_unknown_actions`
   - `rule_engine_parse_rules_error_handling`

4. **SandboxManager**: 3 个
   - `sandbox_resolve_relative_path_outside_denied`
   - `sandbox_empty_working_directory`
   - `sandbox_nested_denied_paths`

**总计建议补充**: 10 个测试用例

补充后预计覆盖率: **~90%**

---

## 5. 测试运行

### 运行所有测试

```bash
cargo test -p codey-core --lib permission
```

### 运行特定测试

```bash
cargo test -p codey-core --lib permission::tests::permission_level_ordering
```

### 运行测试并显示输出

```bash
cargo test -p codey-core --lib permission -- --nocapture
```

---

## 6. 测试依赖

```toml
[dev-dependencies]
tempfile = "3"
serde_json = "1"
```

---

## 7. 测试最佳实践

### 命名规范

- 测试函数名使用 snake_case
- 描述测试场景而非实现
- 示例：`engine_denies_when_level_insufficient` 而非 `engine_check_returns_denied`

### 测试结构

```rust
#[test]
fn test_name() {
    // 1. 准备 (Arrange)
    let engine = PermissionEngine::new(PermissionLevel::ReadOnly);

    // 2. 执行 (Act)
    let result = engine.check("file/write", PermissionLevel::FileWrite);

    // 3. 断言 (Assert)
    assert!(matches!(result, PermissionResult::Denied(_)));
}
```

### 边界条件

始终测试：
- 最小值/最大值
- 空输入
- 无效输入
- 并发场景（如适用）
