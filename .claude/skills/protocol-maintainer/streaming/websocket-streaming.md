# WebSocket 流式规范

> 版本：v1.0.0
> 日期：2026-07-05

## 1. 概述

本文档定义基于 WebSocket 的流式传输规范，用于需要双向实时通信的场景。

### 1.1 与 SSE 的区别

| 特性 | WebSocket | SSE |
|------|-----------|-----|
| 通信方向 | 双向 | 单向（Server -> Client） |
| 协议 | ws:// / wss:// | HTTP |
| 自动重连 | 手动实现 | 内置 |
| 二进制支持 | 支持 | 不支持 |
| 最大并发 | 无限制 | 6/域名 |

### 1.2 适用场景

| 场景 | 说明 |
|------|------|
| Agent 对话 | 双向交互 + 流式响应 |
| Shell 交互 | 实时输入/输出 |
| 审批流程 | 实时请求/响应 |
| 工具调用 | 请求/结果配对 |

---

## 2. 流式消息格式

### 2.1 Text Frame

所有消息通过 Text Frame 传输，内容为 JSON-RPC 2.0 JSON 字符串。

### 2.2 流式响应

```json
// 流式分片
{
  "jsonrpc": "2.0",
  "method": "agent/response",
  "params": {
    "agent_id": "agent-abc123",
    "message_id": "msg-001",
    "content": "Rust 的所有权系统",
    "is_chunk": true,
    "done": false
  }
}

// 最后一片
{
  "jsonrpc": "2.0",
  "method": "agent/response",
  "params": {
    "agent_id": "agent-abc123",
    "message_id": "msg-001",
    "content": "是内存安全的核心。",
    "is_chunk": false,
    "done": true
  }
}
```

---

## 3. 客户端实现

### 3.1 WebSocket 客户端

```javascript
class WebSocketStreamClient {
  constructor(url) {
    this.url = url;
    this.ws = null;
    this.handlers = new Map();
    this.pendingRequests = new Map();
    this.retryCount = 0;
    this.maxRetries = 10;
    this.agentChunks = new Map();
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        this.retryCount = 0;
        this.handshake().then(resolve).catch(reject);
      };

      this.ws.onmessage = (event) => {
        this.handleMessage(JSON.parse(event.data));
      };

      this.ws.onerror = (error) => {
        this.handleError(error);
      };

      this.ws.onclose = (event) => {
        this.handleClose(event);
      };
    });
  }

  async handshake() {
    return this.sendRequest('protocol/handshake', {
      version: '1.0.0',
      client: 'CodeY-Web/1.0'
    });
  }

  handleMessage(message) {
    if (message.id) {
      const pending = this.pendingRequests.get(message.id);
      if (pending) {
        this.pendingRequests.delete(message.id);
        if (message.error) {
          pending.reject(message.error);
        } else {
          pending.resolve(message.result);
        }
      }
    } else {
      this.handleNotification(message);
    }
  }

  handleNotification(message) {
    const { method, params } = message;

    switch (method) {
      case 'agent/response':
        this.handleAgentResponse(params);
        break;
      case 'shell/output':
        this.handleShellOutput(params);
        break;
      case 'agent/error':
        this.handleAgentError(params);
        break;
    }
  }

  handleAgentResponse(params) {
    const { agent_id, content, is_chunk, done } = params;

    if (is_chunk) {
      if (!this.agentChunks.has(agent_id)) {
        this.agentChunks.set(agent_id, []);
      }
      this.agentChunks.get(agent_id).push(content);

      if (this.handlers.has('chunk')) {
        this.handlers.get('chunk')({ agent_id, content });
      }
    }

    if (done) {
      const chunks = this.agentChunks.get(agent_id) || [];
      const fullContent = chunks.join('');
      this.agentChunks.delete(agent_id);

      if (this.handlers.has('complete')) {
        this.handlers.get('complete')({ agent_id, content: fullContent });
      }
    }
  }

  handleClose(event) {
    if (event.code !== 1000 && this.retryCount < this.maxRetries) {
      const delay = Math.min(1000 * Math.pow(2, this.retryCount), 30000);
      this.retryCount++;
      setTimeout(() => this.connect().catch(console.error), delay);
    }
  }

  sendRequest(method, params) {
    return new Promise((resolve, reject) => {
      const id = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      this.pendingRequests.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ jsonrpc: '2.0', method, params, id }));
    });
  }

  on(event, handler) {
    this.handlers.set(event, handler);
  }

  disconnect() {
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
    }
  }
}
```

---

## 4. 心跳保活

### 4.1 Ping/Pong

```rust
// 服务端发送 Ping
async fn send_ping(sender: &mut SplitSink<WebSocket>) {
    loop {
        tokio::time::sleep(Duration::from_secs(30)).await;
        if sender.send(Message::Ping(vec![])).await.is_err() {
            break;
        }
    }
}
```

### 4.2 应用层心跳

```json
{
  "jsonrpc": "2.0",
  "method": "protocol/heartbeat",
  "params": {
    "timestamp": 1625481600000
  }
}
```

---

## 5. 并发流式

### 5.1 多 Agent 流式

```javascript
class MultiAgentStreamManager {
  constructor() {
    this.client = new WebSocketStreamClient('ws://localhost:3000/api/v1/ws');
    this.agents = new Map();
  }

  async connect() {
    await this.client.connect();

    this.client.on('chunk', ({ agent_id, content }) => {
      const agent = this.agents.get(agent_id);
      if (agent?.onChunk) agent.onChunk(content);
    });

    this.client.on('complete', ({ agent_id, content }) => {
      const agent = this.agents.get(agent_id);
      if (agent?.onComplete) agent.onComplete(content);
    });
  }

  registerAgent(agentId, handlers) {
    this.agents.set(agentId, handlers);
  }
}
```

---

## 6. 限制

| 限制 | 值 | 说明 |
|------|-----|------|
| 单条消息大小 | 4MB | JSON-RPC 限制 |
| 心跳间隔 | 30 秒 | 保活间隔 |
| 最大重连次数 | 10 | 自动重连限制 |
| 最大并发 Agent | 100 | 服务端限制 |

---

*WebSocket 流式规范 v1.0.0*
*创建日期：2026-07-05*
