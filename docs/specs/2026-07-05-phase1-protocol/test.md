# Phase 1 测试规范

> 日期：2026-07-05
> 版本：v1.0.0
> 测试框架：Rust `#[cfg(test)]` + `cargo test`

## 1. 概述

Phase 1 采用 TDD（Test-Driven Development）驱动开发，确保协议实现的可靠性和可测试性。本文档定义测试工作流、测试用例设计和覆盖率目标。

### 1.1 测试原则

1. **测试先行**：先写测试，再写实现
2. **小步迭代**：每个测试验证一个行为
3. **独立隔离**：测试之间无依赖
4. **快速反馈**：单元测试 < 100ms
5. **可读性**：测试即文档

---

## 2. TDD 工作流

### 2.1 三步循环

```
┌─────────────────────────────────────────────┐
│                                             │
│  1. RED（编写失败测试）                      │
│     - 定义接口行为                           │
│     - 编写测试用例                           │
│     - 运行测试，确认失败                     │
│                    │                        │
│                    ▼                        │
│  2. GREEN（最小实现）                        │
│     - 编写最小代码使测试通过                 │
│     - 不做额外优化                           │
│     - 运行测试，确认通过                     │
│                    │                        │
│                    ▼                        │
│  3. REFACTOR（重构优化）                     │
│     - 优化代码结构                           │
│     - 提取公共逻辑                           │
│     - 运行测试，确认无回归                   │
│                    │                        │
│                    └──────── 循环 ──────────►│
│                                             │
└─────────────────────────────────────────────┘
```

### 2.2 TDD 实践指南

#### RED 阶段

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_jsonrpc_request() {
        // 定义期望行为
        let input = r#"{"jsonrpc":"2.0","method":"file/read","params":{"path":"/src/main.rs"},"id":"1"}"#;
        let request = parse_jsonrpc(input);

        // 断言
        assert!(request.is_ok());
        let req = request.unwrap();
        assert_eq!(req.method, "file/read");
        assert_eq!(req.id, "1");
    }
}
```

#### GREEN 阶段

```rust
fn parse_jsonrpc(input: &str) -> Result<JsonRpcRequest, ParseError> {
    // 最小实现
    let request: JsonRpcRequest = serde_json::from_str(input)?;
    Ok(request)
}
```

#### REFACTOR 阶段

```rust
fn parse_jsonrpc(input: &str) -> Result<JsonRpcRequest, ParseError> {
    // 优化：添加验证逻辑
    let request: JsonRpcRequest = serde_json::from_str(input)
        .map_err(|e| ParseError::InvalidJson(e))?;

    request.validate()?;
    Ok(request)
}
```

### 2.3 TDD 检查清单

- [ ] 测试是否先于实现编写？
- [ ] 测试是否验证了期望行为？
- [ ] 测试是否独立且可重复？
- [ ] 测试是否快速执行（< 100ms）？
- [ ] 测试是否覆盖了边界条件？
- [ ] 测试是否覆盖了错误路径？
- [ ] 测试是否易于理解？

---

## 3. 测试层次

### 3.1 测试金字塔

```
        ┌───────────┐
        │   E2E     │  少量，验证完整流程
        │   Tests   │
        ├───────────┤
        │Integration│  适量，验证模块交互
        │   Tests   │
        ├───────────┤
        │   Unit    │  大量，验证单个函数
        │   Tests   │
        └───────────┘
```

### 3.2 Unit Tests

**目标**：验证单个函数/方法的行为

**范围**：
- JSON-RPC 解析器
- 方法路由器
- 参数验证器
- 错误处理器
- 工具执行器

**示例**：

```rust
#[cfg(test)]
mod jsonrpc_parser_tests {
    use super::*;

    #[test]
    fn test_parse_valid_request() {
        let input = r#"{"jsonrpc":"2.0","method":"test","id":"1"}"#;
        let result = parse_request(input);
        assert!(result.is_ok());
    }

    #[test]
    fn test_parse_invalid_json() {
        let input = "invalid json";
        let result = parse_request(input);
        assert!(result.is_err());
        assert_eq!(result.unwrap_err().code, -32700);
    }

    #[test]
    fn test_parse_missing_method() {
        let input = r#"{"jsonrpc":"2.0","id":"1"}"#;
        let result = parse_request(input);
        assert!(result.is_err());
        assert_eq!(result.unwrap_err().code, -32600);
    }

    #[test]
    fn test_parse_notification() {
        let input = r#"{"jsonrpc":"2.0","method":"test"}"#;
        let result = parse_notification(input);
        assert!(result.is_ok());
        assert!(result.unwrap().id.is_none());
    }
}
```

### 3.3 Integration Tests

**目标**：验证模块间的交互

**范围**：
- Agent 生命周期（start -> send -> response -> stop）
- 文件操作链（read -> edit -> write）
- Shell 执行链（execute -> output -> exit）
- 权限检查链（check -> request -> grant）

**示例**：

```rust
// tests/integration/agent_lifecycle.rs

#[tokio::test]
async fn test_agent_lifecycle() {
    // 启动 Agent
    let start_result = handle_request(json!({
        "jsonrpc": "2.0",
        "method": "agent/start",
        "params": { "model": "sonnet-4.6" },
        "id": "1"
    })).await;

    let agent_id = start_result["result"]["agent_id"].as_str().unwrap();

    // 发送消息
    let send_result = handle_request(json!({
        "jsonrpc": "2.0",
        "method": "agent/send",
        "params": { "agent_id": agent_id, "message": "Hello" },
        "id": "2"
    })).await;

    assert!(send_result["result"]["message_id"].is_string());

    // 停止 Agent
    let stop_result = handle_request(json!({
        "jsonrpc": "2.0",
        "method": "agent/stop",
        "params": { "agent_id": agent_id },
        "id": "3"
    })).await;

    assert_eq!(stop_result["result"]["status"], "stopped");
}
```

### 3.4 E2E Tests

**目标**：验证完整用户流程

**范围**：
- 用户发送消息 -> Agent 回复
- Agent 调用工具 -> 工具执行 -> 结果返回
- 流式响应完整流程
- 错误处理和恢复

**示例**：

```rust
// tests/e2e/chat_flow.rs

#[tokio::test]
async fn test_chat_flow() {
    let client = TestClient::new().await;

    // 启动 Agent
    let agent = client.start_agent("sonnet-4.6").await;

    // 发送消息并收集流式响应
    let chunks = client.send_message_streaming(
        &agent.id,
        "解释 Rust 的所有权系统"
    ).await;

    // 验证流式响应
    assert!(chunks.len() > 1);
    assert!(chunks.last().unwrap().done);

    // 停止 Agent
    client.stop_agent(&agent.id).await;
}
```

---

## 4. 测试用例设计

### 4.1 协议解析测试

| 测试用例 | 描述 | 期望结果 |
|----------|------|----------|
| 有效 Request | 完整的 JSON-RPC 请求 | 解析成功 |
| 有效 Notification | 无 id 的 JSON-RPC 消息 | 解析成功 |
| 无效 JSON | 非 JSON 字符串 | 返回 -32700 |
| 缺少 jsonrpc | 无 jsonrpc 字段 | 返回 -32600 |
| 缺少 method | 无 method 字段 | 返回 -32600 |
| 错误的 jsonrpc | jsonrpc 值非 "2.0" | 返回 -32600 |
| 超大消息 | > 4MB 的消息 | 返回 -32700 |
| 空消息 | 空字符串 | 返回 -32700 |

### 4.2 Agent 方法测试

| 测试用例 | 描述 | 期望结果 |
|----------|------|----------|
| start 正常 | 有效参数启动 | 返回 agent_id |
| start 缺少 model | 无 model 参数 | 返回 -32602 |
| start 无效 model | 不支持的模型 | 返回 -32000 |
| stop 正常 | 有效 agent_id | 返回 stopped |
| stop 不存在 | 无效 agent_id | 返回 -32000 |
| send 正常 | 有效消息 | 返回 message_id |
| send 不存在的 agent | 无效 agent_id | 返回 -32000 |
| cancel 正常 | 有效 agent_id | 返回 cancelled |
| response 流式 | 多个 chunk | 正确合并 |
| response 中断 | cancel 后的 response | 正确处理 |

### 4.3 File 方法测试

| 测试用例 | 描述 | 期望结果 |
|----------|------|----------|
| read 正常 | 存在的文件 | 返回内容 |
| read 不存在 | 不存在的文件 | 返回 -32002 |
| read 权限不足 | 无权限文件 | 返回 -32001 |
| read offset/limit | 分页读取 | 返回指定行 |
| write 正常 | 有效内容 | 返回 bytes_written |
| write 创建目录 | create_dirs=true | 自动创建父目录 |
| edit 正常 | 匹配的 old_string | 返回 replacements=1 |
| edit 未找到 | 不匹配的 old_string | 返回 -32002 |
| search 正常 | 有效正则 | 返回匹配列表 |
| list 正常 | 有效目录 | 返回 entries |

### 4.4 Shell 方法测试

| 测试用例 | 描述 | 期望结果 |
|----------|------|----------|
| execute 正常 | 有效命令 | 返回 exit_code=0 |
| execute 超时 | 长时间命令 | 返回 -32004 |
| execute 权限 | 危险命令 | 返回 -32001 |
| execute 后台 | background=true | 返回 process_id |
| output 流式 | 命令输出 | 正确接收 |
| exit 正常 | 命令退出 | 收到 exit 通知 |
| kill 正常 | 终止进程 | 返回 killed=true |

### 4.5 错误处理测试

| 测试用例 | 描述 | 期望结果 |
|----------|------|----------|
| 方法不存在 | 调用未定义方法 | 返回 -32601 |
| 参数类型错误 | 错误的参数类型 | 返回 -32602 |
| 参数缺失 | 缺少必填参数 | 返回 -32602 |
| 内部错误 | 未捕获异常 | 返回 -32603 |
| 权限不足 | 未授权操作 | 返回 -32001 |
| 超时 | 操作超时 | 返回 -32004 |
| 重试成功 | 可重试错误 | 自动重试成功 |
| 重试失败 | 重试次数超限 | 返回错误 |

### 4.6 流式传输测试

| 测试用例 | 描述 | 期望结果 |
|----------|------|----------|
| SSE 流式 | SSE 连接 | 正确接收事件 |
| WebSocket 流式 | WS 连接 | 双向通信 |
| 流式中断 | 中途断开 | 正确清理 |
| 流式重连 | 断开后重连 | 恢复会话 |
| 心跳保活 | 长时间连接 | 维持连接 |
| 并发流式 | 多个 Agent | 正确隔离 |

---

## 5. 覆盖率目标

### 5.1 整体目标

| 指标 | 目标 | 说明 |
|------|------|------|
| 行覆盖率 | >= 85% | 代码行执行比例 |
| 分支覆盖率 | >= 80% | 条件分支执行比例 |
| 函数覆盖率 | >= 90% | 函数调用比例 |

### 5.2 模块覆盖率

| 模块 | 目标 | 优先级 |
|------|------|--------|
| 协议解析 | 95% | 高 |
| 方法路由 | 90% | 高 |
| Agent 方法 | 85% | 高 |
| File 方法 | 85% | 高 |
| Shell 方法 | 85% | 高 |
| 错误处理 | 90% | 高 |
| 传输层 | 80% | 中 |
| 流式支持 | 80% | 中 |

### 5.3 覆盖率检查

```bash
# 生成覆盖率报告
cargo llvm-cov --html

# 查看覆盖率
open target/llvm-cov/html/index.html

# CI 检查
cargo llvm-cov --fail-under-lines 85
```

---

## 6. 测试工具

### 6.1 单元测试

```rust
// 使用 #[cfg(test)] 模块
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_function() {
        // 测试逻辑
    }

    #[tokio::test]
    async fn test_async_function() {
        // 异步测试逻辑
    }
}
```

### 6.2 集成测试

```rust
// tests/integration/ 目录
// 每个文件是一个独立的集成测试

#[tokio::test]
async fn test_module_interaction() {
    // 测试模块间交互
}
```

### 6.3 测试辅助工具

```rust
// tests/common/mod.rs

pub struct TestClient {
    // 测试客户端
}

impl TestClient {
    pub async fn new() -> Self { ... }
    pub async fn send_request(&self, method: &str, params: Value) -> Value { ... }
    pub async fn start_agent(&self, model: &str) -> Agent { ... }
    pub async fn stop_agent(&self, agent_id: &str) { ... }
}

pub fn create_test_agent() -> Agent { ... }
pub fn create_test_file(path: &str) { ... }
pub fn cleanup_test_files() { ... }
```

### 6.4 Mock 和 Stub

```rust
// 使用 mockall crate
use mockall::mock;

mock! {
    pub LlmClient {
        async fn complete(&self, prompt: &str) -> Result<String, LlmError>;
    }
}

#[tokio::test]
async fn test_with_mock() {
    let mut mock = MockLlmClient::new();
    mock.expect_complete()
        .returning(|_| Ok("mocked response".to_string()));

    let agent = Agent::new(mock);
    let result = agent.send("test").await;
    assert_eq!(result.content, "mocked response");
}
```

---

## 7. 测试执行

### 7.1 命令参考

```bash
# 运行所有测试
cargo test

# 运行特定模块测试
cargo test jsonrpc_parser

# 运行特定测试
cargo test test_parse_valid_request

# 运行集成测试
cargo test --test integration

# 运行 E2E 测试
cargo test --test e2e

# 显示测试输出
cargo test -- --nocapture

# 运行失败的测试
cargo test -- --failed

# 并行执行
cargo test -- --test-threads=4
```

### 7.2 CI 配置

```yaml
# .github/workflows/test.yml

name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: dtolnay/rust-toolchain@stable
      - run: cargo test
      - run: cargo llvm-cov --fail-under-lines 85
```

---

## 8. 测试报告

### 8.1 报告格式

```
测试执行报告
============

总测试数：156
通过：152
失败：2
跳过：2

覆盖率：
- 行覆盖率：87.5%
- 分支覆盖率：82.3%
- 函数覆盖率：91.2%

失败测试：
1. test_shell_timeout - 超时处理未正确实现
2. test_streaming_reconnect - 重连逻辑有 bug
```

### 8.2 报告工具

- **cargo test**：基础测试报告
- **cargo llvm-cov**：覆盖率报告
- **nextest**：更快的测试运行器

---

*Phase 1 测试规范 v1.0.0*
*创建日期：2026-07-05*
