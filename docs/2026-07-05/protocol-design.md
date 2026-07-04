# Agent Protocol 设计文档

> 日期：2026-07-05
> 阶段：架构设计
> 版本：v1.0.0

## 1. 概述

CodeY Agent Protocol 基于 **JSON-RPC 2.0** 规范构建，为 AI Agent 与宿主环境之间的通信提供标准化接口。协议设计遵循以下原则：

- **无状态传输**：每个请求独立处理，服务端不依赖会话状态
- **双向通信**：支持 Client → Server 和 Server → Client 两个方向的消息流
- **可扩展性**：通过 method namespace 机制支持功能模块的平滑扩展
- **流式响应**：原生支持 Streaming，适配 LLM 生成场景

## 2. 传输层

### 2.1 传输方式

```
┌──────────────┐                    ┌──────────────┐
│   Agent      │  ── JSON-RPC ──>  │   Host       │
│   (Client)   │  <-- JSON-RPC ──  │   (Server)   │
└──────────────┘                    └──────────────┘

支持的传输通道：
┌─────────────────────────────────────────────────┐
│  Desktop Agent  ←→  stdio (stdin/stdout)        │
│  Web Agent      ←→  WebSocket                   │
│  Remote Agent   ←→  HTTP + SSE (Server-Sent)    │
└─────────────────────────────────────────────────┘
```

### 2.2 消息编码

所有消息使用 UTF-8 编码的 JSON 文本，单条消息最大 **4MB**。

## 3. 消息类型

### 3.1 Request（请求）

```jsonc
{
  "jsonrpc": "2.0",
  "method": "file.read",       // 方法名（namespace.action 格式）
  "params": {                   // 参数对象（可选）
    "path": "/src/main.rs"
  },
  "id": "req-001"              // 请求标识符（string | number | null）
}
```

字段说明：

| 字段     | 类型               | 必填 | 说明                           |
| -------- | ------------------ | ---- | ------------------------------ |
| jsonrpc  | string             | 是   | 固定值 `"2.0"`                 |
| method   | string             | 是   | 方法名，使用 `namespace.action` |
| params   | object \| array    | 否   | 方法参数                       |
| id       | string \| number   | 是   | 请求唯一标识                   |

### 3.2 Response（响应）

```jsonc
// 成功响应
{
  "jsonrpc": "2.0",
  "result": {
    "content": "fn main() { ... }",
    "encoding": "utf-8",
    "size": 1024
  },
  "id": "req-001"
}

// 错误响应
{
  "jsonrpc": "2.0",
  "error": {
    "code": -32001,
    "message": "Permission denied",
    "data": {
      "required": "file.write",
      "current_level": "ReadOnly"
    }
  },
  "id": "req-001"
}
```

### 3.3 Notification（通知）

通知是没有 `id` 字段的消息，不要求响应。用于事件推送和状态更新。

```jsonc
// Client → Server：进度通知
{
  "jsonrpc": "2.0",
  "method": "progress.update",
  "params": {
    "taskId": "task-42",
    "percent": 65,
    "message": "正在编译..."
  }
}

// Server → Client：日志推送
{
  "jsonrpc": "2.0",
  "method": "log.emit",
  "params": {
    "level": "info",
    "message": "Build succeeded in 2.3s"
  }
}
```

消息类型对比：

```
┌──────────────┬────────┬───────────┬──────────────┐
│   类型       │  id    │  方向     │  是否需要响应 │
├──────────────┼────────┼───────────┼──────────────┤
│  Request     │  有    │  双向     │  是           │
│  Response    │  有    │  反向     │  否（本身是响应）│
│  Notification│  无    │  双向     │  否           │
└──────────────┴────────┴───────────┴──────────────┘
```

## 4. 核心方法定义

方法名采用 `namespace.action` 格式，便于模块化管理和路由。

### 4.1 Agent 方法（`agent.*`）

Agent 生命周期和元信息管理。

```jsonc
// 初始化握手
{
  "method": "agent.initialize",
  "params": {
    "protocolVersion": "1.0.0",
    "clientInfo": {
      "name": "codey-agent",
      "version": "0.1.0",
      "capabilities": ["streaming", "file-ops", "shell"]
    }
  },
  "id": "init-1"
}

// 响应
{
  "result": {
    "protocolVersion": "1.0.0",
    "serverInfo": {
      "name": "codey-host",
      "version": "0.1.0"
    },
    "capabilities": {
      "fileSystem": true,
      "shell": true,
      "sandbox": "desktop",
      "permissionModel": "7-level"
    }
  },
  "id": "init-1"
}

// 关闭会话
{
  "method": "agent.shutdown",
  "id": "shutdown-1"
}

// 取消请求
{
  "method": "agent.cancel",
  "params": { "requestId": "req-001" }
}
```

| 方法               | 参数                  | 返回值            | 说明               |
| ------------------ | --------------------- | ----------------- | ------------------ |
| `agent.initialize` | clientInfo, version   | serverInfo, caps  | 握手初始化         |
| `agent.shutdown`   | —                     | —                 | 优雅关闭           |
| `agent.cancel`     | requestId             | —                 | 取消进行中的请求   |
| `agent.ping`       | —                     | `{ "pong": true }` | 心跳检测         |
| `agent.capabilities` | —                  | capabilities 列表 | 查询服务端能力     |

### 4.2 File 方法（`file.*`）

文件系统操作，所有路径均为绝对路径。

```jsonc
// 读取文件
{
  "method": "file.read",
  "params": { "path": "/project/src/main.rs", "encoding": "utf-8" },
  "id": "fr-1"
}

// 写入文件（完整覆盖）
{
  "method": "file.write",
  "params": {
    "path": "/project/src/main.rs",
    "content": "fn main() {\n    println!(\"Hello\");\n}\n",
    "encoding": "utf-8"
  },
  "id": "fw-1"
}

// 编辑文件（局部替换，基于原文精确匹配）
{
  "method": "file.edit",
  "params": {
    "path": "/project/src/main.rs",
    "edits": [
      {
        "oldText": "println!(\"Hello\")",
        "newText": "println!(\"Hello, CodeY!\")",
        "replaceAll": false
      }
    ]
  },
  "id": "fe-1"
}

// 列出目录
{
  "method": "file.list",
  "params": { "path": "/project/src", "recursive": false },
  "id": "fl-1"
}

// 搜索文件内容
{
  "method": "file.search",
  "params": {
    "pattern": "fn\\s+main",
    "path": "/project/src",
    "filePattern": "*.rs",
    "maxResults": 50
  },
  "id": "fs-1"
}
```

| 方法           | 参数                                         | 说明                           |
| -------------- | -------------------------------------------- | ------------------------------ |
| `file.read`    | path, encoding?                              | 读取文件内容                   |
| `file.write`   | path, content, encoding?                     | 写入文件（覆盖）               |
| `file.edit`    | path, edits[]                                | 局部编辑（精确文本匹配替换）   |
| `file.list`    | path, recursive?, ignorePatterns?            | 列出目录内容                   |
| `file.search`  | pattern, path?, filePattern?, maxResults?    | 正则搜索文件内容               |
| `file.info`    | path                                         | 获取文件元信息（大小/修改时间）|
| `file.delete`  | path                                         | 删除文件                       |
| `file.move`    | from, to                                     | 移动/重命名文件                |

### 4.3 Shell 方法（`shell.*`）

命令执行与进程管理。

```jsonc
// 执行命令
{
  "method": "shell.exec",
  "params": {
    "command": "cargo build",
    "workdir": "/project",
    "env": { "RUST_LOG": "debug" },
    "timeout": 60000
  },
  "id": "se-1"
}

// 响应
{
  "result": {
    "exitCode": 0,
    "stdout": "   Compiling codey v0.1.0\n    Finished dev [unoptimized + debuginfo]",
    "stderr": "",
    "duration": 2340
  },
  "id": "se-1"
}

// 启动后台进程
{
  "method": "shell.spawn",
  "params": {
    "command": "cargo watch -x run",
    "workdir": "/project",
    "streamOutput": true
  },
  "id": "ss-1"
}
```

| 方法           | 参数                                         | 说明                               |
| -------------- | -------------------------------------------- | ---------------------------------- |
| `shell.exec`   | command, workdir?, env?, timeout?            | 同步执行命令，返回完整输出         |
| `shell.spawn`  | command, workdir?, env?, streamOutput?       | 启动后台进程，输出通过通知流推送   |
| `shell.kill`   | processId                                    | 终止后台进程                       |
| `shell.stdin`  | processId, data                              | 向后台进程 stdin 写入数据          |
| `shell.status` | processId                                    | 查询后台进程状态                   |

### 4.4 Permission 方法（`permission.*`）

权限查询与授权管理。

```jsonc
// 查询当前权限
{
  "method": "permission.query",
  "params": { "scope": "file.write" },
  "id": "pq-1"
}

// 响应
{
  "result": {
    "granted": false,
    "currentLevel": "ReadOnly",
    "requiredLevel": "ReadWrite",
    "reason": "当前权限级别不包含文件写入"
  },
  "id": "pq-1"
}

// 请求权限提升
{
  "method": "permission.request",
  "params": {
    "scope": "file.write",
    "targetLevel": "ReadWrite",
    "reason": "需要修改项目源代码",
    "duration": 3600000
  },
  "id": "pr-1"
}

// 授权（由用户/UI 层触发）
{
  "method": "permission.grant",
  "params": {
    "requestId": "pr-1",
    "approved": true,
    "level": "ReadWrite",
    "expiresAt": "2026-07-05T23:59:59Z"
  },
  "id": "pg-1"
}
```

| 方法                | 参数                                    | 说明                       |
| ------------------- | --------------------------------------- | -------------------------- |
| `permission.query`  | scope?                                  | 查询当前权限状态           |
| `permission.request`| scope, targetLevel, reason, duration?   | 请求权限提升               |
| `permission.grant`  | requestId, approved, level, expiresAt?  | 授权/拒绝权限请求          |
| `permission.revoke` | scope                                   | 撤销已授权的权限           |
| `permission.list`   | —                                       | 列出当前所有权限           |

## 5. 流式响应（Streaming）

### 5.1 流式传输机制

对于长时间运行的操作（如 LLM 生成、大型文件处理），协议支持通过 Notification 推送增量数据。

```
Client                    Server
  │                         │
  │──── shell.exec ────────>│  (streamOutput: true)
  │                         │
  │<──── stream.chunk ──────│  chunk 1
  │<──── stream.chunk ──────│  chunk 2
  │<──── stream.chunk ──────│  chunk 3
  │     ...                 │
  │<──── stream.end ────────│  完成
  │                         │
  │<──── response ──────────│  最终结果
  │                         │
```

### 5.2 流式消息格式

```jsonc
// 流式数据块
{
  "jsonrpc": "2.0",
  "method": "stream.chunk",
  "params": {
    "requestId": "se-1",
    "data": "   Compiling codey v0.1.0\n",
    "stream": "stdout"              // stdout | stderr
  }
}

// 流式结束标记
{
  "jsonrpc": "2.0",
  "method": "stream.end",
  "params": {
    "requestId": "se-1",
    "exitCode": 0
  }
}

// 流式错误
{
  "jsonrpc": "2.0",
  "method": "stream.error",
  "params": {
    "requestId": "se-1",
    "error": {
      "code": -32003,
      "message": "Command timed out"
    }
  }
}
```

### 5.3 LLM 生成流式示例

```jsonc
// Client 请求
{
  "method": "agent.chat",
  "params": {
    "messages": [
      { "role": "user", "content": "写一个 Hello World" }
    ],
    "stream": true
  },
  "id": "chat-1"
}

// Server 流式推送
{ "method": "stream.chunk", "params": { "requestId": "chat-1", "data": "fn " } }
{ "method": "stream.chunk", "params": { "requestId": "chat-1", "data": "main() " } }
{ "method": "stream.chunk", "params": { "requestId": "chat-1", "data": "{\n" } }
{ "method": "stream.chunk", "params": { "requestId": "chat-1", "data": "    println!(\"Hello, World!\");\n" } }
{ "method": "stream.chunk", "params": { "requestId": "chat-1", "data": "}\n" } }
{ "method": "stream.end",   "params": { "requestId": "chat-1" } }

// Server 最终响应
{
  "result": {
    "content": "fn main() {\n    println!(\"Hello, World!\");\n}\n",
    "usage": { "promptTokens": 12, "completionTokens": 24 }
  },
  "id": "chat-1"
}
```

## 6. 错误码定义

协议采用 JSON-RPC 2.0 标准错误码，并扩展 CodeY 专用错误码段。

### 6.1 标准错误码

| 错误码    | 名称                  | 说明                                   |
| --------- | --------------------- | -------------------------------------- |
| `-32700`  | Parse Error           | JSON 解析失败                          |
| `-32600`  | Invalid Request       | 请求格式不符合 JSON-RPC 2.0            |
| `-32601`  | Method Not Found      | 请求的方法不存在                       |
| `-32602`  | Invalid Params        | 参数类型错误或缺少必填参数             |
| `-32603`  | Internal Error        | 服务端内部错误                         |

### 6.2 CodeY 专用错误码（-32000 ~ -32004）

| 错误码    | 名称                  | 说明                                   | 典型场景                          |
| --------- | --------------------- | -------------------------------------- | --------------------------------- |
| `-32000`  | Server Error          | 通用服务端错误                         | 未分类的服务端异常                |
| `-32001`  | Permission Denied     | 权限不足，操作被拒绝                   | ReadOnly 下尝试写文件             |
| `-32002`  | Resource Not Found    | 请求的资源不存在                       | 文件/目录/进程不存在              |
| `-32003`  | Timeout               | 操作超时                               | 命令执行超时、I/O 超时            |
| `-32004`  | Conflict              | 资源状态冲突                           | 文件被锁定、并发编辑冲突          |

### 6.3 错误响应结构

```jsonc
{
  "jsonrpc": "2.0",
  "error": {
    "code": -32001,
    "message": "Permission denied",
    "data": {
      // 附加信息，可选，结构因错误类型而异
      "required": "file.write",
      "currentLevel": "ReadOnly",
      "suggestion": "请先通过 permission.request 提升权限",
      "docs": "https://codey.dev/docs/errors/-32001"
    }
  },
  "id": "req-001"
}
```

### 6.4 错误处理流程

```
┌─────────────┐
│  收到请求    │
└──────┬──────┘
       │
       ▼
┌─────────────┐    否     ┌──────────────────┐
│ JSON 合法？  │────────>│ 返回 -32700       │
└──────┬──────┘          │ Parse Error       │
       │ 是              └──────────────────┘
       ▼
┌─────────────┐    否     ┌──────────────────┐
│ 方法存在？   │────────>│ 返回 -32601       │
└──────┬──────┘          │ Method Not Found  │
       │ 是              └──────────────────┘
       ▼
┌─────────────┐    否     ┌──────────────────┐
│ 参数合法？   │────────>│ 返回 -32602       │
└──────┬──────┘          │ Invalid Params    │
       │ 是              └──────────────────┘
       ▼
┌─────────────┐    否     ┌──────────────────┐
│ 权限足够？   │────────>│ 返回 -32001       │
└──────┬──────┘          │ Permission Denied │
       │ 是              └──────────────────┘
       ▼
┌─────────────┐    否     ┌──────────────────┐
│ 执行成功？   │────────>│ 返回对应错误码    │
└──────┬──────┘          └──────────────────┘
       │ 是
       ▼
┌─────────────┐
│ 返回 Result │
└─────────────┘
```

## 7. 可扩展性设计

### 7.1 Method Namespace 机制

协议通过 `namespace.action` 命名约定实现功能模块化。任何模块都可以注册自己的 namespace 而不会与其他模块冲突。

```
内置 Namespaces：
  agent.*       Agent 生命周期管理
  file.*        文件系统操作
  shell.*       命令执行
  permission.*  权限管理
  stream.*      流式传输（内部）

扩展示例：
  git.*         Git 操作（git.status, git.commit, git.push）
  db.*          数据库操作（db.query, db.migrate）
  docker.*      容器管理（docker.build, docker.run）
  custom.*      用户自定义扩展
```

### 7.2 Capability 协商

初始化阶段，Client 和 Server 通过 `agent.initialize` 交换能力声明，确保双方对支持的功能达成共识。

```jsonc
// Client 声明能力
{
  "capabilities": {
    "streaming": true,          // 支持流式传输
    "fileOps": ["read", "write", "edit", "search"],
    "shell": true,
    "maxMessageSize": 4194304,  // 4MB
    "extensions": ["git", "docker"]  // 声明支持的扩展
  }
}

// Server 响应能力
{
  "capabilities": {
    "fileSystem": true,
    "shell": true,
    "sandbox": "desktop",
    "permissionModel": "7-level",
    "extensions": ["git"],      // Server 支持的扩展子集
    "maxConcurrentRequests": 10
  }
}
```

### 7.3 扩展注册协议

第三方扩展可通过 `extension.register` 方法动态注册：

```jsonc
{
  "method": "extension.register",
  "params": {
    "namespace": "git",
    "methods": [
      {
        "name": "git.status",
        "description": "获取 Git 工作区状态",
        "params": {
          "workdir": { "type": "string", "required": true }
        },
        "returns": {
          "type": "object",
          "properties": {
            "branch": { "type": "string" },
            "changes": { "type": "array" }
          }
        },
        "permission": "ReadOnly"
      }
    ]
  },
  "id": "ext-1"
}
```

### 7.4 版本兼容性

- 协议版本遵循 **SemVer** 规范
- Minor 版本新增功能，不破坏兼容
- Major 版本变更可能包含 breaking changes
- Client 和 Server 版本不兼容时，握手阶段即返回错误

```
版本兼容矩阵：
┌────────────────┬────────────────┬──────────────┐
│ Client Version │ Server Version │ 结果         │
├────────────────┼────────────────┼──────────────┤
│ 1.0.x          │ 1.0.x ~ 1.y.x │ 兼容         │
│ 1.0.x          │ 2.0.x          │ 不兼容       │
│ 2.0.x          │ 1.0.x          │ 不兼容       │
└────────────────┴────────────────┴──────────────┘
```

## 8. 安全考量

### 8.1 消息验证

- 所有入站消息必须通过 JSON Schema 验证
- `method` 名称仅允许 `[a-z][a-z0-9]*\.[a-z][a-z0-9._]*` 格式
- `id` 字段长度上限 128 字符
- 单条消息超过 4MB 立即拒绝，返回 `-32700`

### 8.2 重放防护

- 每个 `id` 在同一会话中必须唯一
- 服务端维护最近 1000 个已处理的 id 集合
- 重复 id 返回 `-32600` Invalid Request

### 8.3 资源限制

```jsonc
// 服务端可配置的限制
{
  "limits": {
    "maxMessageSize": 4194304,       // 4MB
    "maxConcurrentRequests": 10,
    "requestTimeout": 300000,        // 5 分钟
    "streamChunkSize": 65536,        // 64KB
    "maxStreamDuration": 600000,     // 10 分钟
    "maxFileSize": 52428800          // 50MB
  }
}
```

---

*本文档将随 CodeY 项目迭代持续更新。如有疑问或建议，请提交至项目 Issue Tracker。*
