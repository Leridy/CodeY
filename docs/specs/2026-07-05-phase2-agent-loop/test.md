# Phase 2.4 Agent Loop 测试计划

> 日期：2026-07-05
> 版本：v1.0.0

## 1. 测试策略

### 1.1 测试目标

- 验证 Agent Loop 核心循环的正确性
- 验证工具调用适配器的格式转换准确性
- 验证流式响应的实时性和完整性
- 验证上下文管理（内存 + 数据库持久化）

### 1.2 测试类型

| 类型 | 说明 | 工具 |
|------|------|------|
| 单元测试 | 测试单个函数/模块 | cargo test |
| 集成测试 | 测试模块间交互 | cargo test --test |
| Mock 测试 | 使用 mock 替代 LLM 提供商 | mockall crate |

---

## 2. 单元测试

### 2.1 AgentContext 测试

- test_context_creation - 创建上下文
- test_add_user_message - 添加用户消息
- test_context_serialization_roundtrip - 序列化往返

### 2.2 FunctionCallingAdapter 测试

- test_to_openai_tools_format - OpenAI 工具格式转换
- test_parse_tool_calls - 解析工具调用

### 2.3 StreamManager 测试

- test_stream_lifecycle - 流式生命周期
- test_send_content_delta - 发送内容增量

---

## 3. 集成测试

### 3.1 AgentLoop 主循环测试

- test_simple_chat_no_tools - 简单对话无工具
- test_single_tool_call_round - 单轮工具调用
- test_max_tool_rounds_exceeded - 超过最大轮次

### 3.2 ContextStore 集成测试

- test_in_memory_store_save_and_load - 内存存储
- test_sqlite_store_save_and_load - SQLite 存储

---

## 4. 测试覆盖率目标

| 模块 | 目标覆盖率 |
|------|-----------|
| agent::context | 95% |
| agent::stream | 90% |
| agent::loop | 85% |
| tools::adapters | 95% |

总体目标: 85%+ 代码覆盖率

---

## 5. 测试执行命令

```bash
cargo test -p codey-core --lib agent
cargo test -p codey-core --lib tools::adapters
cargo test -p codey-core
```

---

*测试计划版本: v1.0.0*
*最后更新: 2026-07-05*
