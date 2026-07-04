# 完整错误码定义

> 版本：v1.0.0
> 日期：2026-07-05

## 1. 概述

本文档定义 CodeY Agent Protocol 的完整错误码体系，包括标准 JSON-RPC 2.0 错误码和 CodeY 扩展错误码。

### 1.1 错误码范围

| 范围 | 用途 | 说明 |
|------|------|------|
| -32700 到 -32600 | JSON-RPC 2.0 标准 | 协议级错误 |
| -32000 到 -32099 | CodeY 扩展 | 应用级错误 |
| -32100 到 -32199 | 第三方扩展 | 厂商自定义 |
| -32200 到 -32299 | 内部实验性 | 实验功能 |

---

## 2. 标准 JSON-RPC 2.0 错误码

### 2.1 -32700 Parse Error

**名称**：JSON 解析失败
**说明**：请求的 JSON 格式无效，无法解析

**触发场景**：
- 发送了无效的 JSON 字符串
- JSON 编码错误
- 消息被截断

**响应示例**：
```json
{
  "jsonrpc": "2.0",
  "error": {
    "code": -32700,
    "message": "Parse Error",
    "data": {
      "reason": "Invalid JSON: unexpected token at position 15"
    }
  },
  "id": null
}
```

---

### 2.2 -32600 Invalid Request

**名称**：请求格式无效
**说明**：请求不符合 JSON-RPC 2.0 规范

**触发场景**：
- 缺少 `jsonrpc` 字段
- `jsonrpc` 值不是 `"2.0"`
- 缺少 `method` 字段

**响应示例**：
```json
{
  "jsonrpc": "2.0",
  "error": {
    "code": -32600,
    "message": "Invalid Request",
    "data": {
      "reason": "Missing required field 'method'"
    }
  },
  "id": "1"
}
```

---

### 2.3 -32601 Method Not Found

**名称**：方法不存在
**说明**：请求的方法在协议中未定义

**触发场景**：
- 调用了未定义的方法
- 方法名拼写错误

**响应示例**：
```json
{
  "jsonrpc": "2.0",
  "error": {
    "code": -32601,
    "message": "Method Not Found",
    "data": {
      "method": "file/delete",
      "suggestion": "Available methods: file/read, file/write, file/edit"
    }
  },
  "id": "1"
}
```

---

### 2.4 -32602 Invalid Params

**名称**：参数无效
**说明**：参数格式错误或缺少必填参数

**触发场景**：
- 缺少必填参数
- 参数类型错误
- 参数值超出范围

**响应示例**：
```json
{
  "jsonrpc": "2.0",
  "error": {
    "code": -32602,
    "message": "Invalid Params",
    "data": {
      "reason": "Missing required parameter: 'path'",
      "required": ["path"],
      "provided": []
    }
  },
  "id": "1"
}
```

---

### 2.5 -32603 Internal Error

**名称**：内部错误
**说明**：服务端内部未捕获的异常

**触发场景**：
- 服务器代码 bug
- 未处理的异常
- 系统资源不足

**响应示例**：
```json
{
  "jsonrpc": "2.0",
  "error": {
    "code": -32603,
    "message": "Internal Error",
    "data": {
      "request_id": "req-abc123",
      "timestamp": "2026-07-05T10:30:00Z"
    }
  },
  "id": "1"
}
```

---

## 3. CodeY 扩展错误码

### 3.1 -32000 Agent Error

**名称**：Agent 运行时错误
**retryable**：false

**触发场景**：Agent 状态异常、资源不足、内部错误

```json
{
  "code": -32000,
  "message": "Agent Error",
  "data": {
    "agent_id": "agent-abc123",
    "reason": "Agent crashed: out of memory",
    "retryable": false
  }
}
```

---

### 3.2 -32001 Permission Denied

**名称**：权限不足
**retryable**：false

**触发场景**：未授权的工具调用、访问受限资源

```json
{
  "code": -32001,
  "message": "Permission Denied",
  "data": {
    "tool": "shell/execute",
    "reason": "不允许执行危险命令",
    "requires_approval": true
  }
}
```

---

### 3.3 -32002 Tool Error

**名称**：工具执行失败
**retryable**：视情况

**触发场景**：文件不存在、命令执行失败

```json
{
  "code": -32002,
  "message": "Tool Error",
  "data": {
    "tool": "file/read",
    "reason": "文件不存在: /path/to/file",
    "retryable": false,
    "suggestion": "请检查文件路径是否正确"
  }
}
```

---

### 3.4 -32003 LLM Error

**名称**：LLM 调用失败
**retryable**：true

**触发场景**：API 超时、Token 耗尽、模型不可用

```json
{
  "code": -32003,
  "message": "LLM Error",
  "data": {
    "provider": "anthropic",
    "model": "sonnet-4.6",
    "reason": "API rate limit exceeded",
    "retry_after": 60
  }
}
```

---

### 3.5 -32004 Timeout

**名称**：操作超时
**retryable**：true

**触发场景**：命令执行超时、网络请求超时

```json
{
  "code": -32004,
  "message": "Timeout",
  "data": {
    "operation": "shell/execute",
    "timeout_ms": 120000,
    "elapsed_ms": 120000
  }
}
```

---

### 3.6 -32005 Rate Limit Exceeded

**名称**：请求频率超限
**retryable**：true

**触发场景**：短时间内发送大量请求

```json
{
  "code": -32005,
  "message": "Rate Limit Exceeded",
  "data": {
    "limit": 100,
    "window": "1m",
    "retry_after": 30
  }
}
```

---

### 3.7 -32006 Resource Exhausted

**名称**：资源耗尽
**retryable**：false

**触发场景**：内存不足、磁盘空间不足

```json
{
  "code": -32006,
  "message": "Resource Exhausted",
  "data": {
    "resource": "memory",
    "reason": "可用内存不足 100MB"
  }
}
```

---

### 3.8 -32007 State Conflict

**名称**：状态冲突
**retryable**：false

**触发场景**：Agent 已停止时发送消息、重复启动

```json
{
  "code": -32007,
  "message": "State Conflict",
  "data": {
    "current_state": "stopped",
    "expected_state": "running",
    "reason": "Agent 已停止，请先启动 Agent"
  }
}
```

---

### 3.9 -32008 Validation Error

**名称**：数据验证失败
**retryable**：false

**触发场景**：路径包含非法字符、内容格式错误

```json
{
  "code": -32008,
  "message": "Validation Error",
  "data": {
    "field": "path",
    "reason": "路径包含非法字符: ../"
  }
}
```

---

### 3.10 -32009 Transport Error

**名称**：传输层错误
**retryable**：true

**触发场景**：连接断开、网络不可达

```json
{
  "code": -32009,
  "message": "Transport Error",
  "data": {
    "transport": "websocket",
    "reason": "连接已断开"
  }
}
```

---

## 4. 错误码速查表

| 错误码 | 名称 | retryable | 分类 |
|--------|------|-----------|------|
| -32700 | Parse Error | false | 协议 |
| -32600 | Invalid Request | false | 协议 |
| -32601 | Method Not Found | false | 协议 |
| -32602 | Invalid Params | false | 协议 |
| -32603 | Internal Error | false | 协议 |
| -32000 | Agent Error | false | 应用 |
| -32001 | Permission Denied | false | 应用 |
| -32002 | Tool Error | 视情况 | 应用 |
| -32003 | LLM Error | true | 应用 |
| -32004 | Timeout | true | 应用 |
| -32005 | Rate Limit Exceeded | true | 应用 |
| -32006 | Resource Exhausted | false | 应用 |
| -32007 | State Conflict | false | 应用 |
| -32008 | Validation Error | false | 应用 |
| -32009 | Transport Error | true | 应用 |

---

## 5. 错误响应格式

```json
{
  "jsonrpc": "2.0",
  "error": {
    "code": <error_code>,
    "message": "<error_name>",
    "data": {
      "reason": "<具体原因>",
      "retryable": <true/false>,
      "suggestion": "<建议操作>"
    }
  },
  "id": "<request_id>"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| code | number | 是 | 错误码 |
| message | string | 是 | 错误名称 |
| data | object | 否 | 附加错误数据 |
| data.reason | string | 否 | 具体原因 |
| data.retryable | boolean | 否 | 是否可重试 |
| data.suggestion | string | 否 | 建议操作 |
| id | string/null | 是 | 关联的请求 ID |

---

*完整错误码定义 v1.0.0*
*创建日期：2026-07-05*
