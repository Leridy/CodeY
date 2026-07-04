# Phase 2.4 Agent Loop 设计文档

> 日期：2026-07-05
> 版本：v1.0.0
> 状态：Phase 2.4 - Agent Loop 实现

## 1. 概述

Phase 2.4 实现 CodeY 的 Agent Loop，即 Agent 的核心对话循环。这是连接用户输入、LLM 调用、工具执行和响应输出的核心模块。

### 1.1 设计目标

| 目标 | 说明 |
|------|------|
| 完整功能 | 支持对话 + 工具调用 + 流式响应 + 上下文管理 |
| 多协议支持 | 同时支持 Function Calling 和 Tool Use |
| 流式传输 | 使用 SSE 实现实时响应 |
| 可扩展 | 工具注册机制，易于添加新工具 |

### 1.2 头脑风暴结果

- **核心功能**: 完整功能（对话 + 工具 + 流式 + 上下文）
- **工具调用**: 两者都支持（Function Calling + Tool Use）
- **流式响应**: 是，使用 SSE 流式传输
- **上下文管理**: 两者都支持（内存 + 数据库持久化）

---

## 2. 核心类型定义

### 2.1 AgentLoop

```rust
/// Agent 核心循环
pub struct AgentLoop {
    /// LLM 提供商
    llm_provider: Arc<dyn LlmProvider>,
    /// 工具注册表
    tool_registry: ToolRegistry,
    /// 权限引擎
    permission_engine: PermissionEngine,
    /// 沙箱管理器
    sandbox_manager: Arc<dyn SandboxManager>,
    /// 当前上下文
    context: Context,
}
```

### 2.2 AgentResponse

```rust
/// Agent 响应
#[derive(Debug, Clone)]
pub struct AgentResponse {
    /// 响应内容
    pub content: String,
    /// 工具调用列表
    pub tool_calls: Vec<ToolCall>,
    /// 流式配置
    pub stream: Option<StreamConfig>,
}
```

### 2.3 ToolRegistry

```rust
/// 工具注册表
pub struct ToolRegistry {
    tools: HashMap<String, Box<dyn Tool>>,
}
```

### 2.4 Tool Trait

```rust
/// 工具 trait
#[async_trait]
pub trait Tool: Send + Sync {
    fn name(&self) -> &str;
    fn description(&self) -> &str;
    fn parameters(&self) -> Value;
    async fn execute(&self, params: Value) -> Result<Value>;
}
```

### 2.5 StreamManager

```rust
/// 流式管理器
pub struct StreamManager {
    sender: Option<mpsc::Sender<StreamChunk>>,
}

/// 流式数据块
#[derive(Debug, Clone)]
pub struct StreamChunk {
    pub content: String,
    pub tool_call: Option<ToolCall>,
}
```

### 2.6 Context

```rust
/// 上下文
#[derive(Debug, Clone)]
pub struct Context {
    pub messages: Vec<Message>,
    pub working_dir: PathBuf,
    pub session_id: String,
}
```

---

## 3. 主循环流程

```
用户输入
    │
    ▼
┌─────────────────┐
│ 添加到上下文     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 调用 LLM        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐    有工具调用    ┌─────────────────┐
│ 解析响应         │──────────────→│ 执行工具         │
└────────┬────────┘               └────────┬────────┘
         │ 无工具调用                       │
         ▼                                 ▼
┌─────────────────┐               ┌─────────────────┐
│ 返回响应         │               │ 添加结果到上下文  │
└─────────────────┘               └────────┬────────┘
                                           │
                                           ▼
                                  ┌─────────────────┐
                                  │ 重新调用 LLM     │
                                  └─────────────────┘
```

---

## 4. 实现计划

### 4.1 Phase 1: 核心类型

- 定义 AgentLoop、AgentResponse、ToolRegistry
- 定义 Tool trait
- 定义 StreamManager、StreamChunk
- 定义 Context

### 4.2 Phase 2: 工具调用适配

- 实现 Function Calling 适配器
- 实现 Tool Use 适配器

### 4.3 Phase 3: 主循环实现

- 实现 AgentLoop::run()
- 实现 process_message()
- 实现 handle_tool_call()

### 4.4 Phase 4: 流式响应

- 实现 StreamManager
- 集成 SSE 传输

### 4.5 Phase 5: 上下文持久化

- 实现内存存储
- 实现数据库持久化

---

*文档版本: v1.0.0*
*最后更新: 2026-07-05*
