# 后端单元测试标准 (cargo test)

## 概述

使用 Rust 内置的 `cargo test` 框架进行后端单元测试，配合 `mockall` 进行依赖 mock。

## 文件组织

```
src/
├── services/
│   ├── user_service.rs
│   └── user_service_test.rs    # 测试文件
├── utils/
│   ├── crypto.rs
│   └── crypto_test.rs
└── models/
    ├── user.rs
    └── user_test.rs
```

### 模块内测试

```rust
// src/services/user_service.rs
pub fn calculate_fee(amount: u64, rate: f64) -> u64 {
    (amount as f64 * rate) as u64
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_calculate_fee_basic() {
        assert_eq!(calculate_fee(1000, 0.01), 10);
    }

    #[test]
    fn test_calculate_fee_zero_amount() {
        assert_eq!(calculate_fee(0, 0.01), 0);
    }
}
```

## 测试命名规范

```rust
#[test]
fn test_{function_name}_{scenario}_{expected_result}() {
    // 测试逻辑
}

// 示例
#[test]
fn test_calculate_fee_with_valid_amount_returns_correct_fee() {}

#[test]
fn test_calculate_fee_with_zero_amount_returns_zero() {}

#[test]
fn test_calculate_fee_with_negative_rate_returns_zero() {}
```

## 测试结构 (AAA 模式)

```rust
#[test]
fn test_user_creation_with_valid_data() {
    // Arrange
    let name = "John Doe";
    let email = "john@example.com";

    // Act
    let user = User::new(name, email).unwrap();

    // Assert
    assert_eq!(user.name, name);
    assert_eq!(user.email, email);
    assert!(user.id > 0);
}
```

## 断言宏

### 基本断言

```rust
// 相等
assert_eq!(result, expected);

// 不相等
assert_ne!(result, unexpected);

// 布尔断言
assert!(condition);
assert!(!condition);

// 带消息的断言
assert_eq!(result, expected, "计算结果不匹配: {} != {}", result, expected);
```

### 浮点数比较

```rust
#[test]
fn test_float_calculation() {
    let result = calculate_price(100.0, 0.1);
    // 使用近似比较
    assert!((result - 110.0).abs() < f64::EPSILON);
}

// 或使用 approx crate
use approx::assert_relative_eq;

#[test]
fn test_float_with_approx() {
    let result = calculate_price(100.0, 0.1);
    assert_relative_eq!(result, 110.0, epsilon = 1e-10);
}
```

### Result 和 Option 断言

```rust
#[test]
fn test_parse_valid_input() {
    let result = parse_number("42");
    assert!(result.is_ok());
    assert_eq!(result.unwrap(), 42);
}

#[test]
fn test_parse_invalid_input() {
    let result = parse_number("abc");
    assert!(result.is_err());
}

#[test]
fn test_find_existing_item() {
    let item = find_item(1);
    assert!(item.is_some());
    assert_eq!(item.unwrap().name, "Test Item");
}

#[test]
fn test_find_nonexistent_item() {
    let item = find_item(999);
    assert!(item.is_none());
}
```

## Mock 使用 (mockall)

### 定义可 Mock 的 Trait

```rust
use mockall::automock;

#[automock]
trait UserRepository {
    fn find_by_id(&self, id: i64) -> Result<User, Error>;
    fn find_by_email(&self, email: &str) -> Result<User, Error>;
    fn save(&self, user: &User) -> Result<User, Error>;
    fn delete(&self, id: i64) -> Result<(), Error>;
}
```

### 使用 Mock

```rust
#[cfg(test)]
mod tests {
    use super::*;
    use mockall::predicate::*;

    #[test]
    fn test_get_user_by_id_success() {
        // Arrange
        let mut mock_repo = MockUserRepository::new();
        mock_repo
            .expect_find_by_id()
            .with(eq(1))
            .times(1)
            .returning(|_| Ok(User { id: 1, name: "John".into(), email: "john@example.com".into() }));

        let service = UserService::new(mock_repo);

        // Act
        let result = service.get_user(1);

        // Assert
        assert!(result.is_ok());
        assert_eq!(result.unwrap().name, "John");
    }

    #[test]
    fn test_get_user_by_id_not_found() {
        // Arrange
        let mut mock_repo = MockUserRepository::new();
        mock_repo
            .expect_find_by_id()
            .returning(|_| Err(Error::NotFound));

        let service = UserService::new(mock_repo);

        // Act
        let result = service.get_user(999);

        // Assert
        assert!(result.is_err());
    }
}
```

## 异步测试

### 使用 tokio::test

```rust
use tokio::test;

#[tokio::test]
async fn test_fetch_data_success() {
    let client = HttpClient::new();
    let result = client.fetch("https://api.example.com/data").await;
    assert!(result.is_ok());
}

#[tokio::test]
async fn test_fetch_data_timeout() {
    let client = HttpClient::with_timeout(Duration::from_millis(100));
    let result = client.fetch("https://slow-api.example.com/data").await;
    assert!(result.is_err());
}
```

### 异步 Mock

```rust
#[automock]
trait AsyncUserRepository {
    async fn find_by_id(&self, id: i64) -> Result<User, Error>;
}

#[tokio::test]
async fn test_async_user_service() {
    let mut mock_repo = MockAsyncUserRepository::new();
    mock_repo
        .expect_find_by_id()
        .returning(|_| Ok(User { id: 1, name: "John".into() }));

    let service = AsyncUserService::new(mock_repo);
    let result = service.get_user(1).await;
    assert!(result.is_ok());
}
```

## 错误处理测试

```rust
#[test]
fn test_error_propagation() {
    let result = process_request(invalid_input);
    assert!(result.is_err());

    match result.unwrap_err() {
        Error::Validation(msg) => assert_eq!(msg, "Invalid input"),
        _ => panic!("Expected validation error"),
    }
}

#[test]
fn test_error_conversion() {
    let io_error = std::io::Error::new(std::io::ErrorKind::NotFound, "file not found");
    let app_error: AppError = io_error.into();

    match app_error {
        AppError::Io(_) => {} // 成功
        _ => panic!("Expected IO error"),
    }
}
```

## 测试辅助函数

```rust
// 创建测试用的 User
fn create_test_user(id: i64, name: &str) -> User {
    User {
        id,
        name: name.to_string(),
        email: format!("{}@test.com", name.to_lowercase()),
        created_at: chrono::Utc::now(),
    }
}

// 创建测试用的数据库连接
fn setup_test_db() -> Database {
    Database::connect("sqlite::memory:").unwrap()
}

#[test]
fn test_user_operations() {
    let db = setup_test_db();
    let user = create_test_user(1, "John");

    db.save(&user).unwrap();
    let found = db.find_by_id(1).unwrap();
    assert_eq!(found.name, "John");
}
```

## 测试覆盖要求

### 必须测试的场景

1. **正常路径** - 预期输入产生预期输出
2. **边界条件** - 空值、零值、最大值、最小值
3. **错误处理** - 无效输入、异常情况
4. **并发安全** - 多线程访问 (如适用)

### 示例: 边界条件测试

```rust
#[test]
fn test_pagination_first_page() {
    let result = paginate(1, 10, 100);
    assert_eq!(result.offset, 0);
    assert_eq!(result.limit, 10);
}

#[test]
fn test_pagination_last_page() {
    let result = paginate(10, 10, 95);
    assert_eq!(result.offset, 90);
    assert_eq!(result.limit, 5);  // 只有 5 条
}

#[test]
fn test_pagination_empty_result() {
    let result = paginate(1, 10, 0);
    assert_eq!(result.offset, 0);
    assert_eq!(result.limit, 10);
}
```

## 运行命令

```bash
# 运行所有测试
cargo test

# 运行特定模块测试
cargo test --package myapp --lib services::user_service

# 运行特定测试
cargo test test_calculate_fee

# 带输出
cargo test -- --nocapture

# 并行运行
cargo test -- --test-threads=4

# 带覆盖率 (需要 cargo-tarpaulin)
cargo tarpaulin --out Html
```

## 检查清单

- [ ] 测试文件与源文件在同一模块
- [ ] 使用 `#[cfg(test)]` 模块组织测试
- [ ] 测试命名清晰描述场景
- [ ] 覆盖正常路径、边界条件、错误处理
- [ ] 使用 mockall mock 外部依赖
- [ ] 异步测试使用 `#[tokio::test]`
- [ ] 测试独立，不依赖执行顺序
- [ ] 覆盖率达到 80%+
