# Rust 规范

## 代码风格

### 命名约定

```rust
// 变量和函数：snake_case
let user_name = "John"
fn calculate_total(items: &[Item]) -> Decimal { ... }

// 类型和 trait：PascalCase
struct UserProfile { ... }
trait Repository { ... }

// 常量：SCREAMING_SNAKE_CASE
const MAX_RETRY_COUNT: u32 = 3

// 生命周期：小写字母
fn process<'a>(data: &'a str) -> &'a str { ... }
```

### 模块组织

```rust
// 使用 pub(crate) 限制可见性
pub(crate) mod internal {
    pub(crate) fn helper() { ... }
}

// 公开 API 使用 pub
pub mod api {
    pub fn endpoint() { ... }
}
```

## 错误处理

### 自定义错误类型

```rust
use thiserror::Error;

#[derive(Debug, Error)]
pub enum AppError {
    #[error("数据库错误: {0}")]
    Database(#[from] sqlx::Error),
    
    #[error("未找到: {resource} ID={id}")]
    NotFound { resource: String, id: String },
    
    #[error("验证失败: {0}")]
    Validation(String),
    
    #[error("未授权")]
    Unauthorized,
}
```

### Result 使用

```rust
// 使用类型别名简化
pub type AppResult<T> = Result<T, AppError>;

// 函数返回 Result
pub async fn get_user(id: Uuid) -> AppResult<User> {
    let user = sqlx::query_as!(User, "SELECT * FROM users WHERE id = $1", id)
        .fetch_optional(&pool)
        .await?
        .ok_or(AppError::NotFound {
            resource: "User".to_string(),
            id: id.to_string(),
        })?;
    
    Ok(user)
}
```

### 错误传播

```rust
// 使用 ? 操作符传播错误
fn process_data(input: &str) -> AppResult<Data> {
    let parsed = parse(input)?;  // 自动转换错误类型
    let validated = validate(parsed)?;
    Ok(validated)
}

// 使用 map_err 转换错误
fn convert_error(result: ExternalResult) -> AppResult<Data> {
    result.map_err(|e| AppError::External(e.to_string()))
}
```

## 异步编程

### 异步函数

```rust
// 使用 async/await
pub async fn fetch_data(url: &str) -> AppResult<Response> {
    let client = reqwest::Client::new();
    let response = client
        .get(url)
        .send()
        .await?
        .error_for_status()?;
    
    Ok(response)
}
```

### 并发执行

```rust
// 使用 tokio::join! 并发执行
async fn fetch_all() -> AppResult<(User, Vec<Post>)> {
    let (user, posts) = tokio::join!(
        get_user(user_id),
        get_posts(user_id)
    );
    
    Ok((user?, posts?))
}

// 使用 FuturesUnordered 处理多个并发任务
use futures::stream::{FuturesUnordered, StreamExt};

async fn process_all(ids: Vec<Uuid>) -> Vec<AppResult<Data>> {
    let futures: FuturesUnordered<_> = ids
        .into_iter()
        .map(|id| process_one(id))
        .collect();
    
    futures.collect().await
}
```

## Trait 设计

### 常用 Trait

```rust
// 实现 Display 用于格式化输出
impl std::fmt::Display for User {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{} ({})", self.name, self.email)
    }
}

// 实现 From 用于类型转换
impl From<UserRow> for User {
    fn from(row: UserRow) -> Self {
        Self {
            id: row.id,
            name: row.name,
            email: row.email,
        }
    }
}

// 实现 Default 用于默认值
impl Default for Config {
    fn default() -> Self {
        Self {
            port: 8080,
            host: "localhost".to_string(),
            debug: false,
        }
    }
}
```

## 依赖注入

### 使用 trait 实现依赖注入

```rust
// 定义 trait
#[async_trait]
pub trait UserRepository: Send + Sync {
    async fn find_by_id(&self, id: Uuid) -> AppResult<User>;
    async fn save(&self, user: &User) -> AppResult<()>;
}

// 实现 trait
pub struct PostgresUserRepository {
    pool: PgPool,
}

#[async_trait]
impl UserRepository for PostgresUserRepository {
    async fn find_by_id(&self, id: Uuid) -> AppResult<User> {
        // 数据库查询实现
    }
    
    async fn save(&self, user: &User) -> AppResult<()> {
        // 保存实现
    }
}

// 使用 trait 对象
pub struct UserService {
    repo: Box<dyn UserRepository>,
}
```

## 测试

### 单元测试

```rust
#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_calculate_total() {
        let items = vec![
            Item { price: Decimal::from(10), quantity: 2 },
            Item { price: Decimal::from(20), quantity: 1 },
        ];
        
        assert_eq!(calculate_total(&items), Decimal::from(40));
    }
    
    #[tokio::test]
    async fn test_async_function() {
        let result = fetch_data("https://example.com").await;
        assert!(result.is_ok());
    }
}
```

### 测试组织

```rust
// 测试模块放在文件末尾
#[cfg(test)]
mod tests {
    use super::*;
    use mockall::predicate::*;
    
    #[test]
    fn test_with_mock() {
        let mut mock_repo = MockUserRepository::new();
        mock_repo
            .expect_find_by_id()
            .returning(|_| Ok(User::default()));
        
        let service = UserService::new(Box::new(mock_repo));
        // 测试逻辑
    }
}
```

## 性能优化

### 避免不必要的克隆

```rust
// 错误：不必要的克隆
fn process(data: Vec<u8>) {
    let owned = data.clone();  // 浪费内存
    // 处理 owned
}

// 正确：使用引用
fn process(data: &[u8]) {
    // 直接使用 data
}
```

### 使用 Cow 优化

```rust
use std::borrow::Cow;

fn process<'a>(input: Cow<'a, str>) -> Cow<'a, str> {
    if input.contains("error") {
        Cow::Owned(input.replace("error", "warning"))
    } else {
        input  // 零拷贝返回
    }
}
```

## 配置参考

`Cargo.toml` 关键依赖：

```toml
[dependencies]
tokio = { version = "1", features = ["full"] }
serde = { version = "1", features = ["derive"] }
thiserror = "1"
anyhow = "1"
sqlx = { version = "0.7", features = ["postgres", "runtime-tokio"] }
tracing = "0.1"
```
