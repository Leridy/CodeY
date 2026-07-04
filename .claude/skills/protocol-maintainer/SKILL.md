---
name: protocol-maintainer
description: 在查询 CodeY Agent Protocol 的方法定义、验证 JSON-RPC 消息、查找错误码或扩展协议时使用此 skill。触发关键词："协议"、"protocol"、"JSON-RPC"、"method"、"error code"、"传输层"、"IPC"、"WebSocket"。
---

# 协议维护 Skill

维护 CodeY Agent Protocol 的协议字典、版本管理和快速查询。

## 何时激活

- 查询 CodeY Agent Protocol 的 method、parameter 或 response 定义
- 验证 JSON-RPC 2.0 消息是否符合协议规范
- 查找错误码含义或添加新错误码
- 扩展协议方法或新增 method category
- 检查协议版本兼容性

## 协议概览

**当前版本**：v1.0.0

**Phase 1 范围**：19 个核心方法

| 分类 | 方法数 | Request | Notification |
|------|--------|---------|--------------|
| Agent | 10 | 4 | 6 |
| File | 5 | 5 | 0 |
| Shell | 4 | 2 | 2 |
| **合计** | **19** | **11** | **8** |

## 传输层

| 传输方式 | 通信模式 | 适用场景 |
|----------|----------|----------|
| Tauri IPC | Request/Response | 桌面应用内部通信 |
| WebSocket | 全双工 | Web 端双向实时通信 |
| HTTP POST | Request/Response | 简单操作、第三方集成 |
| SSE | 单向推送 | 流式响应、实时推送 |

## 方法命名规范

格式：`<category>/<action>`

示例：
- `agent/start` - 启动 Agent
- `file/read` - 读取文件
- `shell/execute` - 执行 Shell 命令

## 错误码范围

- `-32000` 到 `-32099`：标准 JSON-RPC 错误
- `-32100` 到 `-32199`：Agent 错误
- `-32200` 到 `-32299`：File 错误
- `-32300` 到 `-32399`：Shell 错误

## 内置资源

- `dictionary/` - 协议字典
- `transport/` - 传输层规范
- `error-handling/` - 错误处理规范
- `streaming/` - 流式传输规范
- `examples/` - 示例

完整文档见 `README.md`。
