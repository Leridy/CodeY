# rustfmt 配置规范

## 配置文件

创建 `rustfmt.toml`：

```toml
# 基本配置
edition = "2021"
max_width = 100
tab_spaces = 4
use_field_init_shorthand = true
use_try_shorthand = true

# 导入排序
imports_granularity = "Crate"
group_imports = "StdExternalCrate"
reorder_imports = true

# 闭包配置
closure_block_indent_threshold = 0
fn_args_layout = "Tall"

# 控制流配置
single_line_if_else_max_width = 50
single_line_let_else_max_width = 50

# 注释配置
comment_width = 80
normalize_comments = true
wrap_comments = true

# 其他
format_code_in_doc_comments = true
format_strings = true
merge_imports = true
```

## 配置说明

| 选项 | 值 | 说明 |
|------|-----|------|
| `edition` | 2021 | Rust 版本 |
| `max_width` | 100 | 最大行宽 |
| `tab_spaces` | 4 | 缩进空格数 |
| `use_field_init_shorthand` | true | 字段初始化简写 |
| `use_try_shorthand` | true | try! 宏简写 |
| `imports_granularity` | Crate | 导入粒度 |
| `group_imports` | StdExternalCrate | 导入分组 |
| `reorder_imports` | true | 重新排序导入 |
| `normalize_comments` | true | 规范化注释 |
| `wrap_comments` | true | 注释自动换行 |

## 格式化效果示例

### 导入排序

```rust
// 格式化前
use std::collections::HashMap;
use crate::models::User;
use serde::{Deserialize, Serialize};
use tokio::sync::RwLock;

// 格式化后（按 StdExternalCrate 分组）
use std::collections::HashMap;

use serde::{Deserialize, Serialize};
use tokio::sync::RwLock;

use crate::models::User;
```

### 字段初始化简写

```rust
// 格式化前
let user = User {
    name: name,
    email: email,
    age: age,
};

// 格式化后
let user = User {
    name,
    email,
    age,
};
```

### 闭包格式化

```rust
// 格式化前
let result = items.iter().map(|item| { item.process() }).collect();

// 格式化后
let result = items
    .iter()
    .map(|item| item.process())
    .collect();
```

## 常用命令

```bash
# 格式化整个项目
cargo fmt

# 检查格式（不修改）
cargo fmt -- --check

# 格式化特定文件
cargo fmt -- src/main.rs

# 显示格式化差异
cargo fmt -- --diff
```

## 与 CI 集成

在 GitHub Actions 中检查格式：

```yaml
name: Check Formatting

on: [push, pull_request]

jobs:
  fmt:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: dtolnay/rust-toolchain@stable
        with:
          components: rustfmt
      - run: cargo fmt -- --check
```

## IDE 集成

### VS Code

安装 `rust-analyzer` 扩展，配置保存时自动格式化：

```json
{
  "[rust]": {
    "editor.defaultFormatter": "rust-lang.rust-analyzer",
    "editor.formatOnSave": true
  }
}
```

### IntelliJ IDEA

在 `Settings > Languages & Rust > Rustfmt` 中启用 `Run rustfmt on Save`。
