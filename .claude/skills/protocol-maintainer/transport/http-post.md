# HTTP POST 传输规范

> 版本：v1.0.0
> 日期：2026-07-05

## 1. 概述

HTTP POST 用于请求/响应模式的 JSON-RPC 通信。适合不需要流式响应的简单操作，以及与第三方系统的集成。

### 1.1 架构

```
┌──────────────┐                    ┌──────────────┐
│   Client     │  ── HTTP POST ──>  │   Server     │
│              │  <-- HTTP 200 ───  │   (Rust)     │
└──────────────┘                    └──────────────┘

单向请求/响应，无持久连接
```

### 1.2 特性

| 特性 | 说明 |
|------|------|
| 通信模式 | Request/Response |
| 消息格式 | JSON-RPC 2.0 |
| Content-Type | application/json |
| 编码 | UTF-8 |
| 最大消息大小 | 4MB |
| 超时 | 120 秒（默认） |

---

## 2. API 端点

### 2.1 端点定义

```
POST /api/v1/rpc
Content-Type: application/json
Accept: application/json
```

### 2.2 请求头

| Header | 值 | 说明 |
|--------|-----|------|
| Content-Type | application/json | 固定 |
| Accept | application/json | 固定 |
| Authorization | Bearer `<token>` | 认证 Token（可选） |
| X-Request-ID | `<uuid>` | 请求追踪 ID（可选） |

---

## 3. 请求格式

### 3.1 单个请求

```json
POST /api/v1/rpc
Content-Type: application/json

{
  "jsonrpc": "2.0",
  "method": "file/read",
  "params": {
    "path": "/src/main.rs"
  },
  "id": "1"
}
```

### 3.2 批量请求

```json
POST /api/v1/rpc
Content-Type: application/json

[
  {
    "jsonrpc": "2.0",
    "method": "file/read",
    "params": { "path": "/src/main.rs" },
    "id": "1"
  },
  {
    "jsonrpc": "2.0",
    "method": "file/read",
    "params": { "path": "/src/lib.rs" },
    "id": "2"
  }
]
```

---

## 4. 响应格式

### 4.1 单个响应

```json
HTTP/1.1 200 OK
Content-Type: application/json

{
  "jsonrpc": "2.0",
  "result": {
    "content": "fn main() { ... }",
    "total_lines": 3,
    "truncated": false
  },
  "id": "1"
}
```

### 4.2 批量响应

```json
HTTP/1.1 200 OK
Content-Type: application/json

[
  {
    "jsonrpc": "2.0",
    "result": { "content": "..." },
    "id": "1"
  },
  {
    "jsonrpc": "2.0",
    "result": { "content": "..." },
    "id": "2"
  }
]
```

### 4.3 错误响应

```json
HTTP/1.1 200 OK
Content-Type: application/json

{
  "jsonrpc": "2.0",
  "error": {
    "code": -32002,
    "message": "Tool Error",
    "data": {
      "tool": "file/read",
      "reason": "文件不存在"
    }
  },
  "id": "1"
}
```

---

## 5. HTTP 状态码

### 5.1 状态码映射

| HTTP 状态码 | 场景 | 说明 |
|------------|------|------|
| 200 OK | 成功 | JSON-RPC 响应在 body 中 |
| 400 Bad Request | 请求格式错误 | 非 JSON 或格式无效 |
| 401 Unauthorized | 未认证 | 缺少或无效的 Token |
| 403 Forbidden | 无权限 | Token 权限不足 |
| 404 Not Found | 端点不存在 | URL 错误 |
| 413 Payload Too Large | 消息过大 | 超过 4MB 限制 |
| 429 Too Many Requests | 频率超限 | 请求过于频繁 |
| 500 Internal Server Error | 服务器错误 | 未捕获异常 |

### 5.2 错误响应体

当 HTTP 状态码非 200 时，响应体格式：

```json
{
  "error": {
    "code": -32009,
    "message": "Transport Error",
    "data": {
      "http_status": 413,
      "reason": "消息大小超过限制 (4MB)"
    }
  }
}
```

---

## 6. 请求示例

### 6.1 启动 Agent

```bash
curl -X POST http://localhost:3000/api/v1/rpc \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "agent/start",
    "params": {
      "model": "sonnet-4.6",
      "tools": ["file/read", "shell/execute"]
    },
    "id": "1"
  }'
```

### 6.2 读取文件

```bash
curl -X POST http://localhost:3000/api/v1/rpc \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "file/read",
    "params": {
      "path": "/src/main.rs",
      "offset": 0,
      "limit": 50
    },
    "id": "2"
  }'
```

### 6.3 执行命令

```bash
curl -X POST http://localhost:3000/api/v1/rpc \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "shell/execute",
    "params": {
      "command": "cargo build",
      "working_dir": "/project"
    },
    "id": "3"
  }'
```

---

## 7. 客户端实现

### 7.1 JavaScript/TypeScript

```typescript
class HttpClient {
  private baseUrl: string;
  private token?: string;

  constructor(baseUrl: string, token?: string) {
    this.baseUrl = baseUrl;
    this.token = token;
  }

  async sendRequest(method: string, params: any, id: string): Promise<any> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseUrl}/api/v1/rpc`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        jsonrpc: '2.0',
        method,
        params,
        id
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();

    if (result.error) {
      throw new JsonRpcError(result.error.code, result.error.message, result.error.data);
    }

    return result.result;
  }

  async sendBatch(requests: Array<{ method: string; params: any; id: string }>): Promise<any[]> {
    const response = await fetch(`${this.baseUrl}/api/v1/rpc`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(requests.map(req => ({
        jsonrpc: '2.0',
        ...req
      })))
    });

    return response.json();
  }
}
```

### 7.2 Rust (reqwest)

```rust
use reqwest::Client;
use serde_json::json;

async fn send_rpc_request(
    client: &Client,
    base_url: &str,
    method: &str,
    params: serde_json::Value,
    id: &str,
) -> Result<serde_json::Value, Box<dyn std::error::Error>> {
    let response = client
        .post(format!("{}/api/v1/rpc", base_url))
        .json(&json!({
            "jsonrpc": "2.0",
            "method": method,
            "params": params,
            "id": id
        }))
        .send()
        .await?;

    let result: serde_json::Value = response.json().await?;

    if let Some(error) = result.get("error") {
        let code = error["code"].as_i64().unwrap_or(-1);
        let message = error["message"].as_str().unwrap_or("Unknown error");
        return Err(format!("RPC Error {}: {}", code, message).into());
    }

    Ok(result["result"].clone())
}
```

---

## 8. 超时配置

### 8.1 默认超时

| 操作 | 超时 | 说明 |
|------|------|------|
| 连接 | 10 秒 | 建立 TCP 连接 |
| 请求 | 120 秒 | 等待响应 |
| 批量请求 | 300 秒 | 批量操作 |

### 8.2 自定义超时

```typescript
const client = new HttpClient('http://localhost:3000', token);

// 设置请求超时
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 30000);

try {
  const result = await client.sendRequest('file/read', { path: '/large-file.log' }, '1', {
    signal: controller.signal
  });
} finally {
  clearTimeout(timeoutId);
}
```

---

## 9. 安全性

### 9.1 HTTPS

生产环境必须使用 HTTPS：

```
https://api.example.com/api/v1/rpc
```

### 9.2 认证

```bash
# Bearer Token
curl -X POST https://api.example.com/api/v1/rpc \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"file/read","params":{},"id":"1"}'
```

### 9.3 CORS

```rust
// 配置 CORS
use tower_http::cors::CorsLayer;

let cors = CorsLayer::new()
    .allow_origin(["http://localhost:3001".parse().unwrap()])
    .allow_methods([Method::POST])
    .allow_headers([HeaderName::from_static("content-type")]);
```

---

## 10. 限制

### 10.1 不支持的操作

由于 HTTP POST 是单向请求/响应模式，以下操作需要使用 WebSocket 或 SSE：

- `agent/response`（流式响应）
- `shell/output`（流式输出）
- `agent/approval`（实时审批）
- `agent/error`（实时错误通知）

### 10.2 替代方案

| 场景 | HTTP POST | WebSocket | SSE |
|------|-----------|-----------|-----|
| 读取文件 | 适用 | 适用 | 不适用 |
| 写入文件 | 适用 | 适用 | 不适用 |
| Agent 对话 | 不适用 | 适用 | 适用 |
| Shell 执行 | 有限适用 | 适用 | 适用 |

---

*HTTP POST 传输规范 v1.0.0*
*创建日期：2026-07-05*
