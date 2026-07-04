# 流式响应示例

## 场景：Agent 流式回复

当 Agent 生成较长的回复时，会使用流式分片（chunk）逐步发送内容。

### 完整流程

#### 1. 发送用户消息

**Request**

```json
{
  "jsonrpc": "2.0",
  "method": "agent/send",
  "params": {
    "agent_id": "agent-abc123",
    "message": "详细解释 Rust 的所有权系统"
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

#### 2. 流式回复（多个 Notification）

**第 1 片**

```json
{
  "jsonrpc": "2.0",
  "method": "agent/response",
  "params": {
    "agent_id": "agent-abc123",
    "message_id": "msg-001",
    "content": "Rust 的所有权系统是其最独特的特性之一。",
    "is_chunk": true,
    "done": false
  }
}
```

**第 2 片**

```json
{
  "jsonrpc": "2.0",
  "method": "agent/response",
  "params": {
    "agent_id": "agent-abc123",
    "message_id": "msg-001",
    "content": "它通过编译时检查确保内存安全，无需垃圾回收器。",
    "is_chunk": true,
    "done": false
  }
}
```

**第 3 片**

```json
{
  "jsonrpc": "2.0",
  "method": "agent/response",
  "params": {
    "agent_id": "agent-abc123",
    "message_id": "msg-001",
    "content": "核心规则包括：\n1. 每个值有且只有一个所有者\n2. 所有者离开作用域时，值被丢弃\n3. 可以转移所有权或借用",
    "is_chunk": true,
    "done": false
  }
}
```

**最后一片**

```json
{
  "jsonrpc": "2.0",
  "method": "agent/response",
  "params": {
    "agent_id": "agent-abc123",
    "message_id": "msg-001",
    "content": "\n\n总结：所有权系统让 Rust 在编译时就能保证内存安全，这是它与其他语言最大的区别。",
    "is_chunk": false,
    "done": true
  }
}
```

---

## 流式参数说明

| 参数 | 类型 | 说明 |
|------|------|------|
| is_chunk | boolean | `true` 表示这是流式分片，`false` 表示这是完整消息或最后一片 |
| done | boolean | `true` 表示这是最后一片，流式传输结束 |

### 状态组合

| is_chunk | done | 说明 |
|----------|------|------|
| true | false | 流式分片，还有更多内容 |
| false | true | 最后一片，流式传输结束 |
| false | false | 完整消息（非流式） |

---

## 客户端处理示例

```javascript
class StreamingHandler {
  constructor() {
    this.chunks = [];
    this.isComplete = false;
  }

  handleResponse(params) {
    if (params.is_chunk) {
      // 收集流式分片
      this.chunks.push(params.content);

      // 实时显示内容
      this.displayChunk(params.content);
    }

    if (params.done) {
      // 流式传输完成
      this.isComplete = true;
      const fullContent = this.chunks.join('');
      this.onComplete(fullContent);
    }
  }

  displayChunk(content) {
    // 实时渲染内容
    process.stdout.write(content);
  }

  onComplete(fullContent) {
    console.log('\n\n--- 完整回复 ---');
    console.log(fullContent);
  }
}

// 使用
const handler = new StreamingHandler();

// 监听 agent/response 通知
ws.on('notification', (method, params) => {
  if (method === 'agent/response') {
    handler.handleResponse(params);
  }
});
```

---

## 错误处理

如果流式传输过程中发生错误，会发送 `agent/error` 通知：

```json
{
  "jsonrpc": "2.0",
  "method": "agent/error",
  "params": {
    "agent_id": "agent-abc123",
    "message_id": "msg-001",
    "code": -32003,
    "message": "LLM Error",
    "data": {
      "reason": "API 超时"
    }
  }
}
```

客户端应处理这种情况，清理已收集的分片并提示用户。
