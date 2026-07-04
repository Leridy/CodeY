# 后端集成测试标准

## 概述

集成测试验证多个模块或服务之间的交互，包括数据库操作、API 端点、外部服务调用等。

## 文件组织

```
tests/
├── api/
│   ├── user_api_test.rs
│   └── auth_api_test.rs
├── database/
│   ├── user_repository_test.rs
│   └── migration_test.rs
├── services/
│   └── payment_service_test.rs
├── common/
│   ├── mod.rs
│   └── helpers.rs
└── fixtures/
    └── test_data.sql
```

## 测试结构

```rust
// tests/api/user_api_test.rs
use actix_web::{test, web, App};
use myapp::{handlers, models, db};

#[actix_web::test]
async fn test_create_user_success() {
    // Arrange
    let app = test::init_service(
        App::new()
            .configure(handlers::configure)
            .app_data(web::Data::new(db::setup_test_db()))
    ).await;

    let payload = serde_json::json!({
        "name": "John Doe",
        "email": "john@example.com"
    });

    // Act
    let req = test::TestRequest::post()
        .uri("/api/users")
        .set_json(&payload)
        .to_request();

    let resp = test::call_service(&app, req).await;

    // Assert
    assert_eq!(resp.status(), 201);
    let body: models::User = test::read_body_json(resp).await;
    assert_eq!(body.name, "John Doe");
    assert_eq!(body.email, "john@example.com");
}
```

## 数据库集成测试

### 测试数据库设置

```rust
// tests/common/helpers.rs
use sqlx::PgPool;

pub async fn setup_test_db() -> PgPool {
    let database_url = std::env::var("TEST_DATABASE_URL")
        .unwrap_or_else(|_| "postgres://localhost/myapp_test".to_string());

    let pool = PgPool::connect(&database_url).await.unwrap();

    // 运行迁移
    sqlx::migrate!("./migrations").run(&pool).await.unwrap();

    // 清理数据
    sqlx::query("TRUNCATE TABLE users, orders CASCADE")
        .execute(&pool)
        .await
        .unwrap();

    pool
}

pub async fn seed_test_data(pool: &PgPool) {
    sqlx::query("INSERT INTO users (name, email) VALUES ($1, $2)")
        .bind("Test User")
        .bind("test@example.com")
        .execute(pool)
        .await
        .unwrap();
}
```

### Repository 测试

```rust
// tests/database/user_repository_test.rs
use sqlx::PgPool;
use myapp::repositories::UserRepository;

#[sqlx::test]
async fn test_find_user_by_id(pool: PgPool) -> sqlx::Result<()> {
    // Arrange
    let repo = UserRepository::new(pool.clone());
    seed_test_data(&pool).await;

    // Act
    let user = repo.find_by_id(1).await?;

    // Assert
    assert!(user.is_some());
    let user = user.unwrap();
    assert_eq!(user.name, "Test User");
    assert_eq!(user.email, "test@example.com");

    Ok(())
}

#[sqlx::test]
async fn test_find_user_not_found(pool: PgPool) -> sqlx::Result<()> {
    let repo = UserRepository::new(pool);
    let user = repo.find_by_id(999).await?;
    assert!(user.is_none());
    Ok(())
}

#[sqlx::test]
async fn test_create_user(pool: PgPool) -> sqlx::Result<()> {
    let repo = UserRepository::new(pool);
    let new_user = NewUser {
        name: "Jane Doe".to_string(),
        email: "jane@example.com".to_string(),
    };

    let user = repo.create(new_user).await?;
    assert!(user.id > 0);
    assert_eq!(user.name, "Jane Doe");

    Ok(())
}
```

## API 集成测试

### 测试 API 端点

```rust
// tests/api/auth_api_test.rs
use actix_web::{test, web, App};
use myapp::{handlers, middleware, db};

#[actix_web::test]
async fn test_login_success() {
    let app = test::init_service(
        App::new()
            .configure(handlers::configure)
            .app_data(web::Data::new(db::setup_test_db()))
    ).await;

    // 注册用户
    let register_payload = serde_json::json!({
        "email": "test@example.com",
        "password": "password123",
        "name": "Test User"
    });

    let req = test::TestRequest::post()
        .uri("/api/auth/register")
        .set_json(&register_payload)
        .to_request();

    test::call_service(&app, req).await;

    // 登录
    let login_payload = serde_json::json!({
        "email": "test@example.com",
        "password": "password123"
    });

    let req = test::TestRequest::post()
        .uri("/api/auth/login")
        .set_json(&login_payload)
        .to_request();

    let resp = test::call_service(&app, req).await;

    assert_eq!(resp.status(), 200);
    let body: serde_json::Value = test::read_body_json(resp).await;
    assert!(body["token"].is_string());
}

#[actix_web::test]
async fn test_login_invalid_credentials() {
    let app = test::init_service(
        App::new()
            .configure(handlers::configure)
            .app_data(web::Data::new(db::setup_test_db()))
    ).await;

    let payload = serde_json::json!({
        "email": "nonexistent@example.com",
        "password": "wrongpassword"
    });

    let req = test::TestRequest::post()
        .uri("/api/auth/login")
        .set_json(&payload)
        .to_request();

    let resp = test::call_service(&app, req).await;

    assert_eq!(resp.status(), 401);
}
```

### 测试认证和授权

```rust
#[actix_web::test]
async fn test_protected_endpoint_without_token() {
    let app = test::init_service(
        App::new()
            .configure(handlers::configure)
            .app_data(web::Data::new(db::setup_test_db()))
    ).await;

    let req = test::TestRequest::get()
        .uri("/api/users/me")
        .to_request();

    let resp = test::call_service(&app, req).await;

    assert_eq!(resp.status(), 401);
}

#[actix_web::test]
async fn test_protected_endpoint_with_valid_token() {
    let app = test::init_service(
        App::new()
            .configure(handlers::configure)
            .app_data(web::Data::new(db::setup_test_db()))
    ).await;

    // 先登录获取 token
    let token = login_and_get_token(&app).await;

    let req = test::TestRequest::get()
        .uri("/api/users/me")
        .header("Authorization", format!("Bearer {}", token))
        .to_request();

    let resp = test::call_service(&app, req).await;

    assert_eq!(resp.status(), 200);
}
```

## 外部服务 Mock

### 使用 wiremock

```rust
use wiremock::{MockServer, Mock, ResponseTemplate};
use wiremock::matchers::{method, path};

#[tokio::test]
async fn test_payment_service_integration() {
    // Arrange - 启动 mock 服务器
    let mock_server = MockServer::start().await;

    Mock::given(method("POST"))
        .and(path("/v1/charges"))
        .respond_with(ResponseTemplate::new(200).set_body_json(serde_json::json!({
            "id": "ch_test_123",
            "status": "succeeded"
        })))
        .mount(&mock_server)
        .await;

    // 创建使用 mock 服务器的支付服务
    let payment_service = PaymentService::new(mock_server.uri());

    // Act
    let result = payment_service.charge(1000, "tok_test").await;

    // Assert
    assert!(result.is_ok());
    assert_eq!(result.unwrap().status, "succeeded");
}
```

## 测试事务和回滚

```rust
#[sqlx::test]
async fn test_transaction_rollback_on_error(pool: PgPool) -> sqlx::Result<()> {
    let repo = UserRepository::new(pool.clone());

    // 开始事务
    let mut tx = pool.begin().await?;

    // 在事务中创建用户
    sqlx::query("INSERT INTO users (name, email) VALUES ($1, $2)")
        .bind("Test User")
        .bind("test@example.com")
        .execute(&mut *tx)
        .await?;

    // 故意制造错误，触发回滚
    let result = sqlx::query("INSERT INTO users (name, email) VALUES ($1, $2)")
        .bind("Duplicate")
        .bind("test@example.com")  // 假设有唯一约束
        .execute(&mut *tx)
        .await;

    assert!(result.is_err());

    // 事务回滚
    tx.rollback().await?;

    // 验证用户没有被创建
    let user = repo.find_by_email("test@example.com").await?;
    assert!(user.is_none());

    Ok(())
}
```

## 测试辅助函数

```rust
// tests/common/helpers.rs
use actix_web::test;

pub async fn login_and_get_token(app: &impl actix_web::dev::Service) -> String {
    let payload = serde_json::json!({
        "email": "test@example.com",
        "password": "password123"
    });

    let req = test::TestRequest::post()
        .uri("/api/auth/login")
        .set_json(&payload)
        .to_request();

    let resp = test::call_service(app, req).await;
    let body: serde_json::Value = test::read_body_json(resp).await;
    body["token"].as_str().unwrap().to_string()
}

pub async fn create_test_user(
    pool: &sqlx::PgPool,
    name: &str,
    email: &str,
) -> i64 {
    let result = sqlx::query(
        "INSERT INTO users (name, email) VALUES ($1, $2) RETURNING id"
    )
    .bind(name)
    .bind(email)
    .fetch_one(pool)
    .await
    .unwrap();

    result.get("id")
}
```

## 环境配置

```toml
# Cargo.toml
[dev-dependencies]
actix-web = "4"
actix-rt = "2"
sqlx = { version = "0.7", features = ["runtime-tokio", "postgres", "migrate"] }
serde_json = "1"
wiremock = "0.5"
tokio = { version = "1", features = ["full"] }

[features]
integration-tests = []
```

```rust
// tests/common/mod.rs
#[cfg(feature = "integration-tests")]
mod helpers;

#[cfg(feature = "integration-tests")]
pub use helpers::*;
```

## 运行命令

```bash
# 运行所有集成测试
cargo test --test '*'

# 运行特定集成测试文件
cargo test --test user_api_test

# 带输出
cargo test --test '*' -- --nocapture

# 只运行集成测试 (需要 feature flag)
cargo test --features integration-tests

# 带覆盖率
cargo tarpaulin --out Html --features integration-tests
```

## 检查清单

- [ ] 测试数据库独立于生产环境
- [ ] 每个测试前清理数据
- [ ] 测试事务和回滚机制
- [ ] Mock 外部服务 (支付、邮件等)
- [ ] 测试认证和授权流程
- [ ] 测试错误处理和边界情况
- [ ] 测试并发和竞态条件 (如适用)
- [ ] 测试数据一致性
