# 工具调用示例

## 场景：Agent 调用文件读取工具

### 完整流程

#### 1. 发送用户消息

**Request**

```json
{
  "jsonrpc": "2.0",
  "method": "agent/send",
  "params": {
    "agent_id": "agent-abc123",
    "message": "读取 src/main.rs 文件"
  },
  "id": "1"
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
  "id": "1"
}
```

#### 2. Agent 请求工具调用（Notification）

```json
{
  "jsonrpc": "2.0",
  "method": "agent/tool_call",
  "params": {
    "agent_id": "agent-abc123",
    "call_id": "call-001",
    "tool": "file/read",
    "arguments": {
      "path": "/src/main.rs"
    }
  }
}
```

#### 3. 客户端执行工具并返回结果（Notification）

```json
{
  "jsonrpc": "2.0",
  "method": "agent/tool_result",
  "params": {
    "agent_id": "agent-abc123",
    "call_id": "call-001",
    "result": {
      "content": "fn main() {\n    println!(\"Hello, world!\");\n}",
      "total_lines": 3,
      "truncated": false
    }
  }
}
```

#### 4. Agent 回复用户

```json
{
  "jsonrpc": "2.0",
  "method": "agent/response",
  "params": {
    "agent_id": "agent-abc123",
    "message_id": "msg-001",
    "content": "src/main.rs 文件内容如下：\n\n```rust\nfn main() {\n    println!(\"Hello, world!\");\n}\n```\n\n这是一个简单的 Rust 程序，定义了 main 函数并打印 \"Hello, world!\"。",
    "is_chunk": false,
    "done": true
  }
}
```

---

## 场景：Agent 调用 Shell 命令（需要审批）

### 完整流程

#### 1. 发送用户消息

**Request**

```json
{
  "jsonrpc": "2.0",
  "method": "agent/send",
  "params": {
    "agent_id": "agent-abc123",
    "message": "删除 /tmp/cache 目录"
  },
  "id": "2"
}
```

**Response**

```json
{
  "jsonrpc": "2.0",
  "result": {
    "message_id": "msg-002",
    "status": "accepted"
  },
  "id": "2"
}
```

#### 2. Agent 请求审批（Notification）

```json
{
  "jsonrpc": "2.0",
  "method": "agent/approval",
  "params": {
    "agent_id": "agent-abc123",
    "approval_id": "appr-001",
    "tool": "shell/execute",
    "arguments": {
      "command": "rm -rf /tmp/cache"
    },
    "reason": "将删除临时缓存目录"
  }
}
```

#### 3. 客户端审批响应（Notification）

```json
{
  "jsonrpc": "2.0",
  "method": "agent/approval_response",
  "params": {
    "agent_id": "agent-abc123",
    "approval_id": "appr-001",
    "approved": true
  }
}
```

#### 4. Agent 请求工具调用（Notification）

```json
{
  "jsonrpc": "2.0",
  "method": "agent/tool_call",
  "params": {
    "agent_id": "agent-abc123",
    "call_id": "call-002",
    "tool": "shell/execute",
    "arguments": {
      "command": "rm -rf /tmp/cache"
    }
  }
}
```

#### 5. 客户端执行工具并返回结果（Notification）

```json
{
  "jsonrpc": "2.0",
  "method": "agent/tool_result",
  "params": {
    "agent_id": "agent-abc123",
    "call_id": "call-002",
    "result": {
      "process_id": "proc-001",
      "status": "completed",
      "exit_code": 0,
      "stdout": "",
      "stderr": ""
    }
  }
}
```

#### 6. Agent 回复用户

```json
{
  "jsonrpc": "2.0",
  "method": "agent/response",
  "params": {
    "agent_id": "agent-abc123",
    "message_id": "msg-002",
    "content": "已成功删除 /tmp/cache 目录。",
    "is_chunk": false,
    "done": true
  }
}
```

---

## 场景：工具执行失败

### 完整流程

#### 1. 发送用户消息

**Request**

```json
{
  "jsonrpc": "2.0",
  "method": "agent/send",
  "params": {
    "agent_id": "agent-abc123",
    "message": "读取不存在的文件"
  },
  "id": "3"
}
```

**Response**

```json
{
  "jsonrpc": "2.0",
  "result": {
    "message_id": "msg-003",
    "status": "accepted"
  },
  "id": "3"
}
```

#### 2. Agent 请求工具调用（Notification）

```json
{
  "jsonrpc": "2.0",
  "method": "agent/tool_call",
  "params": {
    "agent_id": "agent-abc123",
    "call_id": "call-003",
    "tool": "file/read",
    "arguments": {
      "path": "/nonexistent/file.txt"
    }
  }
}
```

#### 3. 客户端返回错误结果（Notification）

```json
{
  "jsonrpc": "2.0",
  "method": "agent/tool_result",
  "params": {
    "agent_id": "agent-abc123",
    "call_id": "call-003",
    "result": null,
    "error": "文件不存在: /nonexistent/file.txt"
  }
}
```

#### 4. Agent 回复用户（包含错误说明）

```json
{
  "jsonrpc": "2.0",
  "method": "agent/response",
  "params": {
    "agent_id": "agent-abc123",
    "message_id": "msg-003",
    "content": "抱歉，无法读取文件 /nonexistent/file.txt，因为该文件不存在。请检查文件路径是否正确。",
    "is_chunk": false,
    "done": true
  }
}
```

---

## 工具调用参数说明

### agent/tool_call 参数

| 参数 | 类型 | 说明 |
|------|------|------|
| agent_id | string | Agent 标识 |
| call_id | string | 工具调用标识（用于关联结果） |
| tool | string | 工具名称，如 `file/read`、`shell/execute` |
| arguments | object | 工具参数 |

### agent/tool_result 参数

| 参数 | 类型 | 说明 |
|------|------|------|
| agent_id | string | Agent 标识 |
| call_id | string | 关联的工具调用 ID |
| result | any | 工具执行结果（成功时） |
| error | string | 错误信息（失败时） |

---

## 客户端实现示例

```javascript
class ToolCallHandler {
  constructor(agentId) {
    this.agentId = agentId;
    this.pendingCalls = new Map();
  }

  async handleToolCall(params) {
    const { call_id, tool, arguments: args } = params;

    // 记录待处理的调用
    this.pendingCalls.set(call_id, { tool, args });

    try {
      // 执行工具
      const result = await this.executeTool(tool, args);

      // 返回成功结果
      return {
        jsonrpc: "2.0",
        method: "agent/tool_result",
        params: {
          agent_id: this.agentId,
          call_id,
          result
        }
      };
    } catch (error) {
      // 返回错误结果
      return {
        jsonrpc: "2.0",
        method: "agent/tool_result",
        params: {
          agent_id: this.agentId,
          call_id,
          result: null,
          error: error.message
        }
      };
    }
  }

  async executeTool(tool, args) {
    switch (tool) {
      case "file/read":
        return await readFile(args.path);
      case "file/write":
        return await writeFile(args.path, args.content);
      case "shell/execute":
        return await executeCommand(args.command);
      default:
        throw new Error(`未知工具: ${tool}`);
    }
  }
}

// 使用
const handler = new ToolCallHandler("agent-abc123");

ws.on('notification', async (method, params) => {
  if (method === 'agent/tool_call') {
    const result = await handler.handleToolCall(params);
    ws.send(result);
  }
});
```
