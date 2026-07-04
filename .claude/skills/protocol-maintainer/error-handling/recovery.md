# 错误恢复机制

> 版本：v1.0.0
> 日期：2026-07-05

## 1. 概述

本文档定义 CodeY Agent Protocol 的错误恢复机制，包括自动重试、降级策略和状态恢复。

### 1.1 设计原则

1. **快速失败**：不可恢复的错误立即返回
2. **自动重试**：可恢复的错误自动重试
3. **优雅降级**：失败时提供替代方案
4. **状态一致**：恢复后保持状态一致

---

## 2. 自动重试策略

### 2.1 可重试错误

| 错误码 | 名称 | 可重试 | 说明 |
|--------|------|--------|------|
| -32003 | LLM Error | 是 | LLM 调用失败 |
| -32004 | Timeout | 是 | 操作超时 |
| -32005 | Rate Limit Exceeded | 是 | 频率超限 |
| -32009 | Transport Error | 是 | 传输层错误 |

### 2.2 重试配置

```rust
struct RetryConfig {
    max_retries: u32,        // 最大重试次数，默认 3
    base_delay_ms: u64,      // 基础延迟，默认 1000ms
    max_delay_ms: u64,       // 最大延迟，默认 30000ms
    backoff_factor: f64,     // 退避因子，默认 2.0
}
```

### 2.3 指数退避算法

```
延迟计算：
delay = min(base_delay * backoff_factor ^ attempt, max_delay)

示例：
- 第 0 次重试：1000ms
- 第 1 次重试：2000ms
- 第 2 次重试：4000ms
```

### 2.4 重试实现

```rust
async fn with_retry<F, Fut, T, E>(
    config: &RetryConfig,
    mut operation: F,
) -> Result<T, E>
where
    F: FnMut() -> Fut,
    Fut: std::future::Future<Output = Result<T, E>>,
    E: IsRetryable,
{
    let mut attempt = 0;

    loop {
        match operation().await {
            Ok(result) => return Ok(result),
            Err(error) => {
                if !error.is_retryable() || attempt >= config.max_retries {
                    return Err(error);
                }

                let delay = calculate_delay(attempt, config);
                tokio::time::sleep(Duration::from_millis(delay)).await;
                attempt += 1;
            }
        }
    }
}
```

### 2.5 Jitter（抖动）

为避免重试风暴，添加随机抖动：

```rust
fn calculate_delay_with_jitter(base_delay_ms: u64, attempt: u32, config: &RetryConfig) -> u64 {
    let exponential_delay = base_delay_ms * (config.backoff_factor.powi(attempt as i32) as u64);
    let capped_delay = std::cmp::min(exponential_delay, config.max_delay_ms);

    // 添加 ±25% 的随机抖动
    let jitter_range = capped_delay / 4;
    let jitter = rand::thread_rng().gen_range(-jitter_range..=jitter_range);

    (capped_delay as i64 + jitter).max(0) as u64
}
```

---

## 3. 降级策略

### 3.1 LLM 降级

```
降级路径：
1. 重试当前模型（最多 3 次）
2. 切换到备用模型
3. 返回错误给用户

模型优先级：
- sonnet-4.6（首选）
- haiku-4.5（轻量快速）
- opus-4.5（深度推理）
```

```rust
struct LlmFallback {
    models: Vec<ModelConfig>,
}

impl LlmFallback {
    async fn complete(&mut self, prompt: &str) -> Result<String, LlmError> {
        for model in &self.models {
            match model.complete(prompt).await {
                Ok(response) => return Ok(response),
                Err(error) => {
                    log::warn!("LLM {} failed: {}", model.name, error);
                }
            }
        }
        Err(LlmError::AllModelsFailed)
    }
}
```

### 3.2 工具降级

```
file/read 失败降级：
1. 重试读取
2. 尝试使用 file/search 查找文件
3. 返回错误给 Agent

shell/execute 失败降级：
1. 重试执行
2. 检查命令是否可用
3. 返回错误给 Agent
```

### 3.3 传输层降级

```
传输降级路径：
1. WebSocket -> SSE
2. SSE -> HTTP POST
3. HTTP POST -> 错误
```

---

## 4. 状态恢复

### 4.1 Agent 崩溃恢复

```
恢复流程：
1. 检测 agent/error 通知
2. 保存当前对话上下文
3. 尝试 agent/start 重启
4. 恢复上下文继续对话
5. 失败则通知用户
```

```rust
struct AgentRecovery {
    context: ConversationContext,
    max_restart_attempts: u32,
}

impl AgentRecovery {
    async fn recover(&mut self, agent_id: &str) -> Result<(), RecoveryError> {
        self.context = save_conversation_context(agent_id).await?;

        for attempt in 0..self.max_restart_attempts {
            match restart_agent(agent_id).await {
                Ok(new_agent_id) => {
                    match restore_context(&new_agent_id, &self.context).await {
                        Ok(()) => return Ok(()),
                        Err(error) => log::warn!("Failed to restore context: {}", error),
                    }
                }
                Err(error) => {
                    log::warn!("Restart attempt {} failed: {}", attempt + 1, error);
                    tokio::time::sleep(Duration::from_secs(2u64.pow(attempt))).await;
                }
            }
        }

        Err(RecoveryError::MaxAttemptsExceeded)
    }
}
```

### 4.2 连接恢复

```
WebSocket 恢复流程：
1. 检测连接断开
2. 等待指数退避时间
3. 重新建立连接
4. 发送 protocol/handshake
5. 发送 protocol/reconnect（带 session_id）
6. 恢复消息流
```

### 4.3 会话持久化

```rust
struct SessionPersistence {
    storage: Box<dyn SessionStorage>,
}

impl SessionPersistence {
    async fn save_session(&self, session: &Session) -> Result<(), StorageError> {
        let snapshot = SessionSnapshot {
            session_id: session.id.clone(),
            agent_id: session.agent_id.clone(),
            messages: session.messages.clone(),
            state: session.state.clone(),
            timestamp: chrono::Utc::now(),
        };
        self.storage.save(&snapshot).await
    }

    async fn load_session(&self, session_id: &str) -> Result<Option<Session>, StorageError> {
        self.storage.load(session_id).await
    }
}
```

---

## 5. 最佳实践

### 5.1 客户端错误处理

```typescript
async function sendWithRecovery(
  method: string,
  params: any,
  config: RetryConfig = defaultRetryConfig
): Promise<any> {
  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      const response = await sendRequest(method, params);

      if (response.error) {
        const error = new JsonRpcError(response.error);
        if (!error.isRetryable || attempt >= config.maxRetries) {
          throw error;
        }
        await sleep(calculateDelay(attempt, config));
        continue;
      }

      return response.result;
    } catch (error) {
      if (attempt < config.maxRetries) {
        await sleep(calculateDelay(attempt, config));
      } else {
        throw error;
      }
    }
  }
}
```

### 5.2 监控和告警

| 指标 | 阈值 | 说明 |
|------|------|------|
| 错误率 | > 10%/分钟 | 需要关注 |
| 重试率 | > 30%/分钟 | 需要调查 |
| LLM 失败率 | > 5%/分钟 | 检查 API 状态 |
| 连接断开率 | > 1%/分钟 | 检查网络 |

---

*错误恢复机制 v1.0.0*
*创建日期：2026-07-05*
