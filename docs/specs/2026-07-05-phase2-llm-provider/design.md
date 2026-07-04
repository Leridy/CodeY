# Phase 2.1 LLM Provider 设计文档

> 最后更新：2026-07-05
> 状态：实现完成，存在已知问题

---

## 概述

LLM Provider 系统为 CodeY 提供统一的大语言模型访问接口，支持多个 LLM 提供商的无缝切换。

### 核心目标

1. **统一接口** - 所有 LLM 提供商实现相同的 trait
2. **流式响应** - 支持 SSE 流式输出
3. **工具调用** - 支持 function calling
4. **可扩展性** - 易于添加新的提供商
5. **数据库配置** - 提供商配置从 SQLite 加载

---

## 核心类型

### LlmProvider Trait

所有 LLM 提供商必须实现的核心 trait：

```rust
#[async_trait]
pub trait LlmProvider: Send + Sync {
    /// 提供商标识
    fn id(&self) -> &str;

    /// 提供商名称
    fn name(&self) -> &str;

    /// 发送聊天请求（非流式）
    async fn chat(&self, request: ChatRequest) -> Result<ChatResponse>;

    /// 发送聊天请求（流式）
    async fn chat_stream(&self, request: ChatRequest) -> Result<StreamResponse>;

    /// 获取支持的模型列表
    async fn models(&self) -> Result<Vec<ModelInfo>>;

    /// 检查提供商是否可用
    async fn health_check(&self) -> Result<bool>;
}
```

### ChatRequest

```rust
pub struct ChatRequest {
    pub model: String,
    pub messages: Vec<Message>,
    pub tools: Option<Vec<Tool>>,
    pub temperature: Option<f64>,
    pub max_tokens: Option<u32>,
    pub stream: bool,
}
```

### ChatResponse

```rust
pub struct ChatResponse {
    pub id: String,
    pub model: String,
    pub message: Message,
    pub usage: Usage,
}

pub struct Usage {
    pub prompt_tokens: u32,
    pub completion_tokens: u32,
    pub total_tokens: u32,
}
```

### Message

```rust
pub struct Message {
    pub role: Role,
    pub content: Option<String>,
    pub tool_calls: Option<Vec<ToolCall>>,
    pub tool_call_id: Option<String>,
}

pub enum Role {
    System,
    User,
    Assistant,
    Tool,
}
```

### Tool 和 ToolCall

```rust
pub struct Tool {
    pub name: String,
    pub description: String,
    pub parameters: serde_json::Value,
}

pub struct ToolCall {
    pub id: String,
    pub name: String,
    pub arguments: serde_json::Value,
}
```

### StreamChunk

```rust
pub struct StreamChunk {
    pub id: String,
    pub delta: Delta,
    pub finish_reason: Option<String>,
}

pub enum Delta {
    Content(String),
    ToolCall(ToolCallDelta),
    Done,
}
```

---

## Provider 实现

### OpenAI Provider

**文件**: `src-tauri/src/llm/providers/openai.rs`

- 支持模型：GPT-4, GPT-4 Turbo, GPT-3.5 Turbo
- API 端点：`https://api.openai.com/v1/chat/completions`
- 支持工具调用
- 支持流式响应

### Anthropic Provider

**文件**: `src-tauri/src/llm/providers/anthropic.rs`

- 支持模型：Claude 3.5 Sonnet, Claude 3 Opus, Claude 3 Haiku
- API 端点：`https://api.anthropic.com/v1/messages`
- 支持工具调用
- 支持流式响应

### Ollama Provider

**文件**: `src-tauri/src/llm/providers/ollama.rs`

- 支持本地模型：Llama 3, Mistral, CodeLlama 等
- API 端点：`http://localhost:11434/api/chat`
- 支持工具调用（取决于模型）
- 支持流式响应

---

## ProviderRegistry

注册中心管理所有已注册的 Provider：

```rust
pub struct ProviderRegistry {
    providers: HashMap<String, Box<dyn LlmProvider>>,
}

impl ProviderRegistry {
    pub fn new() -> Self;
    pub fn register(&mut self, provider: Box<dyn LlmProvider>);
    pub fn get(&self, id: &str) -> Option<&dyn LlmProvider>;
    pub fn list(&self) -> Vec<&str>;
    pub async fn health_check_all(&self) -> HashMap<String, bool>;
}
```

---

## SQLite 数据库加载

### DbProviderLoader

从 SQLite 数据库加载 Provider 配置：

```rust
pub struct DbProviderLoader {
    db: Database,
}

impl DbProviderLoader {
    pub async fn load_providers(&self) -> Result<Vec<ProviderConfig>>;
    pub async fn save_provider(&self, config: &ProviderConfig) -> Result<()>;
    pub async fn delete_provider(&self, id: &str) -> Result<()>;
}
```

### ProviderConfig

```rust
pub struct ProviderConfig {
    pub id: String,
    pub name: String,
    pub provider_type: ProviderType,
    pub api_key: Option<String>,
    pub api_base: Option<String>,
    pub default_model: Option<String>,
    pub is_enabled: bool,
}

pub enum ProviderType {
    OpenAI,
    Anthropic,
    Ollama,
    Custom(String),
}
```

---

## 已知问题

### CRITICAL

1. **流式响应超时未处理**
   - 位置：`src-tauri/src/llm/providers/openai.rs:145`
   - 问题：长时间无响应时未触发超时机制
   - 影响：可能导致连接永久挂起

### HIGH

2. **Anthropic API 版本兼容性**
   - 位置：`src-tauri/src/llm/providers/anthropic.rs:89`
   - 问题：使用了已弃用的 API 版本头
   - 影响：可能导致请求失败

3. **Ollama 工具调用解析错误**
   - 位置：`src-tauri/src/llm/providers/ollama.rs:203`
   - 问题：某些模型的工具调用格式解析失败
   - 影响：工具调用功能不可用

---

## 架构图

```
+----------------------------------------------------------+
|                     LlmProvider Trait                    |
+----------------------------------------------------------+
|     |           |           |           |               |
|     v           v           v           v               |
| +--------+ +----------+ +--------+ +--------+          |
| | OpenAI | |Anthropic | | Ollama | | Custom |          |
| +--------+ +----------+ +--------+ +--------+          |
|     |           |           |           |               |
|     +-----------+-----------+-----------+               |
|                     |                                   |
|                     v                                   |
|            +----------------+                           |
|            |ProviderRegistry|                           |
|            +----------------+                           |
|                     |                                   |
|                     v                                   |
|            +----------------+                           |
|            |DbProviderLoader|                           |
|            +----------------+                           |
|                     |                                   |
|                     v                                   |
|               +----------+                              |
|               |  SQLite  |                              |
|               +----------+                              |
+----------------------------------------------------------+
```

---

## 依赖关系

```toml
[dependencies]
reqwest = { version = "0.11", features = ["json", "stream"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
tokio = { version = "1.0", features = ["full"] }
async-trait = "0.1"
sqlx = { version = "0.7", features = ["sqlite", "runtime-tokio"] }
```

---

## 下一步

1. 修复已知的 3 个 bug
2. 添加更多单元测试
3. 实现 Provider 自动发现
4. 添加请求重试机制
5. 实现模型自动检测
