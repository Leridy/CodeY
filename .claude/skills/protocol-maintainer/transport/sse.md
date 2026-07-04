# SSE 传输规范

> 版本：v1.0.0
> 日期：2026-07-05

## 1. 概述

SSE（Server-Sent Events）用于服务端向客户端的单向流式推送。适合 Agent 响应流、Shell 输出流等需要实时推送的场景。

### 1.1 架构

```
┌──────────────┐                    ┌──────────────┐
│   Client     │  ── HTTP GET ───>  │   Server     │
│              │  <-- SSE Stream ─  │   (Rust)     │
└──────────────┘                    └──────────────┘

单向推送：Server -> Client
持久连接：HTTP 长连接
```

### 1.2 特性

| 特性 | 说明 |
|------|------|
| 通信模式 | 单向推送（Server -> Client） |
| 消息格式 | JSON-RPC 2.0 Notification |
| Content-Type | text/event-stream |
| 编码 | UTF-8 |
| 重连 | 自动重连 |
| 最大并发流 | 6（浏览器限制） |

---

## 2. 连接建立

### 2.1 端点

```
GET /api/v1/stream
GET /api/v1/stream?agent_id=agent-abc123
GET /api/v1/stream?agent_id=agent-abc123&types=agent/response,shell/output
```

### 2.2 请求头

```
GET /api/v1/stream?agent_id=agent-abc123
Accept: text/event-stream
Cache-Control: no-cache
```

### 2.3 响应头

```
HTTP/1.1 200 OK
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
X-Accel-Buffering: no
```

### 2.4 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| agent_id | string | 否 | 过滤特定 Agent 的事件 |
| types | string | 否 | 过滤事件类型（逗号分隔） |
| since | string | 否 | 从指定事件 ID 开始 |

---

## 3. 事件格式

### 3.1 标准格式

```
event: <event_type>
data: <json_rpc_message>
id: <event_id>
retry: <reconnect_interval_ms>
```

### 3.2 字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| event | string | 否 | 事件类型（默认 message） |
| data | string | 是 | JSON-RPC 消息 |
| id | string | 否 | 事件 ID（用于重连） |
| retry | number | 否 | 重连间隔（毫秒） |

### 3.3 示例

```
event: agent/response
data: {"jsonrpc":"2.0","method":"agent/response","params":{"agent_id":"agent-abc123","message_id":"msg-001","content":"Hello","is_chunk":true,"done":false}}
id: evt-001
retry: 3000

event: agent/response
data: {"jsonrpc":"2.0","method":"agent/response","params":{"agent_id":"agent-abc123","message_id":"msg-001","content":" World","is_chunk":true,"done":false}}
id: evt-002

event: agent/response
data: {"jsonrpc":"2.0","method":"agent/response","params":{"agent_id":"agent-abc123","message_id":"msg-001","content":"!","is_chunk":false,"done":true}}
id: evt-003
```

---

## 4. 事件类型

### 4.1 Agent 事件

| event_type | 说明 |
|------------|------|
| agent/response | Agent 回复消息 |
| agent/error | Agent 错误通知 |
| agent/approval | 审批请求 |

### 4.2 Shell 事件

| event_type | 说明 |
|------------|------|
| shell/output | Shell 输出 |
| shell/exit | 进程退出 |

### 4.3 系统事件

| event_type | 说明 |
|------------|------|
| heartbeat | 心跳保活 |
| message | 默认事件类型 |

---

## 5. 客户端实现

### 5.1 JavaScript EventSource

```javascript
class AgentStream {
  constructor(url, agentId) {
    this.url = url;
    this.agentId = agentId;
    this.handlers = new Map();
  }

  connect() {
    const url = `${this.url}?agent_id=${this.agentId}`;
    this.eventSource = new EventSource(url);

    // 默认 message 事件
    this.eventSource.onmessage = (event) => {
      this.handleMessage(event.data);
    };

    // 指定事件类型
    this.eventSource.addEventListener('agent/response', (event) => {
      this.handleAgentResponse(JSON.parse(event.data));
    });

    this.eventSource.addEventListener('shell/output', (event) => {
      this.handleShellOutput(JSON.parse(event.data));
    });

    this.eventSource.addEventListener('agent/error', (event) => {
      this.handleAgentError(JSON.parse(event.data));
    });

    this.eventSource.addEventListener('heartbeat', (event) => {
      this.handleHeartbeat();
    });

    // 错误处理
    this.eventSource.onerror = (error) => {
      this.handleError(error);
    };
  }

  handleMessage(data) {
    const message = JSON.parse(data);
    const handler = this.handlers.get(message.method);
    if (handler) {
      handler(message.params);
    }
  }

  handleAgentResponse(data) {
    const { content, is_chunk, done } = data;
    if (is_chunk) {
      this.onChunk(content);
    }
    if (done) {
      this.onComplete();
    }
  }

  on(eventType, handler) {
    this.handlers.set(eventType, handler);
  }

  disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
    }
  }
}
```

### 5.2 使用示例

```javascript
const stream = new AgentStream('http://localhost:3000/api/v1/stream', 'agent-abc123');

stream.onChunk = (content) => {
  process.stdout.write(content);
};

stream.onComplete = () => {
  console.log('\n--- 完成 ---');
};

stream.connect();
```

---

## 6. 重连机制

### 6.1 自动重连

SSE 内置自动重连机制：

1. 连接断开时，浏览器自动重连
2. 服务端通过 `retry` 字段指定重连间隔
3. 客户端通过 `Last-Event-ID` 头告知最后收到的事件 ID

### 6.2 重连流程

```
Client                              Server
    │                                  │
    │  GET /api/v1/stream              │
    │ ────────────────────────────────> │
    │  SSE Stream                      │
    │ <──────────────────────────────── │
    │                                  │
    │  ... 接收事件 ...                │
    │                                  │
    │  连接断开                        │
    │                                  │
    │  等待 retry 指定的间隔           │
    │                                  │
    │  GET /api/v1/stream              │
    │  Last-Event-ID: evt-005          │
    │ ────────────────────────────────> │
    │  SSE Stream（从 evt-006 开始）   │
    │ <──────────────────────────────── │
```

### 6.3 事件 ID 管理

```javascript
class EventIdManager {
  constructor() {
    this.lastEventId = null;
  }

  update(eventId) {
    if (eventId) {
      this.lastEventId = eventId;
      localStorage.setItem('lastEventId', eventId);
    }
  }

  getLastEventId() {
    return this.lastEventId || localStorage.getItem('lastEventId');
  }
}
```

---

## 7. 心跳保活

### 7.1 心跳事件

```
event: heartbeat
data: {"timestamp": 1625481600000}
id: hb-001
retry: 30000
```

### 7.2 心跳检测

```javascript
class HeartbeatMonitor {
  constructor(timeout = 60000) {
    this.timeout = timeout;
    this.lastHeartbeat = Date.now();
  }

  update() {
    this.lastHeartbeat = Date.now();
  }

  isAlive() {
    return Date.now() - this.lastHeartbeat < this.timeout;
  }
}
```

---

## 8. 流式响应

### 8.1 Agent 响应流

```
event: agent/response
data: {"jsonrpc":"2.0","method":"agent/response","params":{"agent_id":"agent-abc123","message_id":"msg-001","content":"Rust","is_chunk":true,"done":false}}
id: resp-001

event: agent/response
data: {"jsonrpc":"2.0","method":"agent/response","params":{"agent_id":"agent-abc123","message_id":"msg-001","content":" 的所有权系统","is_chunk":true,"done":false}}
id: resp-002

event: agent/response
data: {"jsonrpc":"2.0","method":"agent/response","params":{"agent_id":"agent-abc123","message_id":"msg-001","content":"是内存安全的核心。","is_chunk":false,"done":true}}
id: resp-003
```

### 8.2 Shell 输出流

```
event: shell/output
data: {"jsonrpc":"2.0","method":"shell/output","params":{"process_id":"proc-001","stream":"stdout","data":"   Compiling project v0.1.0\n"}}
id: shell-001

event: shell/output
data: {"jsonrpc":"2.0","method":"shell/output","params":{"process_id":"proc-001","stream":"stdout","data":"    Finished dev [unoptimized + debuginfo]\n"}}
id: shell-002

event: shell/exit
data: {"jsonrpc":"2.0","method":"shell/exit","params":{"process_id":"proc-001","exit_code":0}}
id: shell-003
```

---

## 9. 错误处理

### 9.1 错误事件

```
event: agent/error
data: {"jsonrpc":"2.0","method":"agent/error","params":{"agent_id":"agent-abc123","code":-32003,"message":"LLM Error","data":{"reason":"API 超时"}}}
id: err-001
```

### 9.2 连接错误

```javascript
eventSource.onerror = (error) => {
  switch (eventSource.readyState) {
    case EventSource.CONNECTING:
      console.log('重连中...');
      break;
    case EventSource.CLOSED:
      console.log('连接已关闭');
      break;
  }
};
```

---

## 10. 服务端实现

### 10.1 Rust (axum)

```rust
use axum::{
    response::sse::{Event, Sse},
    extract::Query,
};
use futures::stream::Stream;
use std::convert::Infallible;
use tokio_stream::StreamExt;

async fn stream_handler(
    Query(params): Query<StreamParams>,
) -> Sse<impl Stream<Item = Result<Event, Infallible>>> {
    let stream = async_stream::stream! {
        loop {
            // 获取下一个事件
            if let Some(event) = get_next_event(&params).await {
                let sse_event = Event::default()
                    .event(&event.event_type)
                    .data(serde_json::to_string(&event.data).unwrap())
                    .id(&event.id);

                yield Ok(sse_event);
            }

            tokio::time::sleep(std::time::Duration::from_millis(100)).await;
        }
    };

    Sse::new(stream).keep_alive(
        axum::response::sse::KeepAlive::new()
            .interval(std::time::Duration::from_secs(30))
            .text("heartbeat")
    )
}
```

---

## 11. 限制

### 11.1 浏览器限制

| 限制 | 值 | 说明 |
|------|-----|------|
| 最大并发连接 | 6 | 每个域名 |
| 连接超时 | 无 | 需要心跳保活 |
| 跨域 | 受限 | 需要 CORS 配置 |

### 11.2 替代方案

| 场景 | SSE | WebSocket |
|------|-----|-----------|
| 单向推送 | 适用 | 适用 |
| 双向通信 | 不适用 | 适用 |
| 自动重连 | 内置 | 手动实现 |
| 二进制数据 | 不支持 | 支持 |

---

*SSE 传输规范 v1.0.0*
*创建日期：2026-07-05*
