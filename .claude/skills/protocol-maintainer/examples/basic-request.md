# 基础请求/响应示例

## 场景：启动 Agent 并发送消息

### 步骤 1：启动 Agent

**Request**

```json
{
  "jsonrpc": "2.0",
  "method": "agent/start",
  "params": {
    "model": "sonnet-4.6",
    "system_prompt": "你是一个 helpful 的编程助手",
    "tools": ["file/read", "file/write", "shell/execute"]
  },
  "id": "1"
}
```

**Response**

```json
{
  "jsonrpc": "2.0",
  "result": {
    "agent_id": "agent-abc123",
    "status": "running"
  },
  "id": "1"
}
```

### 步骤 2：发送用户消息

**Request**

```json
{
  "jsonrpc": "2.0",
  "method": "agent/send",
  "params": {
    "agent_id": "agent-abc123",
    "message": "读取 src/main.rs 并解释其功能"
  },
  "id": "2"
}
```

**Response**

```json
{
  "jsonrpc": "2.0",
  "result": {
    "message_id": "msg-001",
    "status": "accepted"
  },
  "id": "2"
}
```

### 步骤 3：Agent 回复（Notification）

```json
{
  "jsonrpc": "2.0",
  "method": "agent/response",
  "params": {
    "agent_id": "agent-abc123",
    "message_id": "msg-001",
    "content": "main.rs 是程序的入口文件，定义了 main 函数...",
    "is_chunk": false,
    "done": true
  }
}
```

### 步骤 4：停止 Agent

**Request**

```json
{
  "jsonrpc": "2.0",
  "method": "agent/stop",
  "params": {
    "agent_id": "agent-abc123",
    "reason": "任务完成"
  },
  "id": "3"
}
```

**Response**

```json
{
  "jsonrpc": "2.0",
  "result": {
    "agent_id": "agent-abc123",
    "status": "stopped"
  },
  "id": "3"
}
```

---

## 场景：文件操作

### 读取文件

**Request**

```json
{
  "jsonrpc": "2.0",
  "method": "file/read",
  "params": {
    "path": "/src/config.json"
  },
  "id": "10"
}
```

**Response**

```json
{
  "jsonrpc": "2.0",
  "result": {
    "content": "{\n  \"debug\": true,\n  \"port\": 3000\n}",
    "total_lines": 4,
    "truncated": false
  },
  "id": "10"
}
```

### 写入文件

**Request**

```json
{
  "jsonrpc": "2.0",
  "method": "file/write",
  "params": {
    "path": "/src/config.json",
    "content": "{\n  \"debug\": false,\n  \"port\": 8080\n}",
    "create_dirs": true
  },
  "id": "11"
}
```

**Response**

```json
{
  "jsonrpc": "2.0",
  "result": {
    "path": "/src/config.json",
    "bytes_written": 35
  },
  "id": "11"
}
```

---

## 场景：错误处理

### 方法不存在

**Request**

```json
{
  "jsonrpc": "2.0",
  "method": "file/delete",
  "params": {
    "path": "/tmp/test.txt"
  },
  "id": "20"
}
```

**Response**

```json
{
  "jsonrpc": "2.0",
  "error": {
    "code": -32601,
    "message": "Method Not Found",
    "data": {
      "method": "file/delete"
    }
  },
  "id": "20"
}
```

### 参数无效

**Request**

```json
{
  "jsonrpc": "2.0",
  "method": "agent/start",
  "params": {
    "model": "sonnet-4.6"
  },
  "id": "21"
}
```

**Response（缺少必填参数）**

```json
{
  "jsonrpc": "2.0",
  "error": {
    "code": -32602,
    "message": "Invalid Params",
    "data": {
      "reason": "缺少必填参数 'model'"
    }
  },
  "id": "21"
}
```

### 权限不足

**Request**

```json
{
  "jsonrpc": "2.0",
  "method": "shell/execute",
  "params": {
    "command": "rm -rf /"
  },
  "id": "22"
}
```

**Response**

```json
{
  "jsonrpc": "2.0",
  "error": {
    "code": -32001,
    "message": "Permission Denied",
    "data": {
      "tool": "shell/execute",
      "reason": "不允许执行危险命令"
    }
  },
  "id": "22"
}
```
