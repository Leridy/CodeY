# Protocol Maintainer

维护 CodeY Agent Protocol 的协议字典、版本管理和快速查询。

## 使用场景

当需要：
- 查询 CodeY Agent Protocol 的 method、parameter 或 response 定义
- 验证 JSON-RPC 2.0 消息是否符合协议规范
- 查找错误码含义或添加新错误码
- 扩展协议方法或新增 method category
- 检查协议版本兼容性
- 查询 Phase 1 实现范围和方法定义
- 了解传输层规范（Tauri IPC、WebSocket、HTTP POST、SSE）
- 了解流式传输规范和错误恢复机制

## 快速开始

```bash
# 查询某个方法的定义
protocol-maintainer lookup agent/start

# 查询某个错误码
protocol-maintainer error -32001

# 验证消息格式
protocol-maintainer validate '{"jsonrpc":"2.0","method":"file/read","params":{"path":"/src/main.rs"},"id":"1"}'

# 查询 Phase 1 方法列表
protocol-maintainer phase1 methods

# 查询传输层规范
protocol-maintainer transport websocket
```

## 文档结构

- [README.md](./README.md) - 完整协议规范
- [dictionary/](./dictionary/) - 协议字典（按方法分类）
  - [phase1-methods.md](./dictionary/phase1-methods.md) - Phase 1 方法完整定义
  - [agent-methods.md](./dictionary/agent-methods.md) - Agent 方法定义
  - [file-methods.md](./dictionary/file-methods.md) - File 方法定义
  - [shell-methods.md](./dictionary/shell-methods.md) - Shell 方法定义
  - [permission-methods.md](./dictionary/permission-methods.md) - Permission 方法定义
  - [error-codes.md](./dictionary/error-codes.md) - 错误码参考
- [transport/](./transport/) - 传输层规范
  - [tauri-ipc.md](./transport/tauri-ipc.md) - Tauri IPC 传输规范
  - [websocket.md](./transport/websocket.md) - WebSocket 传输规范
  - [http-post.md](./transport/http-post.md) - HTTP POST 传输规范
  - [sse.md](./transport/sse.md) - SSE 传输规范
- [error-handling/](./error-handling/) - 错误处理规范
  - [error-codes.md](./error-handling/error-codes.md) - 完整错误码定义（Phase 1）
  - [recovery.md](./error-handling/recovery.md) - 错误恢复机制
- [streaming/](./streaming/) - 流式传输规范
  - [sse-streaming.md](./streaming/sse-streaming.md) - SSE 流式规范
  - [websocket-streaming.md](./streaming/websocket-streaming.md) - WebSocket 流式规范
- [examples/](./examples/) - 示例
  - [basic-request.md](./examples/basic-request.md) - 基础请求/响应示例
  - [streaming.md](./examples/streaming.md) - 流式响应示例
  - [tool-call.md](./examples/tool-call.md) - 工具调用示例

## 协议版本

当前版本：v1.0.0

## Phase 1 范围

Phase 1 覆盖 19 个核心方法：

| 分类 | 方法数 | Request | Notification |
|------|--------|---------|--------------|
| Agent | 10 | 4 | 6 |
| File | 5 | 5 | 0 |
| Shell | 4 | 2 | 2 |
| **合计** | **19** | **11** | **8** |

详见 [phase1-methods.md](./dictionary/phase1-methods.md)

## 传输层

Phase 1 支持 4 种传输方式：

| 传输方式 | 通信模式 | 适用场景 |
|----------|----------|----------|
| Tauri IPC | Request/Response | 桌面应用内部通信 |
| WebSocket | 全双工 | Web 端双向实时通信 |
| HTTP POST | Request/Response | 简单操作、第三方集成 |
| SSE | 单向推送 | 流式响应、实时推送 |

详见 [transport/](./transport/)

## 贡献指南

1. 新增 method：遵循 `<category>/<action>` 命名规范
2. 新增错误码：使用 -32000 到 -32099 范围
3. 版本更新：遵循 Semantic Versioning 规范
4. Phase 1 变更：更新 [phase1-methods.md](./dictionary/phase1-methods.md)
