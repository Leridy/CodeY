# Tauri IPC 传输规范

> 版本：v1.0.0
> 日期：2026-07-05

## 1. 概述

Tauri IPC（Inter-Process Communication）用于 Tauri 桌面应用中 Frontend（WebView）与 Backend（Rust）之间的通信。这是 CodeY 桌面端的主要传输通道。

### 1.1 架构

```
┌──────────────────┐                    ┌──────────────────┐
│    Frontend      │  ── Tauri IPC ──>  │    Backend       │
│    (WebView)     │  <-- Tauri IPC ──  │    (Rust)        │
│                  │                    │                  │
│  TypeScript      │                    │  codey-tauri     │
│  React           │                    │  codey-core      │
└──────────────────┘                    └──────────────────┘
```

### 1.2 特性

| 特性 | 说明 |
|------|------|
| 通信模式 | Request/Response（同步调用） |
| 消息格式 | JSON-RPC 2.0 |
| 编码 | UTF-8 JSON |
| 最大消息大小 | 4MB |
| 延迟 | < 1ms（本地通信） |

---

## 2. 调用方式

### 2.1 Frontend（TypeScript）

```typescript
import { invoke } from '@tauri-apps/api/core';

// 发送 JSON-RPC 请求
const response = await invoke<JsonRpcResponse>('jsonrpc_handler', {
  request: {
    jsonrpc: '2.0',
    method: 'file/read',
    params: { path: '/src/main.rs' },
    id: '1'
  }
});

// 处理响应
if (response.error) {
  console.error(`Error ${response.error.code}: ${response.error.message}`);
} else {
  console.log(response.result);
}
```

### 2.2 Backend（Rust）

```rust
use serde::{Deserialize, Serialize};

#[derive(Deserialize)]
struct JsonRpcRequest {
    jsonrpc: String,
    method: String,
    params: Option<serde_json::Value>,
    id: Option<serde_json::Value>,
}

#[derive(Serialize)]
struct JsonRpcResponse {
    jsonrpc: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    result: Option<serde_json::Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    error: Option<JsonRpcError>,
    id: Option<serde_json::Value>,
}

#[tauri::command]
async fn jsonrpc_handler(request: JsonRpcRequest) -> Result<JsonRpcResponse, String> {
    // 路由到对应的方法处理器
    let response = match request.method.as_str() {
        "file/read" => handle_file_read(request.params).await,
        "file/write" => handle_file_write(request.params).await,
        "shell/execute" => handle_shell_execute(request.params).await,
        _ => Err(JsonRpcError {
            code: -32601,
            message: "Method Not Found".to_string(),
            data: None,
        }),
    };

    match response {
        Ok(result) => Ok(JsonRpcResponse {
            jsonrpc: "2.0".to_string(),
            result: Some(result),
            error: None,
            id: request.id,
        }),
        Err(error) => Ok(JsonRpcResponse {
            jsonrpc: "2.0".to_string(),
            result: None,
            error: Some(error),
            id: request.id,
        }),
    }
}
```

---

## 3. 消息流程

### 3.1 请求/响应流程

```
Frontend                    Backend
    │                          │
    │  invoke('jsonrpc_handler', { request })  │
    │ ────────────────────────> │
    │                          │  解析 JSON-RPC
    │                          │  路由到方法处理器
    │                          │  执行方法
    │  Result<JsonRpcResponse> │
    │ <──────────────────────── │
    │                          │
```

### 3.2 Notification 处理

Tauri IPC 本身是 Request/Response 模式。Notification 通过以下方式实现：

```typescript
// Frontend: 监听事件
import { listen } from '@tauri-apps/api/event';

// 监听 Agent 响应
const unlisten = await listen('agent:response', (event) => {
  const params = event.payload;
  console.log('Agent response:', params.content);
});

// 监听 Shell 输出
await listen('shell:output', (event) => {
  const { process_id, stream, data } = event.payload;
  console.log(`[${process_id}] ${stream}: ${data}`);
});
```

```rust
// Backend: 发送事件
use tauri::Emitter;

#[tauri::command]
async fn start_agent(app: tauri::AppHandle, model: String) -> Result<AgentInfo, String> {
    let agent = create_agent(model).await?;

    // 在后台任务中发送通知
    let app_handle = app.clone();
    tokio::spawn(async move {
        loop {
            match agent.next_response().await {
                Some(response) => {
                    app_handle.emit("agent:response", response).unwrap();
                }
                None => break,
            }
        }
    });

    Ok(agent.info())
}
```

---

## 4. 错误处理

### 4.1 Tauri 错误映射

| Tauri 错误 | JSON-RPC 错误码 | 说明 |
|------------|-----------------|------|
| Channel error | -32009 | IPC 通道错误 |
| Serialization error | -32700 | JSON 序列化失败 |
| Command not found | -32601 | 命令不存在 |
| Invalid args | -32602 | 参数无效 |

### 4.2 错误传播

```rust
#[tauri::command]
async fn jsonrpc_handler(request: JsonRpcRequest) -> Result<JsonRpcResponse, JsonRpcError> {
    // 内部错误转为 JSON-RPC 错误
    handle_request(request).await.map_err(|e| JsonRpcError {
        code: e.code,
        message: e.message,
        data: Some(serde_json::json!({
            "reason": e.reason,
            "retryable": e.retryable
        })),
    })
}
```

---

## 5. 安全性

### 5.1 IPC 命令白名单

```rust
// tauri.conf.json
{
  "app": {
    "security": {
      "capabilities": [
        {
          "identifier": "main-capability",
          "windows": ["main"],
          "permissions": [
            "core:default",
            "shell:allow-execute",
            "fs:allow-read",
            "fs:allow-write"
          ]
        }
      ]
    }
  }
}
```

### 5.2 输入验证

```rust
#[tauri::command]
async fn jsonrpc_handler(request: JsonRpcRequest) -> Result<JsonRpcResponse, JsonRpcError> {
    // 验证 jsonrpc 版本
    if request.jsonrpc != "2.0" {
        return Err(JsonRpcError {
            code: -32600,
            message: "Invalid Request".to_string(),
            data: None,
        });
    }

    // 验证 method 格式
    if !request.method.contains('/') {
        return Err(JsonRpcError {
            code: -32600,
            message: "Invalid Request".to_string(),
            data: Some(serde_json::json!({
                "reason": "Method must be in format 'category/action'"
            })),
        });
    }

    // 继续处理...
}
```

---

## 6. 性能优化

### 6.1 批量请求

```typescript
// 批量调用
const [file1, file2] = await Promise.all([
  invoke('jsonrpc_handler', {
    request: { jsonrpc: '2.0', method: 'file/read', params: { path: '/a.rs' }, id: '1' }
  }),
  invoke('jsonrpc_handler', {
    request: { jsonrpc: '2.0', method: 'file/read', params: { path: '/b.rs' }, id: '2' }
  })
]);
```

### 6.2 连接池

Tauri IPC 不需要连接池，因为它是进程内通信，开销极小。

---

## 7. 调试

### 7.1 日志记录

```rust
#[tauri::command]
async fn jsonrpc_handler(request: JsonRpcRequest) -> Result<JsonRpcResponse, JsonRpcError> {
    log::debug!("IPC Request: {} {}", request.method, request.id);

    let response = handle_request(request).await;

    match &response {
        Ok(r) => log::debug!("IPC Response: {:?}", r.result),
        Err(e) => log::error!("IPC Error: {} {}", e.code, e.message),
    }

    response
}
```

### 7.2 开发者工具

在 Tauri 开发模式下，可以使用浏览器开发者工具查看 IPC 调用：

1. 打开应用
2. 按 F12 打开开发者工具
3. 在 Console 中查看 `invoke` 调用日志

---

*Tauri IPC 传输规范 v1.0.0*
*创建日期：2026-07-05*
