# Agent 方法定义

Agent 方法用于管理 Agent 生命周期和通信。

---

## agent/start

启动一个新的 Agent 实例。

| 方向 | 类型 | 说明 |
|------|------|------|
| Request | Request | 客户端 -> 服务端 |

### Params

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| model | string | 是 | LLM 模型标识，如 `sonnet-4.6`、`haiku-4.5`、`opus-4.5` |
| system_prompt | string | 否 | 系统提示词 |
| tools | string[] | 否 | 可用工具列表 |
| config | object | 否 | Agent 配置参数 |

### Result

| 字段 | 类型 | 说明 |
|------|------|------|
| agent_id | string | 唯一 Agent 标识 |
| status | string | 状态，固定为 `running` |

### 示例

```json
// Request
{ "jsonrpc": "2.0", "method": "agent/start", "params": { "model": "sonnet-4.6", "tools": ["file/read", "shell/execute"] }, "id": "1" }
// Response
{ "jsonrpc": "2.0", "result": { "agent_id": "agent-abc123", "status": "running" }, "id": "1" }
```

---

## agent/stop

停止一个运行中的 Agent 实例。

| 方向 | 类型 | 说明 |
|------|------|------|
| Request | Request | 客户端 -> 服务端 |

### Params

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| agent_id | string | 是 | Agent 标识 |
| reason | string | 否 | 停止原因 |

### Result

| 字段 | 类型 | 说明 |
|------|------|------|
| agent_id | string | Agent 标识 |
| status | string | 状态，固定为 `stopped` |

### 示例

```json
// Request
{ "jsonrpc": "2.0", "method": "agent/stop", "params": { "agent_id": "agent-abc123" }, "id": "2" }
// Response
{ "jsonrpc": "2.0", "result": { "agent_id": "agent-abc123", "status": "stopped" }, "id": "2" }
```

---

## agent/send

向 Agent 发送用户消息。

| 方向 | 类型 | 说明 |
|------|------|------|
| Request | Request | 客户端 -> 服务端 |

### Params

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| agent_id | string | 是 | Agent 标识 |
| message | string | 是 | 用户消息内容 |
| context | object[] | 否 | 附加上下文（如文件内容、图片等） |

### Result

| 字段 | 类型 | 说明 |
|------|------|------|
| message_id | string | 消息标识 |
| status | string | 状态，固定为 `accepted` |

### 示例

```json
{ "jsonrpc": "2.0", "method": "agent/send", "params": { "agent_id": "agent-abc123", "message": "读取 src/main.rs 并解释其功能" }, "id": "3" }
```

---

## agent/cancel

取消 Agent 当前正在执行的操作。

| 方向 | 类型 | 说明 |
|------|------|------|
| Request | Request | 客户端 -> 服务端 |

### Params

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| agent_id | string | 是 | Agent 标识 |
| message_id | string | 否 | 要取消的特定消息 ID，不填则取消当前操作 |

### Result

| 字段 | 类型 | 说明 |
|------|------|------|
| agent_id | string | Agent 标识 |
| cancelled | boolean | 是否成功取消 |

---

## agent/response

Agent 回复消息（Notification，服务端 -> 客户端）。

| 方向 | 类型 | 说明 |
|------|------|------|
| Notification | Notification | 服务端 -> 客户端，无 id |

### Params

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| agent_id | string | 是 | Agent 标识 |
| message_id | string | 是 | 关联的消息 ID |
| content | string | 是 | 回复内容 |
| is_chunk | boolean | 否 | 是否为流式分片（默认 false） |
| done | boolean | 否 | 是否为最后一片（默认 false） |

### 示例

```json
{ "jsonrpc": "2.0", "method": "agent/response", "params": { "agent_id": "agent-abc123", "message_id": "msg-001", "content": "main.rs 定义了程序入口...", "is_chunk": false, "done": true } }
```

---

## agent/tool_call

Agent 请求调用工具（Notification，服务端 -> 客户端）。

| 方向 | 类型 | 说明 |
|------|------|------|
| Notification | Notification | 服务端 -> 客户端 |

### Params

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| agent_id | string | 是 | Agent 标识 |
| call_id | string | 是 | 工具调用标识 |
| tool | string | 是 | 工具名称，如 `file/read` |
| arguments | object | 是 | 工具参数 |

### 示例

```json
{ "jsonrpc": "2.0", "method": "agent/tool_call", "params": { "agent_id": "agent-abc123", "call_id": "call-001", "tool": "file/read", "arguments": { "path": "/src/main.rs" } } }
```

---

## agent/tool_result

工具执行结果返回给 Agent（Notification，客户端 -> 服务端）。

| 方向 | 类型 | 说明 |
|------|------|------|
| Notification | Notification | 客户端 -> 服务端 |

### Params

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| agent_id | string | 是 | Agent 标识 |
| call_id | string | 是 | 关联的工具调用 ID |
| result | any | 是 | 工具执行结果 |
| error | string | 否 | 如果执行失败，错误信息 |

---

## agent/error

Agent 错误通知（Notification，服务端 -> 客户端）。

| 方向 | 类型 | 说明 |
|------|------|------|
| Notification | Notification | 服务端 -> 客户端 |

### Params

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| agent_id | string | 是 | Agent 标识 |
| code | number | 是 | 错误码 |
| message | string | 是 | 错误描述 |
| data | object | 否 | 附加错误数据 |

---

## agent/approval

Agent 请求用户审批（Notification，服务端 -> 客户端）。

| 方向 | 类型 | 说明 |
|------|------|------|
| Notification | Notification | 服务端 -> 客户端 |

### Params

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| agent_id | string | 是 | Agent 标识 |
| approval_id | string | 是 | 审批请求标识 |
| tool | string | 是 | 需要审批的工具 |
| arguments | object | 是 | 工具参数 |
| reason | string | 否 | 需要审批的原因 |

### 示例

```json
{ "jsonrpc": "2.0", "method": "agent/approval", "params": { "agent_id": "agent-abc123", "approval_id": "appr-001", "tool": "shell/execute", "arguments": { "command": "rm -rf /tmp/cache" }, "reason": "将删除临时缓存目录" } }
```

---

## agent/approval_response

客户端对审批请求的响应（Notification，客户端 -> 服务端）。

| 方向 | 类型 | 说明 |
|------|------|------|
| Notification | Notification | 客户端 -> 服务端 |

### Params

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| agent_id | string | 是 | Agent 标识 |
| approval_id | string | 是 | 审批请求标识 |
| approved | boolean | 是 | 是否批准 |
| reason | string | 否 | 拒绝原因（approved=false 时） |
