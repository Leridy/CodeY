# clippy 配置规范

## 配置文件

创建 `clippy.toml`：

```toml
# 复杂度阈值
cognitive-complexity-threshold = 25
too-many-arguments-threshold = 7
type-complexity-threshold = 250

# 命名配置
allowed-idents-below-min-chars = ["i", "j", "x", "y", "z"]

# 性能配置
vec-box-size-threshold = 4

# 样式配置
single-char-binding-names-threshold = 4
```

## 配置说明

| 选项 | 值 | 说明 |
|------|-----|------|
| `cognitive-complexity-threshold` | 25 | 认知复杂度阈值 |
| `too-many-arguments-threshold` | 7 | 函数参数数量阈值 |
| `type-complexity-threshold` | 250 | 类型复杂度阈值 |
| `allowed-idents-below-min-chars` | i,j,x,y,z | 允许的短变量名 |
| `vec-box-size-threshold` | 4 | Vec<Box<T>> 大小阈值 |
| `single-char-binding-names-threshold` | 4 | 单字符绑定名称阈值 |

## 常用 Lint 规则

### 在代码中配置

```rust
// 允许特定 lint
#[allow(clippy::too_many_arguments)]
fn complex_function(a: i32, b: i32, c: i32, d: i32, e: i32, f: i32, g: i32) { ... }

// 警告特定 lint
#[warn(clippy::pedantic)]
mod strict_module {
    // 更严格的检查
}

// 拒绝特定 lint
#[deny(clippy::unwrap_used)]
fn safe_function() {
    // 禁止使用 unwrap
}
```

### Cargo.toml 配置

```toml
[lints.clippy]
# 警告
pedantic = { level = "warn", priority = -1 }
nursery = { level = "warn", priority = -1 }

# 允许
too_many_arguments = "allow"
module_name_repetitions = "allow"

# 拒绝
unwrap_used = "deny"
expect_used = "deny"
```

## 性能相关 Lint

### 避免不必要的分配

```rust
// clippy 建议：避免不必要的 String 分配
let s = "hello".to_string();  // 警告：直接使用 &str
let s: &str = "hello";

// clippy 建议：使用 to_string() 而非 format!
let s = format!("{}", 42);  // 警告
let s = 42.to_string();
```

### 迭代器优化

```rust
// clippy 建议：使用迭代器链
let mut result = Vec::new();
for item in items {
    if item.is_valid() {
        result.push(item.process());
    }
}

// 优化后
let result: Vec<_> = items
    .iter()
    .filter(|item| item.is_valid())
    .map(|item| item.process())
    .collect();
```

## 安全相关 Lint

### 避免 unwrap

```rust
// clippy 警告：unwrap 可能 panic
let value = some_option.unwrap();

// 推荐：使用 expect 或 match
let value = some_option.expect("value should exist");

// 或者
let value = match some_option {
    Some(v) => v,
    None => return Err(AppError::Missing),
};
```

### 避免 panic

```rust
// clippy 警告：可能 panic
let index = vec![1, 2, 3][10];

// 推荐：使用 get
let index = vec![1, 2, 3].get(10);
```

## 代码风格 Lint

### 使用更简洁的语法

```rust
// clippy 建议：使用 if let
match value {
    Some(v) => process(v),
    None => {},
}

// 简化为
if let Some(v) = value {
    process(v);
}

// clippy 建议：使用 while let
loop {
    match iter.next() {
        Some(item) => process(item),
        None => break,
    }
}

// 简化为
while let Some(item) = iter.next() {
    process(item);
}
```

## 常用命令

```bash
# 运行 clippy
cargo clippy

# 运行 clippy 并修复
cargo clippy --fix

# 运行 clippy（更严格）
cargo clippy -- -W clippy::pedantic

# 运行 clippy（包含 nursery）
cargo clippy -- -W clippy::nursery
```

## CI 集成

在 GitHub Actions 中运行 clippy：

```yaml
name: Clippy

on: [push, pull_request]

jobs:
  clippy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: dtolnay/rust-toolchain@stable
        with:
          components: clippy
      - run: cargo clippy -- -D warnings
```

## VS Code 集成

安装 `rust-analyzer` 扩展，clippy 诊断会自动显示：

```json
{
  "rust-analyzer.check.command": "clippy",
  "rust-analyzer.check.allTargets": true
}
```
