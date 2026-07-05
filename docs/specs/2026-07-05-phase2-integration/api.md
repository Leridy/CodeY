# Phase 2.5 集成实现 API 文档

> 日期：2026-07-05
> 版本：v1.0.0

## 1. PathValidator API

### 结构体定义

```rust
pub struct PathValidator {
    working_directory: PathBuf,
    allowed_paths: Vec<PathBuf>,
    denied_paths: Vec<PathBuf>,
}
```

### 方法

```rust
impl PathValidator {
    pub fn new(working_directory: PathBuf) -> Self;
    pub fn allow_path(&mut self, path: PathBuf);
    pub fn deny_path(&mut self, path: PathBuf);
    pub fn is_path_allowed(&self, path: &Path) -> bool;
    pub fn resolve_path(&self, path: &str) -> Result<PathBuf>;
}
```

---

## 2. FileExecutor API

### 结构体定义

```rust
pub struct FileExecutor {
    path_validator: Arc<PathValidator>,
}
```

### 方法

```rust
impl FileExecutor {
    pub fn new(path_validator: Arc<PathValidator>) -> Self;
    pub async fn read(&self, path: &str) -> Result<Value>;
    pub async fn write(&self, path: &str, content: &str) -> Result<Value>;
}
```

---

## 3. ShellExecutor API

### 结构体定义

```rust
pub struct ShellExecutor {
    working_directory: PathBuf,
    path_validator: Arc<PathValidator>,
    default_timeout: u64,
}
```

### 方法

```rust
impl ShellExecutor {
    pub fn new(working_directory: PathBuf, path_validator: Arc<PathValidator>) -> Self;
    pub async fn execute(&self, command: &str) -> Result<Value>;
    fn validate_command(&self, command: &str) -> Result<()>;
}
```

---

## 4. ToolOrchestrator 增强 API

### 新增方法

```rust
impl ToolOrchestrator {
    pub fn with_path_validator(self, validator: Arc<PathValidator>) -> Self;
}
```

---

## 5. AnthropicProvider 增强 API

### 请求格式

```json
{
  "model": "claude-sonnet-4-20250514",
  "max_tokens": 4096,
  "messages": [...],
  "tools": [
    {
      "name": "file/read",
      "description": "Read file contents",
      "input_schema": {
        "type": "object",
        "properties": { "path": { "type": "string" } },
        "required": ["path"]
      }
    }
  ]
}
```

### 响应格式

```json
{
  "content": [
    { "type": "text", "text": "I'll read the file." },
    {
      "type": "tool_use",
      "id": "toolu_abc",
      "name": "file/read",
      "input": { "path": "/tmp/test.txt" }
    }
  ],
  "stop_reason": "tool_use"
}
```

---

*API 文档版本: v1.0.0*
*最后更新: 2026-07-05*
