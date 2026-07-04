# SSE 流式规范

> 版本：v1.0.0
> 日期：2026-07-05

## 1. 概述

本文档定义基于 SSE（Server-Sent Events）的流式传输规范，用于 Agent 响应和 Shell 输出的实时推送。

### 1.1 适用场景

| 场景 | 说明 |
|------|------|
| Agent 响应 | LLM 生成的流式文本 |
| Shell 输出 | 命令执行的实时输出 |
| 错误通知 | 实时错误推送 |
| 状态更新 | Agent 状态变化 |

---

## 2. 流式消息格式

### 2.1 JSON-RPC over SSE

每个 SSE 事件包含一个 JSON-RPC 2.0 Notification：

```
event: <event_type>
data: <json_rpc_notification>
id: <event_id>
```

### 2.2 Agent 响应流

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

### 2.3 流式参数说明

| 参数 | 类型 | 说明 |
|------|------|------|
| is_chunk | boolean | `true` 表示流式分片 |
| done | boolean | `true` 表示最后一片 |

**状态组合**：

| is_chunk | done | 说明 |
|----------|------|------|
| true | false | 流式分片，还有更多内容 |
| false | true | 最后一片，流式传输结束 |
| false | false | 完整消息（非流式） |

---

## 3. 客户端实现

### 3.1 基础 EventSource

```javascript
class SseStreamClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.handlers = new Map();
    this.chunks = [];
  }

  connect(agentId) {
    const url = `${this.baseUrl}/api/v1/stream?agent_id=${agentId}`;
    this.eventSource = new EventSource(url);

    this.eventSource.addEventListener('agent/response', (event) => {
      const data = JSON.parse(event.data);
      this.handleAgentResponse(data);
    });

    this.eventSource.addEventListener('shell/output', (event) => {
      const data = JSON.parse(event.data);
      this.handleShellOutput(data);
    });

    this.eventSource.addEventListener('agent/error', (event) => {
      const data = JSON.parse(event.data);
      this.handleError(data);
    });

    this.eventSource.onerror = (error) => {
      this.handleConnectionError(error);
    };
  }

  handleAgentResponse(data) {
    const { content, is_chunk, done } = data.params;

    if (is_chunk) {
      this.chunks.push(content);
      if (this.handlers.has('chunk')) {
        this.handlers.get('chunk')(content);
      }
    }

    if (done) {
      const fullContent = this.chunks.join('');
      this.chunks = [];
      if (this.handlers.has('complete')) {
        this.handlers.get('complete')(fullContent);
      }
    }
  }

  on(event, handler) {
    this.handlers.set(event, handler);
  }

  disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
    }
  }
}
```

---

## 4. 服务端实现

### 4.1 Rust (axum)

```rust
use axum::{
    response::sse::{Event, Sse},
    extract::Query,
    routing::get,
    Router,
};
use futures::stream::Stream;
use std::convert::Infallible;

async fn stream_handler(
    Query(params): Query<StreamParams>,
) -> Sse<impl Stream<Item = Result<Event, Infallible>>> {
    let stream = async_stream::stream! {
        loop {
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

## 5. 重连机制

### 5.1 自动重连

SSE 内置自动重连，通过 `retry` 字段控制：

```
event: agent/response
data: {...}
id: evt-001
retry: 3000
```

### 5.2 Last-Event-ID

客户端自动发送 `Last-Event-ID` 头，服务端从该 ID 之后开始推送：

```
GET /api/v1/stream?agent_id=agent-abc123
Last-Event-ID: evt-005
```

---

## 6. 限制

| 限制 | 值 | 说明 |
|------|-----|------|
| 最大并发连接 | 6 | 浏览器限制 |
| 单条消息大小 | 4MB | JSON-RPC 限制 |
| 心跳间隔 | 30 秒 | 保活间隔 |

---

*SSE 流式规范 v1.0.0*
*创建日期：2026-07-05*
