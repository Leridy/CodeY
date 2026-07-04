# WebSocket 传输规范

> 版本：v1.0.0
> 日期：2026-07-05

## 1. 概述

WebSocket 用于 Web 端和远程 Agent 的双向实时通信。支持全双工通信，适合需要低延迟双向交互的场景。

### 1.1 架构

```
┌──────────────┐                    ┌──────────────┐
│   Client     │  ── WebSocket ──>  │   Server     │
│   (Browser)  │  <-- WebSocket ──  │   (Rust)     │
└──────────────┘                    └──────────────┘

连接建立 → 握手 → JSON-RPC 消息交换 → 心跳保活 → 关闭
```

### 1.2 特性

| 特性 | 说明 |
|------|------|
| 通信模式 | 全双工 |
| 消息格式 | JSON-RPC 2.0（Text Frame） |
| 编码 | UTF-8 |
| 最大消息大小 | 4MB |
| 心跳间隔 | 30 秒 |
| 重连策略 | 指数退避 |

---

## 2. 连接管理

### 2.1 连接建立

```
Client                              Server
    │                                  │
    │  HTTP Upgrade: websocket         │
    │ ────────────────────────────────> │
    │  101 Switching Protocols         │
    │ <──────────────────────────────── │
    │                                  │
    │  protocol/handshake (Request)    │
    │ ────────────────────────────────> │
    │  protocol/handshake (Response)   │
    │ <──────────────────────────────── │
    │                                  │
    │  连接就绪，开始消息交换           │
    │                                  │
```

### 2.2 握手协议

```json
// Client -> Server
{
  "jsonrpc": "2.0",
  "method": "protocol/handshake",
  "params": {
    "version": "1.0.0",
    "client": "CodeY-Web/1.0",
    "capabilities": ["streaming", "tool_call"]
  },
  "id": "0"
}

// Server -> Client
{
  "jsonrpc": "2.0",
  "result": {
    "version": "1.0.0",
    "server": "CodeY-Agent/1.0",
    "methods": ["agent/*", "file/*", "shell/*"],
    "capabilities": ["streaming", "tool_call", "approval"]
  },
  "id": "0"
}
```

### 2.3 连接关闭

```
正常关闭：
Client -> Close Frame (code=1000, reason="正常关闭")
Server -> Close Frame (code=1000)

异常关闭：
Client -> Close Frame (code=1001, reason="离开")
Server -> 清理资源，通知 Agent
```

#### 关闭码

| 代码 | 说明 |
|------|------|
| 1000 | 正常关闭 |
| 1001 | 离开（如页面关闭） |
| 1002 | 协议错误 |
| 1003 | 不支持的数据类型 |
| 1006 | 异常关闭（无 Close Frame） |
| 1007 | 数据格式错误 |
| 1008 | 策略违规 |
| 1009 | 消息过大 |
| 1011 | 服务器错误 |

---

## 3. 消息格式

### 3.1 Text Frame

所有 JSON-RPC 消息通过 Text Frame 传输：

```javascript
// 发送消息
ws.send(JSON.stringify({
  jsonrpc: "2.0",
  method: "agent/send",
  params: {
    agent_id: "agent-abc123",
    message: "Hello"
  },
  id: "1"
}));

// 接收消息
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  if (message.id) {
    // Response
    handleResponse(message);
  } else {
    // Notification
    handleNotification(message);
  }
};
```

### 3.2 消息类型

| 类型 | 特征 | 处理方式 |
|------|------|----------|
| Request | 有 `id`，有 `method` | 执行并返回 Response |
| Response | 有 `id`，有 `result` 或 `error` | 匹配 Request，返回结果 |
| Notification | 有 `method`，无 `id` | 处理，不返回 |

---

## 4. 心跳保活

### 4.1 Ping/Pong 机制

```
Server -> Ping Frame (每 30 秒)
Client -> Pong Frame (立即响应)

超时：60 秒无 Pong，断开连接
```

### 4.2 应用层心跳

```json
// Server -> Client（每 30 秒）
{
  "jsonrpc": "2.0",
  "method": "protocol/heartbeat",
  "params": {
    "timestamp": 1625481600000
  }
}

// Client -> Server（响应）
{
  "jsonrpc": "2.0",
  "method": "protocol/heartbeat",
  "params": {
    "timestamp": 1625481600000
  }
}
```

### 4.3 心跳超时处理

```javascript
class WebSocketClient {
  constructor(url) {
    this.url = url;
    this.heartbeatInterval = 30000; // 30 秒
    this.heartbeatTimeout = 60000;  // 60 秒
    this.lastPong = Date.now();
  }

  startHeartbeat() {
    this.heartbeatTimer = setInterval(() => {
      if (Date.now() - this.lastPong > this.heartbeatTimeout) {
        this.reconnect();
        return;
      }
      this.send({
        jsonrpc: "2.0",
        method: "protocol/heartbeat",
        params: { timestamp: Date.now() }
      });
    }, this.heartbeatInterval);
  }

  handleHeartbeat() {
    this.lastPong = Date.now();
  }
}
```

---

## 5. 重连策略

### 5.1 指数退避

```
重连间隔：
- 第 1 次：1 秒
- 第 2 次：2 秒
- 第 3 次：4 秒
- 第 4 次：8 秒
- 第 5 次：16 秒
- 最大：30 秒

最大重试次数：10 次
```

### 5.2 重连实现

```javascript
class WebSocketClient {
  constructor(url) {
    this.url = url;
    this.retryCount = 0;
    this.maxRetries = 10;
    this.baseDelay = 1000;
    this.maxDelay = 30000;
  }

  async reconnect() {
    if (this.retryCount >= this.maxRetries) {
      this.onError(new Error("Max retries exceeded"));
      return;
    }

    const delay = Math.min(
      this.baseDelay * Math.pow(2, this.retryCount),
      this.maxDelay
    );

    await new Promise(resolve => setTimeout(resolve, delay));
    this.retryCount++;

    try {
      await this.connect();
      this.retryCount = 0; // 重连成功，重置计数
    } catch (error) {
      await this.reconnect();
    }
  }
}
```

### 5.3 会话恢复

```json
// 重连后恢复会话
{
  "jsonrpc": "2.0",
  "method": "protocol/reconnect",
  "params": {
    "session_id": "session-abc123",
    "last_message_id": "msg-050",
    "agent_id": "agent-abc123"
  },
  "id": "0"
}

// 服务端确认
{
  "jsonrpc": "2.0",
  "result": {
    "session_id": "session-abc123",
    "recovered": true,
    "pending_messages": 3
  },
  "id": "0"
}
```

---

## 6. 并发处理

### 6.1 多 Agent 隔离

```javascript
class AgentManager {
  constructor() {
    this.agents = new Map();
  }

  addAgent(agentId) {
    this.agents.set(agentId, {
      id: agentId,
      pendingRequests: new Map(),
      chunks: []
    });
  }

  handleMessage(message) {
    const agentId = message.params?.agent_id;
    if (agentId && this.agents.has(agentId)) {
      const agent = this.agents.get(agentId);
      // 分发到对应的 Agent 处理器
      this.dispatchToAgent(agent, message);
    }
  }
}
```

### 6.2 请求/响应匹配

```javascript
class RequestManager {
  constructor() {
    this.pending = new Map();
    this.counter = 0;
  }

  sendRequest(method, params) {
    const id = `req-${++this.counter}`;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject, timestamp: Date.now() });
      this.ws.send(JSON.stringify({
        jsonrpc: "2.0",
        method,
        params,
        id
      }));
    });
  }

  handleResponse(response) {
    const pending = this.pending.get(response.id);
    if (pending) {
      this.pending.delete(response.id);
      if (response.error) {
        pending.reject(response.error);
      } else {
        pending.resolve(response.result);
      }
    }
  }
}
```

---

## 7. 安全性

### 7.1 WSS（WebSocket Secure）

生产环境必须使用 WSS：

```javascript
// 开发环境
ws://localhost:3000/api/v1/ws

// 生产环境
wss://api.example.com/api/v1/ws
```

### 7.2 认证

```javascript
// 连接时传递 Token
const ws = new WebSocket('wss://api.example.com/ws', {
  headers: {
    'Authorization': 'Bearer <token>'
  }
});

// 或通过查询参数
const ws = new WebSocket('wss://api.example.com/ws?token=<token>');
```

### 7.3 速率限制

```
连接限制：
- 每个 IP 最多 5 个连接
- 每个连接每秒最多 100 条消息
- 单条消息最大 4MB

超限处理：
- 返回 Close Frame (code=1008, reason="Rate limit exceeded")
- 记录日志
```

---

## 8. 错误处理

### 8.1 连接错误

```javascript
ws.onerror = (error) => {
  console.error('WebSocket error:', error);
  // 尝试重连
  this.reconnect();
};
```

### 8.2 消息错误

```javascript
ws.onmessage = (event) => {
  try {
    const message = JSON.parse(event.data);
    if (message.error) {
      this.handleError(message.error);
    }
  } catch (e) {
    // JSON 解析错误
    this.send({
      jsonrpc: "2.0",
      error: { code: -32700, message: "Parse Error" },
      id: null
    });
  }
};
```

---

## 9. 调试

### 9.1 Chrome DevTools

1. 打开 Chrome DevTools
2. Network 标签 -> WS
3. 查看 WebSocket 帧

### 9.2 日志记录

```javascript
class WebSocketClient {
  send(message) {
    console.log('WS Send:', message);
    this.ws.send(JSON.stringify(message));
  }

  onmessage(event) {
    console.log('WS Receive:', event.data);
    // 处理消息
  }
}
```

---

*WebSocket 传输规范 v1.0.0*
*创建日期：2026-07-05*
