# Phase 2.1 LLM Provider 测试文档

> 最后更新：2026-07-05
> 测试框架：Rust 内置测试 + tokio::test

---

## 测试策略

### 测试金字塔

```
        +-----------------+
        |   E2E Tests     |  <-- 关键用户流程
        |     (10%)       |
        +-----------------+
        | Integration     |  <-- Provider 真实调用
        |   Tests (30%)   |
        +-----------------+
        |   Unit Tests    |  <-- 核心逻辑
        |     (60%)       |
        +-----------------+
```

### 测试原则

1. **Mock 外部依赖** - 单元测试使用 mock HTTP 响应
2. **真实 API 集成** - 集成测试使用真实 API（可选跳过）
3. **错误场景覆盖** - 测试各种错误情况
4. **流式响应测试** - 验证 SSE 解析正确性

---

## 单元测试用例

### 1. 核心类型测试 (16 个)

#### Message 类型

| 测试 ID | 测试名称 | 描述 |
|---------|---------|------|
| UT-001 | `test_message_system_creation` | 验证 system 消息创建 |
| UT-002 | `test_message_user_creation` | 验证 user 消息创建 |
| UT-003 | `test_message_assistant_creation` | 验证 assistant 消息创建 |
| UT-004 | `test_message_tool_creation` | 验证 tool 消息创建 |
| UT-005 | `test_message_serialization` | 验证 JSON 序列化 |
| UT-006 | `test_message_deserialization` | 验证 JSON 反序列化 |

#### ChatRequest 类型

| 测试 ID | 测试名称 | 描述 |
|---------|---------|------|
| UT-007 | `test_chat_request_builder` | 验证 builder 模式 |
| UT-008 | `test_chat_request_with_tools` | 验证工具添加 |
| UT-009 | `test_chat_request_defaults` | 验证默认值设置 |

#### Tool 类型

| 测试 ID | 测试名称 | 描述 |
|---------|---------|------|
| UT-010 | `test_tool_creation` | 验证工具创建 |
| UT-011 | `test_tool_serialization` | 验证 JSON Schema 序列化 |
| UT-012 | `test_tool_call_parsing` | 验证工具调用解析 |

#### StreamChunk 类型

| 测试 ID | 测试名称 | 描述 |
|---------|---------|------|
| UT-013 | `test_stream_chunk_content` | 验证内容块解析 |
| UT-014 | `test_stream_chunk_tool_call` | 验证工具调用块解析 |
| UT-015 | `test_stream_chunk_done` | 验证结束块解析 |
| UT-016 | `test_stream_chunk_error` | 验证错误块处理 |

---

### 2. OpenAI Provider 测试 (14 个)

#### 初始化测试

| 测试 ID | 测试名称 | 描述 |
|---------|---------|------|
| UT-017 | `test_openai_provider_creation` | 验证 Provider 创建 |
| UT-018 | `test_openai_provider_id` | 验证 ID 返回 |
| UT-019 | `test_openai_provider_name` | 验证名称返回 |

#### 请求构建测试

| 测试 ID | 测试名称 | 描述 |
|---------|---------|------|
| UT-020 | `test_openai_build_request_body` | 验证请求体构建 |
| UT-021 | `test_openai_build_request_with_tools` | 验证带工具的请求构建 |
| UT-022 | `test_openai_build_request_headers` | 验证请求头构建 |

#### 响应解析测试

| 测试 ID | 测试名称 | 描述 |
|---------|---------|------|
| UT-023 | `test_openai_parse_response` | 验证响应解析 |
| UT-024 | `test_openai_parse_response_with_tool_calls` | 验证工具调用响应解析 |
| UT-025 | `test_openai_parse_usage` | 验证 usage 统计解析 |

#### 流式响应测试

| 测试 ID | 测试名称 | 描述 |
|---------|---------|------|
| UT-026 | `test_openai_parse_stream_chunk` | 验证流式块解析 |
| UT-027 | `test_openai_parse_stream_tool_call` | 验证流式工具调用解析 |
| UT-028 | `test_openai_parse_stream_done` | 验证流式结束解析 |

#### 错误处理测试

| 测试 ID | 测试名称 | 描述 |
|---------|---------|------|
| UT-029 | `test_openai_api_error_response` | 验证 API 错误处理 |
| UT-030 | `test_openai_network_error` | 验证网络错误处理 |

---

### 3. Anthropic Provider 测试 (14 个)

#### 初始化测试

| 测试 ID | 测试名称 | 描述 |
|---------|---------|------|
| UT-031 | `test_anthropic_provider_creation` | 验证 Provider 创建 |
| UT-032 | `test_anthropic_provider_id` | 验证 ID 返回 |
| UT-033 | `test_anthropic_provider_name` | 验证名称返回 |

#### 请求构建测试

| 测试 ID | 测试名称 | 描述 |
|---------|---------|------|
| UT-034 | `test_anthropic_build_request_body` | 验证请求体构建 |
| UT-035 | `test_anthropic_build_request_with_tools` | 验证带工具的请求构建 |
| UT-036 | `test_anthropic_build_request_headers` | 验证请求头构建 |

#### 响应解析测试

| 测试 ID | 测试名称 | 描述 |
|---------|---------|------|
| UT-037 | `test_anthropic_parse_response` | 验证响应解析 |
| UT-038 | `test_anthropic_parse_response_with_tool_use` | 验证工具使用响应解析 |
| UT-039 | `test_anthropic_parse_usage` | 验证 usage 统计解析 |

#### 流式响应测试

| 测试 ID | 测试名称 | 描述 |
|---------|---------|------|
| UT-040 | `test_anthropic_parse_stream_chunk` | 验证流式块解析 |
| UT-041 | `test_anthropic_parse_stream_tool_use` | 验证流式工具使用解析 |
| UT-042 | `test_anthropic_parse_stream_done` | 验证流式结束解析 |

#### 错误处理测试

| 测试 ID | 测试名称 | 描述 |
|---------|---------|------|
| UT-043 | `test_anthropic_api_error_response` | 验证 API 错误处理 |
| UT-044 | `test_anthropic_rate_limit_error` | 验证速率限制错误处理 |

---

### 4. Ollama Provider 测试 (12 个)

#### 初始化测试

| 测试 ID | 测试名称 | 描述 |
|---------|---------|------|
| UT-045 | `test_ollama_provider_creation` | 验证 Provider 创建 |
| UT-046 | `test_ollama_provider_id` | 验证 ID 返回 |
| UT-047 | `test_ollama_provider_name` | 验证名称返回 |

#### 请求构建测试

| 测试 ID | 测试名称 | 描述 |
|---------|---------|------|
| UT-048 | `test_ollama_build_request_body` | 验证请求体构建 |
| UT-049 | `test_ollama_build_request_with_tools` | 验证带工具的请求构建 |

#### 响应解析测试

| 测试 ID | 测试名称 | 描述 |
|---------|---------|------|
| UT-050 | `test_ollama_parse_response` | 验证响应解析 |
| UT-051 | `test_ollama_parse_response_with_tools` | 验证工具调用响应解析 |

#### 流式响应测试

| 测试 ID | 测试名称 | 描述 |
|---------|---------|------|
| UT-052 | `test_ollama_parse_stream_chunk` | 验证流式块解析 |
| UT-053 | `test_ollama_parse_stream_done` | 验证流式结束解析 |

#### 扩展功能测试

| 测试 ID | 测试名称 | 描述 |
|---------|---------|------|
| UT-054 | `test_ollama_list_models` | 验证模型列表获取 |
| UT-055 | `test_ollama_pull_model` | 验证模型拉取 |

#### 错误处理测试

| 测试 ID | 测试名称 | 描述 |
|---------|---------|------|
| UT-056 | `test_ollama_connection_error` | 验证连接错误处理 |

---

### 5. ProviderRegistry 测试 (10 个)

| 测试 ID | 测试名称 | 描述 |
|---------|---------|------|
| UT-057 | `test_registry_creation` | 验证注册中心创建 |
| UT-058 | `test_registry_register` | 验证 Provider 注册 |
| UT-059 | `test_registry_get` | 验证 Provider 获取 |
| UT-060 | `test_registry_get_nonexistent` | 验证不存在时返回 None |
| UT-061 | `test_registry_list` | 验证 Provider 列表 |
| UT-062 | `test_registry_has` | 验证 Provider 存在检查 |
| UT-063 | `test_registry_remove` | 验证 Provider 移除 |
| UT-064 | `test_registry_remove_nonexistent` | 验证移除不存在的 Provider |
| UT-065 | `test_registry_overwrite` | 验证覆盖注册 |
| UT-066 | `test_registry_health_check_all` | 验证批量健康检查 |

---

### 6. DbProviderLoader 测试 (10 个)

| 测试 ID | 测试名称 | 描述 |
|---------|---------|------|
| UT-067 | `test_db_loader_creation` | 验证加载器创建 |
| UT-068 | `test_db_loader_initialize` | 验证数据库初始化 |
| UT-069 | `test_db_loader_save_provider` | 验证配置保存 |
| UT-070 | `test_db_loader_load_providers` | 验证配置加载 |
| UT-071 | `test_db_loader_load_provider_by_id` | 验证按 ID 加载 |
| UT-072 | `test_db_loader_delete_provider` | 验证配置删除 |
| UT-073 | `test_db_loader_update_provider` | 验证配置更新 |
| UT-074 | `test_db_loader_load_enabled_only` | 验证只加载启用的配置 |
| UT-075 | `test_db_loader_duplicate_id` | 验证重复 ID 处理 |
| UT-076 | `test_db_loader_concurrent_access` | 验证并发访问安全 |

---

### 7. 错误处理测试 (6 个)

| 测试 ID | 测试名称 | 描述 |
|---------|---------|------|
| UT-077 | `test_error_network_timeout` | 验证网络超时错误 |
| UT-078 | `test_error_api_authentication` | 验证认证错误 |
| UT-079 | `test_error_api_rate_limit` | 验证速率限制错误 |
| UT-080 | `test_error_invalid_model` | 验证无效模型错误 |
| UT-081 | `test_error_malformed_response` | 验证响应格式错误 |
| UT-082 | `test_error_stream_interruption` | 验证流式中断错误 |

---

### 8. 集成测试 (6 个)

| 测试 ID | 测试名称 | 描述 |
|---------|---------|------|
| IT-001 | `integration_openai_chat` | OpenAI 真实 API 调用 |
| IT-002 | `integration_openai_chat_stream` | OpenAI 流式 API 调用 |
| IT-003 | `integration_anthropic_chat` | Anthropic 真实 API 调用 |
| IT-004 | `integration_anthropic_chat_stream` | Anthropic 流式 API 调用 |
| IT-005 | `integration_ollama_chat` | Ollama 本地 API 调用 |
| IT-006 | `integration_ollama_chat_stream` | Ollama 流式 API 调用 |

---

## 测试覆盖率目标

### 整体覆盖率

| 模块 | 目标覆盖率 | 当前覆盖率 |
|------|-----------|-----------|
| 核心类型 | 95% | 92% |
| OpenAI Provider | 90% | 88% |
| Anthropic Provider | 90% | 85% |
| Ollama Provider | 85% | 82% |
| ProviderRegistry | 95% | 93% |
| DbProviderLoader | 90% | 87% |
| **整体** | **90%** | **88%** |

### 覆盖率检查

```bash
# 生成覆盖率报告
cargo llvm-cov --html

# 查看报告
open target/llvm-cov/html/index.html
```

---

## 测试运行命令

### 运行所有测试

```bash
# 运行所有单元测试
cargo test

# 运行所有测试（包括集成测试）
cargo test -- --include-ignored
```

### 运行特定测试

```bash
# 运行特定模块测试
cargo test llm::providers::openai

# 运行特定测试函数
cargo test test_openai_provider_creation

# 运行匹配模式的测试
cargo test test_openai_*
```

### 运行集成测试

```bash
# 运行集成测试（需要真实 API）
cargo test --test integration -- --ignored

# 只运行 OpenAI 集成测试
cargo test --test integration openai -- --ignored
```

### 并行测试

```bash
# 使用 4 个线程并行运行
cargo test -- --test-threads=4
```

### 测试输出

```bash
# 显示 println! 输出
cargo test -- --nocapture

# 显示测试执行时间
cargo test -- --report-time
```

---

## Mock 策略

### HTTP Mock

使用 `mockall` 库进行 HTTP 请求 mock：

```rust
use mockall::predicate::*;
use mockall::mock;

mock! {
    pub HttpClient {
        async fn post(&self, url: &str) -> Result<Response>;
    }
}

#[tokio::test]
async fn test_openai_chat_with_mock() {
    let mut mock_client = MockHttpClient::new();

    mock_client
        .expect_post()
        .with(eq("https://api.openai.com/v1/chat/completions"))
        .times(1)
        .returning(|_| {
            Ok(Response::builder()
                .status(200)
                .body(r#"{"choices":[{"message":{"content":"Hello!"}}]}"#)
                .unwrap())
        });

    let provider = OpenAIProvider::with_client(mock_client);
    let response = provider.chat(request).await.unwrap();

    assert_eq!(response.message.content.unwrap(), "Hello!");
}
```

### 测试 Fixture

```rust
// 测试数据 fixtures
mod fixtures {
    use super::*;

    pub fn openai_config() -> ProviderConfig {
        ProviderConfig {
            id: "test-openai".to_string(),
            name: "Test OpenAI".to_string(),
            provider_type: ProviderType::OpenAI,
            api_key: Some("test-key".to_string()),
            api_base: None,
            default_model: Some("gpt-4".to_string()),
            is_enabled: true,
        }
    }

    pub fn sample_chat_request() -> ChatRequest {
        ChatRequest::new("gpt-4", vec![
            Message::user("Hello"),
        ])
    }

    pub fn sample_chat_response_json() -> &'static str {
        r#"{
            "id": "chatcmpl-123",
            "model": "gpt-4",
            "choices": [{
                "message": {
                    "role": "assistant",
                    "content": "Hi there!"
                },
                "finish_reason": "stop"
            }],
            "usage": {
                "prompt_tokens": 10,
                "completion_tokens": 5,
                "total_tokens": 15
            }
        }"#
    }
}
```

---

## 测试环境配置

### 环境变量

```bash
# .env.test
OPENAI_API_KEY=sk-test-key
ANTHROPIC_API_KEY=sk-ant-test-key
OLLAMA_BASE_URL=http://localhost:11434
DATABASE_URL=sqlite::memory:
```

### 测试配置

```toml
# Cargo.toml
[dev-dependencies]
mockall = "0.11"
tokio-test = "0.4"
tempfile = "3.0"
dotenv = "0.15"
```

---

## CI/CD 集成

### GitHub Actions

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Install Rust
        uses: dtolnay/rust-toolchain@stable

      - name: Run unit tests
        run: cargo test

      - name: Run coverage
        run: cargo llvm-cov --lcov --output-path lcov.info

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: lcov.info
```

---

## 测试清单

### 新功能测试检查

- [ ] 单元测试覆盖所有公共 API
- [ ] 边界条件测试
- [ ] 错误场景测试
- [ ] 流式响应测试（如适用）
- [ ] Mock 外部依赖
- [ ] 集成测试（可选）

### 测试质量检查

- [ ] 测试名称清晰描述意图
- [ ] 测试独立，无顺序依赖
- [ ] 测试快速执行（< 100ms 每个）
- [ ] 无硬编码超时
- [ ] 正确使用 assertion

---

## 已知测试问题

1. **集成测试不稳定** - 网络问题可能导致超时
2. **Ollama 测试依赖本地服务** - 需要 Ollama 运行
3. **覆盖率工具偶尔误报** - 某些异步代码覆盖统计不准确

---

## 下一步

1. 添加性能基准测试
2. 实现 fuzz testing
3. 添加更多边界条件测试
4. 改进集成测试稳定性
