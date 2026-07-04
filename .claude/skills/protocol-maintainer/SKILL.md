# Protocol Maintainer

维护 CodeY Agent Protocol 的协议字典、版本管理和快速查询。

## 使用场景

当需要：
- 查询 CodeY Agent Protocol 的 method、parameter 或 response 定义
- 验证 JSON-RPC 2.0 消息是否符合协议规范
- 查找错误码含义或添加新错误码
- 扩展协议方法或新增 method category
- 检查协议版本兼容性

## 快速开始

```bash
# 查询某个方法的定义
protocol-maintainer lookup agent/start

# 查询某个错误码
protocol-maintainer error -32001

# 验证消息格式
protocol-maintainer validate '{"jsonrpc":"2.0","method":"file/read","params":{"path":"/src/main.rs"},"id":"1"}'
```

## 文档结构

- [README.md](./README.md) - 完整协议规范
- [dictionary/](./dictionary/) - 协议字典（按方法分类）
  - [agent-methods.md](./dictionary/agent-methods.md) - Agent 方法定义
  - [file-methods.md](./dictionary/file-methods.md) - File 方法定义
  - [shell-methods.md](./dictionary/shell-methods.md) - Shell 方法定义
  - [permission-methods.md](./dictionary/permission-methods.md) - Permission 方法定义
  - [error-codes.md](./dictionary/error-codes.md) - 错误码参考
- [examples/](./examples/) - 示例
  - [basic-request.md](./examples/basic-request.md) - 基础请求/响应示例
  - [streaming.md](./examples/streaming.md) - 流式响应示例
  - [tool-call.md](./examples/tool-call.md) - 工具调用示例

## 协议版本

当前版本：v1.0.0

## 贡献指南

1. 新增 method：遵循 `<category>/<action>` 命名规范
2. 新增错误码：使用 -32000 到 -32099 范围
3. 版本更新：遵循 Semantic Versioning 规范
