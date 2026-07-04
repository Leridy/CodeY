# Phase 1 设计文档

> 日期：2026-07-05
> 版本：v1.0.0
> 状态：Phase 1 - 核心协议实现

## 1. 概述

Phase 1 聚焦于 CodeY Agent Protocol 的核心功能实现，覆盖 Agent 生命周期管理、文件系统操作、Shell 命令执行三大模块。本阶段采用 TDD 驱动开发，确保协议实现的可靠性和可测试性。

### 1.1 Phase 1 范围

| 模块 | 方法数 | 说明 |
|------|--------|------|
| Agent 方法 | 10 | 启动/停止/发送/响应/工具调用/审批 |
| File 方法 | 5 | 读/写/编辑/搜索/列表 |
| Shell 方法 | 4 | 执行/输出/退出/终止 |
| 合计 | 19 | 核心协议方法 |

### 1.2 设计原则

- **JSON-RPC 2.0 严格兼容**：所有消息遵循 JSON-RPC 2.0 规范
- **无状态传输**：每个请求独立处理
- **双向通信**：Request/Response + Notification 模式
- **流式优先**：原生支持 SSE 和 WebSocket 流式传输
- **可扩展性**：method namespace 机制支持平滑扩展

---

## 2. 协议范围

### 2.1 JSON-RPC 2.0 基础

所有消息基于 JSON-RPC 2.0 规范：

```json
// Request
{
  "jsonrpc": "2.0",
  "method": "<category>/<action>",
  "params": { ... },
  "id": "<request_id>"
}

// Response (成功)
{
  "jsonrpc": "2.0",
  "result": { ... },
  "id": "<request_id>"
}

// Response (错误)
{
  "jsonrpc": "2.0",
  "error": {
    "code": <error_code>,
    "message": "<error_message>",
    "data": { ... }
  },
  "id": "<request_id>"
}

// Notification（无 id，不期望响应）
{
  "jsonrpc": "2.0",
  "method": "<category>/<action>",
  "params": { ... }
}
```

### 2.2 Agent 模块

Agent 模块管理 AI Agent 的完整生命周期：

| 方法 | 类型 | 方向 | 说明 |
|------|------|------|------|
| `agent/start` | Request | Client -> Server | 启动 Agent 实例 |
| `agent/stop` | Request | Client -> Server | 停止 Agent 实例 |
| `agent/send` | Request | Client -> Server | 发送用户消息 |
| `agent/cancel` | Request | Client -> Server | 取消当前操作 |
| `agent/response` | Notification | Server -> Client | Agent 回复（支持流式 chunk） |
| `agent/tool_call` | Notification | Server -> Client | Agent 请求工具调用 |
| `agent/tool_result` | Notification | Client -> Server | 工具执行结果 |
| `agent/error` | Notification | Server -> Client | 错误通知 |
| `agent/approval` | Notification | Server -> Client | 请求审批 |
| `agent/approval_response` | Notification | Client -> Server | 审批响应 |

### 2.3 File 模块

File 模块提供文件系统操作：

| 方法 | 类型 | 说明 |
|------|------|------|
| `file/read` | Request | 读取文件内容（支持 offset/limit 分页） |
| `file/write` | Request | 写入文件（创建或覆盖） |
| `file/edit` | Request | 增量编辑（局部替换） |
| `file/search` | Request | 正则搜索文件内容 |
| `file/list` | Request | 列出目录内容 |

### 2.4 Shell 模块

Shell 模块提供命令行执行能力：

| 方法 | 类型 | 说明 |
|------|------|------|
| `shell/execute` | Request | 执行 Shell 命令 |
| `shell/output` | Notification | 进程输出流（stdout/stderr） |
| `shell/exit` | Notification | 进程退出通知 |
| `shell/kill` | Request | 终止进程 |

---

## 3. 错误处理

### 3.1 基础错误码

标准 JSON-RPC 2.0 错误码：

| 错误码 | 名称 | 说明 |
|--------|------|------|
| -32700 | Parse Error | JSON 解析失败 |
| -32600 | Invalid Request | 请求格式无效 |
| -32601 | Method Not Found | 方法不存在 |
| -32602 | Invalid Params | 参数无效 |
| -32603 | Internal Error | 内部错误 |

### 3.2 CodeY 扩展错误码

| 错误码 | 名称 | 说明 |
|--------|------|------|
| -32000 | Agent Error | Agent 运行时错误 |
| -32001 | Permission Denied | 权限不足 |
| -32002 | Tool Error | 工具执行失败 |
| -32003 | LLM Error | LLM 调用失败 |
| -32004 | Timeout | 操作超时 |
| -32005 | Rate Limit Exceeded | 请求频率超限 |
| -32006 | Resource Exhausted | 资源耗尽 |
| -32007 | State Conflict | 状态冲突 |
| -32008 | Validation Error | 数据验证失败 |
| -32009 | Transport Error | 传输层错误 |

### 3.3 完整错误处理机制

#### 错误响应格式

```json
{
  "jsonrpc": "2.0",
  "error": {
    "code": -32002,
    "message": "Tool Error",
    "data": {
      "tool": "file/read",
      "reason": "文件不存在: /path/to/file",
      "retryable": false,
      "suggestion": "请检查文件路径是否正确"
    }
  },
  "id": "req-001"
}
```

#### 错误字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| code | number | 是 | 错误码 |
| message | string | 是 | 错误名称 |
| data | object | 否 | 附加错误数据 |
| data.reason | string | 否 | 具体原因 |
| data.retryable | boolean | 否 | 是否可重试 |
| data.suggestion | string | 否 | 建议操作 |

### 3.4 错误恢复机制

#### 自动重试策略

```
重试条件：
- 错误码为 -32004 (Timeout) 或 -32003 (LLM Error)
- retryable 标记为 true
- 未超过最大重试次数（默认 3 次）

重试间隔：
- 第 1 次：1 秒
- 第 2 次：2 秒
- 第 3 次：4 秒
（指数退避策略）
```

#### 降级策略

```
LLM Error (-32003) 降级路径：
1. 重试当前模型
2. 切换到备用模型（如 sonnet-4.6 -> haiku-4.5）
3. 返回错误给用户

Tool Error (-32002) 降级路径：
1. 重试工具调用
2. 返回错误给 Agent，请求替代方案
3. 通知用户手动干预
```

#### 状态恢复

```
Agent 崩溃恢复：
1. 检测 agent/error 通知
2. 保存当前对话上下文
3. 尝试 agent/start 重启
4. 恢复上下文继续对话
5. 失败则通知用户
```

---

## 4. 流式支持

### 4.1 SSE（Server-Sent Events）

SSE 用于单向流式推送，适合 Agent 响应和命令输出：

```
GET /api/v1/stream?agent_id=agent-abc123

Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive

data: {"jsonrpc":"2.0","method":"agent/response","params":{"content":"Hello","is_chunk":true,"done":false}}

data: {"jsonrpc":"2.0","method":"agent/response","params":{"content":" World","is_chunk":true,"done":false}}

data: {"jsonrpc":"2.0","method":"agent/response","params":{"content":"!","is_chunk":false,"done":true}}
```

#### SSE 事件格式

```
event: <event_type>
data: <json_rpc_message>
id: <event_id>
retry: <reconnect_interval_ms>
```

#### 事件类型

| event_type | 说明 |
|------------|------|
| agent/response | Agent 回复消息 |
| shell/output | Shell 输出 |
| agent/error | 错误通知 |
| heartbeat | 心跳保活 |

### 4.2 WebSocket

WebSocket 用于双向实时通信：

```
ws://localhost:PORT/api/v1/ws

// 客户端 -> 服务端
{"jsonrpc":"2.0","method":"agent/send","params":{"agent_id":"agent-abc123","message":"Hello"},"id":"1"}

// 服务端 -> 客户端
{"jsonrpc":"2.0","method":"agent/response","params":{"agent_id":"agent-abc123","content":"Hi!","is_chunk":false,"done":true}}
```

#### WebSocket 帧类型

| 帧类型 | 说明 |
|--------|------|
| Text Frame | JSON-RPC 消息 |
| Ping/Pong | 心跳保活 |
| Close | 连接关闭 |

---

## 5. 传输层

### 5.1 Tauri IPC

Tauri IPC 用于桌面应用内部通信：

```
┌──────────────┐                    ┌──────────────┐
│   Frontend   │  ── Tauri IPC ──>  │   Backend    │
│   (WebView)  │  <-- Tauri IPC ──  │   (Rust)     │
└──────────────┘                    └──────────────┘
```

#### 调用方式

```typescript
// Frontend (TypeScript)
import { invoke } from '@tauri-apps/api/core';

const result = await invoke('jsonrpc_handler', {
  request: {
    jsonrpc: '2.0',
    method: 'file/read',
    params: { path: '/src/main.rs' },
    id: '1'
  }
});
```

```rust
// Backend (Rust)
#[tauri::command]
async fn jsonrpc_handler(request: JsonRpcRequest) -> Result<JsonRpcResponse, JsonRpcError> {
    handle_request(request).await
}
```

### 5.2 WebSocket

WebSocket 用于 Web 端双向通信：

```
连接建立流程：
1. 客户端发起 WebSocket 连接
2. 服务端接受连接
3. 双方交换 protocol/handshake
4. 开始 JSON-RPC 消息交换
5. 心跳保活（30 秒间隔）
6. 任一方发起关闭
```

#### 消息格式

所有 WebSocket 消息使用 Text Frame，内容为 JSON-RPC 2.0 JSON 字符串。

### 5.3 HTTP POST

HTTP POST 用于请求/响应模式：

```
POST /api/v1/rpc
Content-Type: application/json

{
  "jsonrpc": "2.0",
  "method": "file/read",
  "params": { "path": "/src/main.rs" },
  "id": "1"
}
```

#### 批量请求

```json
// 批量请求
[
  {"jsonrpc":"2.0","method":"file/read","params":{"path":"/a.rs"},"id":"1"},
  {"jsonrpc":"2.0","method":"file/read","params":{"path":"/b.rs"},"id":"2"}
]

// 批量响应
[
  {"jsonrpc":"2.0","result":{"content":"..."},"id":"1"},
  {"jsonrpc":"2.0","result":{"content":"..."},"id":"2"}
]
```

### 5.4 SSE

SSE 用于服务端单向推送：

```
GET /api/v1/events?agent_id=agent-abc123

// 响应头
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
X-Accel-Buffering: no
```

---

## 6. 测试策略

### 6.1 TDD 工作流

```
Phase 1 TDD 流程：

1. RED（编写失败测试）
   - 定义接口行为
   - 编写测试用例
   - 运行测试，确认失败

2. GREEN（最小实现）
   - 编写最小代码使测试通过
   - 不做额外优化
   - 运行测试，确认通过

3. REFACTOR（重构优化）
   - 优化代码结构
   - 提取公共逻辑
   - 运行测试，确认无回归
```

### 6.2 测试层次

| 层次 | 覆盖范围 | 工具 |
|------|----------|------|
| Unit | 单个方法/函数 | `#[cfg(test)]`, `cargo test` |
| Integration | 模块间交互 | `tests/` 目录, `cargo test --test` |
| E2E | 完整流程 | Tauri test harness, Playwright |

### 6.3 覆盖率目标

| 模块 | 目标覆盖率 |
|------|------------|
| 协议解析 | 95% |
| 方法路由 | 90% |
| Agent 方法 | 85% |
| File 方法 | 85% |
| Shell 方法 | 85% |
| 错误处理 | 90% |
| 传输层 | 80% |
| **总计** | **85%** |

### 6.4 测试用例设计原则

1. **边界条件**：空值、超长字符串、特殊字符
2. **错误路径**：无效参数、权限不足、资源不存在
3. **并发场景**：多个 Agent 同时操作
4. **流式场景**：中断、重连、乱序
5. **超时场景**：LLM 超时、工具超时

---

## 7. 实施计划

### Phase 1 里程碑

| 里程碑 | 目标 | 交付物 |
|--------|------|--------|
| M1.1 | 协议解析 | JSON-RPC 2.0 parser + serializer |
| M1.2 | 方法路由 | Method router + dispatcher |
| M1.3 | Agent 方法 | agent/start, stop, send, response |
| M1.4 | File 方法 | file/read, write, edit, search, list |
| M1.5 | Shell 方法 | shell/execute, output, exit, kill |
| M1.6 | 错误处理 | Error codes + recovery |
| M1.7 | 传输层 | Tauri IPC + WebSocket + HTTP |
| M1.8 | 流式支持 | SSE + WebSocket streaming |
| M1.9 | 集成测试 | E2E test suite |
| M1.10 | 文档完善 | API spec + examples |

---

## 8. 依赖关系

```
Phase 1 依赖图：

┌─────────────────┐
│ JSON-RPC Parser │
└────────┬────────┘
         │
    ┌────┴────┐
    │ Method  │
    │ Router  │
    └────┬────┘
         │
    ┌────┴────────────────────────────┐
    │                                  │
    ▼                                  ▼
┌─────────┐  ┌─────────┐  ┌─────────┐
│  Agent  │  │  File   │  │  Shell  │
│ Methods │  │ Methods │  │ Methods │
└────┬────┘  └────┬────┘  └────┬────┘
     │            │            │
     └────────────┼────────────┘
                  │
                  ▼
         ┌───────────────┐
         │ Error Handler │
         └───────┬───────┘
                 │
    ┌────────────┼────────────┐
    │            │            │
    ▼            ▼            ▼
┌────────┐ ┌──────────┐ ┌────────┐
│ Tauri  │ │ WebSocket│ │ HTTP   │
│  IPC   │ │          │ │ POST   │
└────────┘ └──────────┘ └────────┘
                 │
                 ▼
         ┌───────────────┐
         │SSE Streaming  │
         └───────────────┘
```

---

*Phase 1 设计文档 v1.0.0*
*创建日期：2026-07-05*
