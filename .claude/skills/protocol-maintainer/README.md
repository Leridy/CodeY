# CodeY Agent Protocol 规范

## 概述

CodeY Agent Protocol 是基于 JSON-RPC 2.0 的通信协议，用于 Claude Code Agent 与客户端之间的交互。

### 协议属性

| 属性 | 值 |
|------|-----|
| 协议名称 | CodeY Agent Protocol |
| 协议版本 | v1.0.0 |
| 传输格式 | JSON-RPC 2.0 |
| 通信模式 | Request / Response + Notification |
| 字符编码 | UTF-8 |
| 最大消息大小 | 4MB |

### JSON-RPC 2.0 基础结构

```json
// Request
{
  "jsonrpc": "2.0",
  "method": "agent/start",
  "params": { "model": "sonnet-4.6" },
  "id": "req-001"
}

// Response (成功)
{
  "jsonrpc": "2.0",
  "result": { "agent_id": "agent-abc123", "status": "running" },
  "id": "req-001"
}

// Response (错误)
{
  "jsonrpc": "2.0",
  "error": { "code": -32000, "message": "Agent Error", "data": {} },
  "id": "req-001"
}

// Notification（无 id，不期望响应）
{
  "jsonrpc": "2.0",
  "method": "agent/response",
  "params": { "agent_id": "agent-abc123", "chunk": "Hello" }
}
```

---

## 方法分类

### Agent 方法

Agent 方法用于管理 Agent 生命周期和通信。

| 方法 | 类型 | 说明 |
|------|------|------|
| [agent/start](./dictionary/agent-methods.md#agentstart) | Request | 启动 Agent 实例 |
| [agent/stop](./dictionary/agent-methods.md#agentstop) | Request | 停止 Agent 实例 |
| [agent/send](./dictionary/agent-methods.md#agentsend) | Request | 发送用户消息 |
| [agent/cancel](./dictionary/agent-methods.md#agentcancel) | Request | 取消当前操作 |
| [agent/response](./dictionary/agent-methods.md#agentresponse) | Notification | Agent 回复消息（支持流式） |
| [agent/tool_call](./dictionary/agent-methods.md#agenttool_call) | Notification | Agent 请求工具调用 |
| [agent/tool_result](./dictionary/agent-methods.md#agenttool_result) | Notification | 工具执行结果返回 |
| [agent/error](./dictionary/agent-methods.md#agenterror) | Notification | Agent 错误通知 |
| [agent/approval](./dictionary/agent-methods.md#agentapproval) | Notification | 请求用户审批 |
| [agent/approval_response](./dictionary/agent-methods.md#agentapproval_response) | Notification | 审批响应 |

### File 方法

File 方法用于文件系统操作。

| 方法 | 类型 | 说明 |
|------|------|------|
| [file/read](./dictionary/file-methods.md#fileread) | Request | 读取文件内容 |
| [file/write](./dictionary/file-methods.md#filewrite) | Request | 写入文件 |
| [file/edit](./dictionary/file-methods.md#fileedit) | Request | 编辑文件（局部替换） |
| [file/search](./dictionary/file-methods.md#filesearch) | Request | 搜索文件内容 |
| [file/list](./dictionary/file-methods.md#filelist) | Request | 列出目录内容 |

### Shell 方法

Shell 方法用于执行命令行操作。

| 方法 | 类型 | 说明 |
|------|------|------|
| [shell/execute](./dictionary/shell-methods.md#shellexecute) | Request | 执行 Shell 命令 |
| [shell/output](./dictionary/shell-methods.md#shelloutput) | Notification | 进程输出流 |
| [shell/exit](./dictionary/shell-methods.md#shellexit) | Notification | 进程退出通知 |
| [shell/kill](./dictionary/shell-methods.md#shellkill) | Request | 终止进程 |

### Permission 方法

Permission 方法用于权限管理。

| 方法 | 类型 | 说明 |
|------|------|------|
| [permission/check](./dictionary/permission-methods.md#permissioncheck) | Request | 检查权限 |
| [permission/request](./dictionary/permission-methods.md#permissionrequest) | Notification | 请求授权 |
| [permission/grant](./dictionary/permission-methods.md#permissiongrant) | Notification | 授予权限 |

---

## 错误码参考

### 标准 JSON-RPC 2.0 错误码

| 错误码 | 名称 | 说明 |
|--------|------|------|
| -32700 | Parse Error | JSON 解析失败 |
| -32600 | Invalid Request | 请求格式无效 |
| -32601 | Method Not Found | 方法不存在 |
| -32602 | Invalid Params | 参数无效 |
| -32603 | Internal Error | 内部错误 |

### CodeY 扩展错误码

| 错误码 | 名称 | 说明 | retryable |
|--------|------|------|-----------|
| -32000 | Agent Error | Agent 运行时错误 | false |
| -32001 | Permission Denied | 权限不足 | false |
| -32002 | Tool Error | 工具执行失败 | 视情况 |
| -32003 | LLM Error | LLM 调用失败 | true |
| -32004 | Timeout | 操作超时 | true |
| -32005 | Rate Limit Exceeded | 请求频率超限 | true |
| -32006 | Resource Exhausted | 资源耗尽 | false |
| -32007 | State Conflict | 状态冲突 | false |
| -32008 | Validation Error | 数据验证失败 | false |
| -32009 | Transport Error | 传输层错误 | true |

详细错误码信息请参考：
- [error-codes.md](./dictionary/error-codes.md) - 错误码速查
- [error-handling/error-codes.md](./error-handling/error-codes.md) - 完整错误码定义（Phase 1）
- [error-handling/recovery.md](./error-handling/recovery.md) - 错误恢复机制

---

## 传输层

Phase 1 支持 4 种传输方式：

### Tauri IPC

用于桌面应用内部通信（Frontend WebView <-> Backend Rust）。

详见 [transport/tauri-ipc.md](./transport/tauri-ipc.md)

### WebSocket

用于 Web 端双向实时通信，支持全双工。

详见 [transport/websocket.md](./transport/websocket.md)

### HTTP POST

用于请求/响应模式的简单操作。

详见 [transport/http-post.md](./transport/http-post.md)

### SSE

用于服务端单向流式推送。

详见 [transport/sse.md](./transport/sse.md)

---

## 流式支持

### SSE 流式

用于 Agent 响应和 Shell 输出的实时推送。

详见 [streaming/sse-streaming.md](./streaming/sse-streaming.md)

### WebSocket 流式

用于需要双向实时通信的流式场景。

详见 [streaming/websocket-streaming.md](./streaming/websocket-streaming.md)

---

## 消息格式

### Request 格式

```json
{
  "jsonrpc": "2.0",
  "method": "<category>/<action>",
  "params": { ... },
  "id": "<request_id>"
}
```

### Response 格式（成功）

```json
{
  "jsonrpc": "2.0",
  "result": { ... },
  "id": "<request_id>"
}
```

### Response 格式（错误）

```json
{
  "jsonrpc": "2.0",
  "error": {
    "code": <error_code>,
    "message": "<error_message>",
    "data": { ... }
  },
  "id": "<request_id>"
}
```

### Notification 格式

```json
{
  "jsonrpc": "2.0",
  "method": "<category>/<action>",
  "params": { ... }
}
```

---

## 版本管理

### 版本格式

采用 Semantic Versioning：`vMAJOR.MINOR.PATCH`

| 变更类型 | 版本递增 | 示例 |
|----------|----------|------|
| 新增 method（向后兼容） | MINOR | v1.0.0 -> v1.1.0 |
| 新增可选参数（向后兼容） | MINOR | v1.1.0 -> v1.2.0 |
| 新增必填参数（不兼容） | MAJOR | v1.2.0 -> v2.0.0 |
| 删除 method（不兼容） | MAJOR | v2.0.0 -> v3.0.0 |
| 修正文档错误 | PATCH | v1.0.0 -> v1.0.1 |

### 版本协商

客户端在首次连接时通过 `protocol/handshake` 方法协商版本：

```json
// Request
{ "jsonrpc": "2.0", "method": "protocol/handshake", "params": { "version": "1.0.0", "client": "CodeY-CLI/2.0" }, "id": "0" }

// Response
{ "jsonrpc": "2.0", "result": { "version": "1.0.0", "server": "CodeY-Agent/1.0", "methods": [...] }, "id": "0" }
```

### 兼容性规则

- MAJOR 版本不同：不兼容，必须升级客户端
- MINOR 版本不同：向后兼容，客户端可忽略未知 method
- PATCH 版本不同：完全兼容

---

## 扩展性指南

### 新增 Method 的流程

1. 确定 method 命名：`<category>/<action>`（如 `git/commit`）
2. 定义 Params schema（使用 JSON Schema 格式）
3. 定义 Result schema
4. 确定是否为 Request 或 Notification
5. 在协议字典中添加完整条目
6. 递增 MINOR 版本号
7. 更新 CHANGELOG

### 新增 Category 的流程

1. 确定 category 名称（如 `git`、`database`、`network`）
2. 定义该 category 下的 method 集合
3. 确保 method 命名一致：`<category>/<verb>`
4. 在协议字典中添加新章节
5. 递增 MINOR 版本号

### 新增错误码的流程

1. 确定错误码范围（-32000 到 -32099 保留给 CodeY 扩展）
2. 命名规范：大写下划线分隔（如 `AGENT_CRASHED`）
3. 在错误码参考中添加条目
4. 递增 PATCH 版本号

---

## 变更日志

### v1.0.0 (2026-07-05)

- 初始版本
- 定义 Agent 方法族（10 个 method）
- 定义 File 方法族（5 个 method）
- 定义 Shell 方法族（4 个 method）
- 定义 Permission 方法族（3 个 method）
- 定义 15 个错误码（5 个标准 + 10 个扩展）
- 支持 JSON-RPC 2.0 Request/Response 和 Notification 模式
- 支持 4 种传输方式：Tauri IPC、WebSocket、HTTP POST、SSE
- 支持 SSE 和 WebSocket 流式传输
- 定义错误恢复机制（自动重试、降级策略、状态恢复）

---

*协议版本：v1.0.0*
*创建日期：2026-07-05*
