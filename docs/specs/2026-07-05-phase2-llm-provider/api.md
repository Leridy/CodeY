# Phase 2.1 LLM Provider API 文档

> 最后更新：2026-07-05
> 版本：0.1.0

---

## LlmProvider Trait API

### 方法列表

#### `id() -> &str`

返回提供商的唯一标识符。

```rust
let provider = OpenAIProvider::new(config);
assert_eq!(provider.id(), "openai");
```

#### `name() -> &str`

返回提供商的显示名称。

```rust
let provider = OpenAIProvider::new(config);
assert_eq!(provider.name(), "OpenAI");
```

#### `chat(request: ChatRequest) -> Result<ChatResponse>`

发送非流式聊天请求。

```rust
let request = ChatRequest {
    model: "gpt-4".to_string(),
    messages: vec![
        Message::user("Hello, how are you?"),
    ],
    tools: None,
    temperature: Some(0.7),
    max_tokens: Some(1000),
    stream: false,
};

let response = provider.chat(request).await?;
println!("Response: {}", response.message.content.unwrap());
println!("Tokens used: {}", response.usage.total_tokens);
```

#### `chat_stream(request: ChatRequest) -> Result<StreamResponse>`

发送流式聊天请求。

```rust
let request = ChatRequest {
    model: "gpt-4".to_string(),
    messages: vec![
        Message::user("Tell me a story"),
    ],
    tools: None,
    temperature: Some(0.7),
    max_tokens: Some(1000),
    stream: true,
};

let mut stream = provider.chat_stream(request).await?;

while let Some(chunk) = stream.next().await {
    match chunk?.delta {
        Delta::Content(text) => print!("{}", text),
        Delta::ToolCall(call) => println!("Tool call: {:?}", call),
        Delta::Done => println!("\n[Done]"),
    }
}
```

#### `models() -> Result<Vec<ModelInfo>>`

获取提供商支持的模型列表。

```rust
let models = provider.models().await?;

for model in models {
    println!("{}: {} (max tokens: {})",
        model.id,
        model.name,
        model.max_tokens.unwrap_or(0)
    );
}
```

#### `health_check() -> Result<bool>`

检查提供商是否可用。

```rust
match provider.health_check().await {
    Ok(true) => println!("Provider is healthy"),
    Ok(false) => println!("Provider is unhealthy"),
    Err(e) => println!("Health check failed: {}", e),
}
```

---

## 核心类型 API

### ChatRequest

```rust
pub struct ChatRequest {
    /// 模型标识
    pub model: String,

    /// 消息列表
    pub messages: Vec<Message>,

    /// 可用工具列表（可选）
    pub tools: Option<Vec<Tool>>,

    /// 温度参数（0.0 - 2.0）
    pub temperature: Option<f64>,

    /// 最大输出 token 数
    pub max_tokens: Option<u32>,

    /// 是否流式输出
    pub stream: bool,
}

impl ChatRequest {
    /// 创建新的请求
    pub fn new(model: impl Into<String>, messages: Vec<Message>) -> Self;

    /// 设置温度
    pub fn with_temperature(mut self, temperature: f64) -> Self;

    /// 设置最大 token 数
    pub fn with_max_tokens(mut self, max_tokens: u32) -> Self;

    /// 添加工具
    pub fn with_tools(mut self, tools: Vec<Tool>) -> Self;

    /// 启用流式输出
    pub fn with_stream(mut self, stream: bool) -> Self;
}
```

### ChatResponse

```rust
pub struct ChatResponse {
    /// 响应 ID
    pub id: String,

    /// 使用的模型
    pub model: String,

    /// 响应消息
    pub message: Message,

    /// Token 使用统计
    pub usage: Usage,
}

pub struct Usage {
    /// 输入 token 数
    pub prompt_tokens: u32,

    /// 输出 token 数
    pub completion_tokens: u32,

    /// 总 token 数
    pub total_tokens: u32,
}
```

### Message

```rust
pub struct Message {
    /// 消息角色
    pub role: Role,

    /// 消息内容
    pub content: Option<String>,

    /// 工具调用列表（assistant 消息）
    pub tool_calls: Option<Vec<ToolCall>>,

    /// 工具调用 ID（tool 消息）
    pub tool_call_id: Option<String>,
}

impl Message {
    /// 创建 system 消息
    pub fn system(content: impl Into<String>) -> Self;

    /// 创建 user 消息
    pub fn user(content: impl Into<String>) -> Self;

    /// 创建 assistant 消息
    pub fn assistant(content: impl Into<String>) -> Self;

    /// 创建 tool 响应消息
    pub fn tool(tool_call_id: impl Into<String>, content: impl Into<String>) -> Self;
}

pub enum Role {
    System,
    User,
    Assistant,
    Tool,
}
```

### Tool

```rust
pub struct Tool {
    /// 工具名称
    pub name: String,

    /// 工具描述
    pub description: String,

    /// 参数 JSON Schema
    pub parameters: serde_json::Value,
}

impl Tool {
    /// 创建新工具
    pub fn new(
        name: impl Into<String>,
        description: impl Into<String>,
        parameters: serde_json::Value,
    ) -> Self;
}
```

### ToolCall

```rust
pub struct ToolCall {
    /// 调用 ID
    pub id: String,

    /// 工具名称
    pub name: String,

    /// 调用参数
    pub arguments: serde_json::Value,
}
```

### StreamChunk

```rust
pub struct StreamChunk {
    /// 块 ID
    pub id: String,

    /// 增量内容
    pub delta: Delta,

    /// 完成原因
    pub finish_reason: Option<String>,
}

pub enum Delta {
    /// 文本内容
    Content(String),

    /// 工具调用增量
    ToolCall(ToolCallDelta),

    /// 流结束
    Done,
}

pub struct ToolCallDelta {
    /// 调用 ID
    pub id: Option<String>,

    /// 工具名称
    pub name: Option<String>,

    /// 参数增量
    pub arguments_delta: Option<String>,
}
```

### ModelInfo

```rust
pub struct ModelInfo {
    /// 模型 ID
    pub id: String,

    /// 模型显示名称
    pub name: String,

    /// 最大 token 数
    pub max_tokens: Option<u32>,

    /// 支持工具调用
    pub supports_tools: bool,

    /// 支持流式输出
    pub supports_streaming: bool,
}
```

---

## ProviderRegistry API

```rust
pub struct ProviderRegistry {
    providers: HashMap<String, Box<dyn LlmProvider>>,
}

impl ProviderRegistry {
    /// 创建新的注册中心
    pub fn new() -> Self;

    /// 注册提供商
    pub fn register(&mut self, provider: Box<dyn LlmProvider>);

    /// 获取提供商
    pub fn get(&self, id: &str) -> Option<&dyn LlmProvider>;

    /// 列出所有提供商 ID
    pub fn list(&self) -> Vec<&str>;

    /// 检查提供商是否存在
    pub fn has(&self, id: &str) -> bool;

    /// 移除提供商
    pub fn remove(&mut self, id: &str) -> Option<Box<dyn LlmProvider>>;

    /// 健康检查所有提供商
    pub async fn health_check_all(&self) -> HashMap<String, bool>;

    /// 获取所有可用提供商
    pub async fn available_providers(&self) -> Vec<&str>;
}
```

### 使用示例

```rust
let mut registry = ProviderRegistry::new();

// 注册提供商
registry.register(Box::new(OpenAIProvider::new(openai_config)));
registry.register(Box::new(AnthropicProvider::new(anthropic_config)));
registry.register(Box::new(OllamaProvider::new(ollama_config)));

// 获取提供商
let openai = registry.get("openai").expect("OpenAI not found");

// 发送请求
let response = openai.chat(request).await?;

// 健康检查
let health = registry.health_check_all().await;
for (id, is_healthy) in &health {
    println!("{}: {}", id, if *is_healthy { "OK" } else { "FAIL" });
}
```

---

## DbProviderLoader API

```rust
pub struct DbProviderLoader {
    db: Database,
}

impl DbProviderLoader {
    /// 创建新的加载器
    pub async fn new(db_path: &str) -> Result<Self>;

    /// 加载所有提供商配置
    pub async fn load_providers(&self) -> Result<Vec<ProviderConfig>>;

    /// 加载指定提供商配置
    pub async fn load_provider(&self, id: &str) -> Result<Option<ProviderConfig>>;

    /// 保存提供商配置
    pub async fn save_provider(&self, config: &ProviderConfig) -> Result<()>;

    /// 删除提供商配置
    pub async fn delete_provider(&self, id: &str) -> Result<()>;

    /// 初始化数据库表
    pub async fn initialize(&self) -> Result<()>;
}
```

### ProviderConfig

```rust
pub struct ProviderConfig {
    /// 提供商 ID
    pub id: String,

    /// 提供商名称
    pub name: String,

    /// 提供商类型
    pub provider_type: ProviderType,

    /// API Key（加密存储）
    pub api_key: Option<String>,

    /// API 基础 URL
    pub api_base: Option<String>,

    /// 默认模型
    pub default_model: Option<String>,

    /// 是否启用
    pub is_enabled: bool,
}

pub enum ProviderType {
    OpenAI,
    Anthropic,
    Ollama,
    Custom(String),
}
```

### 使用示例

```rust
// 初始化数据库
let loader = DbProviderLoader::new("data/providers.db").await?;
loader.initialize().await?;

// 加载配置
let configs = loader.load_providers().await?;

// 创建注册中心
let mut registry = ProviderRegistry::new();

for config in configs {
    if !config.is_enabled {
        continue;
    }

    let provider: Box<dyn LlmProvider> = match config.provider_type {
        ProviderType::OpenAI => Box::new(OpenAIProvider::new(config)),
        ProviderType::Anthropic => Box::new(AnthropicProvider::new(config)),
        ProviderType::Ollama => Box::new(OllamaProvider::new(config)),
        _ => continue,
    };

    registry.register(provider);
}

// 保存新配置
let new_config = ProviderConfig {
    id: "custom-openai".to_string(),
    name: "Custom OpenAI".to_string(),
    provider_type: ProviderType::OpenAI,
    api_key: Some("sk-...".to_string()),
    api_base: Some("https://custom-api.example.com".to_string()),
    default_model: Some("gpt-4".to_string()),
    is_enabled: true,
};

loader.save_provider(&new_config).await?;
```

---

## 各 Provider API

### OpenAI Provider

```rust
pub struct OpenAIProvider {
    config: ProviderConfig,
    client: reqwest::Client,
}

impl OpenAIProvider {
    pub fn new(config: ProviderConfig) -> Self;
}

#[async_trait]
impl LlmProvider for OpenAIProvider {
    fn id(&self) -> &str { "openai" }
    fn name(&self) -> &str { "OpenAI" }

    async fn chat(&self, request: ChatRequest) -> Result<ChatResponse>;
    async fn chat_stream(&self, request: ChatRequest) -> Result<StreamResponse>;
    async fn models(&self) -> Result<Vec<ModelInfo>>;
    async fn health_check(&self) -> Result<bool>;
}
```

### Anthropic Provider

```rust
pub struct AnthropicProvider {
    config: ProviderConfig,
    client: reqwest::Client,
}

impl AnthropicProvider {
    pub fn new(config: ProviderConfig) -> Self;
}

#[async_trait]
impl LlmProvider for AnthropicProvider {
    fn id(&self) -> &str { "anthropic" }
    fn name(&self) -> &str { "Anthropic" }

    async fn chat(&self, request: ChatRequest) -> Result<ChatResponse>;
    async fn chat_stream(&self, request: ChatRequest) -> Result<StreamResponse>;
    async fn models(&self) -> Result<Vec<ModelInfo>>;
    async fn health_check(&self) -> Result<bool>;
}
```

### Ollama Provider

```rust
pub struct OllamaProvider {
    config: ProviderConfig,
    client: reqwest::Client,
}

impl OllamaProvider {
    pub fn new(config: ProviderConfig) -> Self;

    /// 拉取模型
    pub async fn pull_model(&self, model: &str) -> Result<()>;

    /// 列出本地模型
    pub async fn list_local_models(&self) -> Result<Vec<String>>;
}

#[async_trait]
impl LlmProvider for OllamaProvider {
    fn id(&self) -> &str { "ollama" }
    fn name(&self) -> &str { "Ollama" }

    async fn chat(&self, request: ChatRequest) -> Result<ChatResponse>;
    async fn chat_stream(&self, request: ChatRequest) -> Result<StreamResponse>;
    async fn models(&self) -> Result<Vec<ModelInfo>>;
    async fn health_check(&self) -> Result<bool>;
}
```

---

## 完整使用示例

```rust
use codey::llm::{
    ProviderRegistry, DbProviderLoader,
    ChatRequest, Message, Tool,
    providers::{OpenAIProvider, AnthropicProvider},
};

#[tokio::main]
async fn main() -> Result<()> {
    // 1. 初始化数据库加载器
    let loader = DbProviderLoader::new("data/providers.db").await?;
    loader.initialize().await?;

    // 2. 加载配置
    let configs = loader.load_providers().await?;

    // 3. 创建注册中心
    let mut registry = ProviderRegistry::new();

    for config in configs {
        if !config.is_enabled {
            continue;
        }

        let provider = create_provider(config);
        registry.register(provider);
    }

    // 4. 获取提供商
    let openai = registry.get("openai")
        .expect("OpenAI provider not found");

    // 5. 创建请求
    let request = ChatRequest::new("gpt-4", vec![
        Message::system("You are a helpful assistant."),
        Message::user("What is Rust?"),
    ])
    .with_temperature(0.7)
    .with_max_tokens(1000);

    // 6. 发送请求
    let response = openai.chat(request).await?;

    // 7. 处理响应
    println!("Response: {}", response.message.content.unwrap());
    println!("Tokens: {}", response.usage.total_tokens);

    // 8. 流式请求示例
    let stream_request = ChatRequest::new("gpt-4", vec![
        Message::user("Write a poem about Rust"),
    ])
    .with_stream(true);

    let mut stream = openai.chat_stream(stream_request).await?;

    while let Some(chunk) = stream.next().await {
        match chunk?.delta {
            Delta::Content(text) => print!("{}", text),
            Delta::Done => println!("\n[Done]"),
            _ => {}
        }
    }

    Ok(())
}

fn create_provider(config: ProviderConfig) -> Box<dyn LlmProvider> {
    match config.provider_type {
        ProviderType::OpenAI => Box::new(OpenAIProvider::new(config)),
        ProviderType::Anthropic => Box::new(AnthropicProvider::new(config)),
        ProviderType::Ollama => Box::new(OllamaProvider::new(config)),
        _ => panic!("Unsupported provider type"),
    }
}
```

---

## 错误处理

所有 API 方法返回 `Result<T>`，错误类型为 `LlmError`：

```rust
pub enum LlmError {
    /// 网络错误
    Network(reqwest::Error),

    /// API 错误
    Api {
        status: u16,
        message: String,
    },

    /// 认证错误
    Authentication(String),

    /// 配额超限
    RateLimitExceeded,

    /// 模型不存在
    ModelNotFound(String),

    /// 请求格式错误
    InvalidRequest(String),

    /// 流式响应错误
    StreamError(String),

    /// 数据库错误
    Database(sqlx::Error),

    /// 其他错误
    Other(String),
}
```

---

## 配置示例

```json
{
  "providers": [
    {
      "id": "openai",
      "name": "OpenAI",
      "type": "openai",
      "api_key": "sk-...",
      "default_model": "gpt-4",
      "enabled": true
    },
    {
      "id": "anthropic",
      "name": "Anthropic",
      "type": "anthropic",
      "api_key": "sk-ant-...",
      "default_model": "claude-3-5-sonnet",
      "enabled": true
    },
    {
      "id": "ollama",
      "name": "Ollama (Local)",
      "type": "ollama",
      "api_base": "http://localhost:11434",
      "default_model": "llama3",
      "enabled": true
    }
  ]
}
```
