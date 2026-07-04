# Phase 2.4 Agent Loop API 文档

> 日期：2026-07-05
> 版本：v1.0.0

## 1. 核心 API

### 1.1 AgentLoop

```rust
/// Agent 核心循环
pub struct AgentLoop {
    llm_provider: Arc<dyn LlmProvider>,
    tool_registry: ToolRegistry,
    permission_engine: PermissionEngine,
    sandbox_manager: Arc<dyn SandboxManager>,
    context: Context,
}

impl AgentLoop {
    pub fn new(
        llm_provider: Arc<dyn LlmProvider>,
        tool_registry: ToolRegistry,
        permission_engine: PermissionEngine,
        sandbox_manager: Arc<dyn SandboxManager>,
    ) -> Self;

    pub async fn run(&mut self, user_input: &str) -> Result<AgentResponse>;
    pub async fn process_message(&mut self, message: Message) -> Result<AgentResponse>;
    pub async fn handle_tool_call(&mut self, tool_call: ToolCall) -> Result<ToolResult>;
}
```

### 1.2 使用示例

```rust
use codey_core::agent::{AgentLoop, ToolRegistry, Context};
use codey_core::llm::create_llm_provider;
use codey_core::permission::PermissionEngine;
use codey_core::sandbox::create_sandbox_manager;

let llm_provider = create_llm_provider("openai")?;
let tool_registry = ToolRegistry::new();
let permission_engine = PermissionEngine::new(PermissionLevel::ReadWriteExecute);
let sandbox_manager = create_sandbox_manager();

let mut agent = AgentLoop::new(
    llm_provider,
    tool_registry,
    permission_engine,
    sandbox_manager,
);

let response = agent.run("帮我读取 src/main.rs 文件").await?;
println!("响应: {}", response.content);
```

---

## 2. 类型定义

### 2.1 AgentResponse

```rust
#[derive(Debug, Clone)]
pub struct AgentResponse {
    pub content: String,
    pub tool_calls: Vec<ToolCall>,
    pub stream: Option<StreamConfig>,
}
```

### 2.2 ToolRegistry

```rust
pub struct ToolRegistry {
    tools: HashMap<String, Box<dyn Tool>>,
}

impl ToolRegistry {
    pub fn new() -> Self;
    pub fn register(&mut self, tool: Box<dyn Tool>);
    pub fn get(&self, name: &str) -> Option<&dyn Tool>;
    pub fn list(&self) -> Vec<ToolInfo>;
}
```

### 2.3 Tool Trait

```rust
#[async_trait]
pub trait Tool: Send + Sync {
    fn name(&self) -> &str;
    fn description(&self) -> &str;
    fn parameters(&self) -> Value;
    async fn execute(&self, params: Value) -> Result<Value>;
}
```

### 2.4 StreamManager

```rust
pub struct StreamManager {
    sender: Option<mpsc::Sender<StreamChunk>>,
}

#[derive(Debug, Clone)]
pub struct StreamChunk {
    pub content: String,
    pub tool_call: Option<ToolCall>,
}

impl StreamManager {
    pub fn new() -> Self;
    pub fn start_stream(&mut self) -> mpsc::Receiver<StreamChunk>;
    pub async fn send_chunk(&self, chunk: StreamChunk) -> Result<()>;
    pub async fn end_stream(&mut self);
}
```

### 2.5 Context

```rust
#[derive(Debug, Clone)]
pub struct Context {
    pub messages: Vec<Message>,
    pub working_dir: PathBuf,
    pub session_id: String,
}

impl Context {
    pub fn new(working_dir: PathBuf) -> Self;
    pub fn add_message(&mut self, message: Message);
    pub fn get_messages(&self) -> &[Message];
    pub fn clear(&mut self);
}
```

---

## 3. 工具调用适配 API

### 3.1 Function Calling 适配器

```rust
pub struct FunctionCallingAdapter;

impl FunctionCallingAdapter {
    pub fn to_openai_function(tool: &dyn Tool) -> Value;
    pub fn parse_tool_calls(response: &Value) -> Result<Vec<ToolCall>>;
}
```

### 3.2 Tool Use 适配器

```rust
pub struct ToolUseAdapter;

impl ToolUseAdapter {
    pub fn to_anthropic_tool(tool: &dyn Tool) -> Value;
    pub fn parse_tool_use(response: &Value) -> Result<Vec<ToolCall>>;
}
```

---

*API 文档版本: v1.0.0*
*最后更新: 2026-07-05*
