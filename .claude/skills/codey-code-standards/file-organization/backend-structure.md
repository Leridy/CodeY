# 后端文件结构

## 目录结构

```
src/
├── main.rs                 # 入口文件
├── lib.rs                  # 库入口
├── config/                 # 配置模块
│   ├── mod.rs
│   ├── app.rs              # 应用配置
│   ├── database.rs         # 数据库配置
│   └── logging.rs          # 日志配置
├── api/                    # API 层
│   ├── mod.rs
│   ├── routes/             # 路由定义
│   │   ├── mod.rs
│   │   ├── auth.rs
│   │   └── users.rs
│   ├── handlers/           # 请求处理器
│   │   ├── mod.rs
│   │   ├── auth.rs
│   │   └── users.rs
│   ├── middleware/          # 中间件
│   │   ├── mod.rs
│   │   ├── auth.rs
│   │   └── logging.rs
│   └── extractors/         # 提取器
│       ├── mod.rs
│       └── user.rs
├── domain/                 # 领域层
│   ├── mod.rs
│   ├── models/             # 领域模型
│   │   ├── mod.rs
│   │   ├── user.rs
│   │   └── order.rs
│   ├── entities/           # 实体
│   │   ├── mod.rs
│   │   └── user.rs
│   └── value_objects/      # 值对象
│       ├── mod.rs
│       └── email.rs
├── services/               # 服务层
│   ├── mod.rs
│   ├── auth.rs
│   └── user.rs
├── repositories/           # 仓库层
│   ├── mod.rs
│   ├── traits/             # 仓库接口
│   │   ├── mod.rs
│   │   ├── user.rs
│   │   └── order.rs
│   └── postgres/           # PostgreSQL 实现
│       ├── mod.rs
│       ├── user.rs
│       └── order.rs
├── infrastructure/         # 基础设施层
│   ├── mod.rs
│   ├── database/           # 数据库连接
│   │   ├── mod.rs
│   │   ├── pool.rs
│   │   └── migrations.rs
│   ├── cache/              # 缓存
│   │   ├── mod.rs
│   │   └── redis.rs
│   └── email/              # 邮件
│       ├── mod.rs
│       └── smtp.rs
├── errors/                 # 错误处理
│   ├── mod.rs
│   ├── app.rs              # 应用错误
│   └── api.rs              # API 错误
├── utils/                  # 工具函数
│   ├── mod.rs
│   ├── validation.rs
│   └── crypto.rs
└── tests/                  # 测试
    ├── integration/        # 集成测试
    │   ├── api/
    │   └── database/
    └── unit/               # 单元测试
        ├── services/
        └── repositories/
```

## 目录说明

### config/

配置模块，包含应用配置、数据库配置等。

```rust
// config/app.rs
#[derive(Debug, Deserialize)]
pub struct AppConfig {
    pub host: String,
    pub port: u16,
    pub debug: bool,
}

// config/database.rs
#[derive(Debug, Deserialize)]
pub struct DatabaseConfig {
    pub url: String,
    pub max_connections: u32,
}
```

### api/

API 层，包含路由、处理器、中间件和提取器。

#### routes/

路由定义模块。

```rust
// api/routes/auth.rs
use axum::Router;

pub fn auth_routes() -> Router {
    Router::new()
        .route("/login", post(login))
        .route("/register", post(register))
}
```

#### handlers/

请求处理器模块。

```rust
// api/handlers/auth.rs
use axum::Json;

pub async fn login(
    Json(payload): Json<LoginRequest>,
) -> Result<Json<LoginResponse>, ApiError> {
    // 处理登录逻辑
}
```

#### middleware/

中间件模块。

```rust
// api/middleware/auth.rs
use axum::middleware::Next;

pub async fn auth_middleware(
    req: Request,
    next: Next,
) -> Result<Response, ApiError> {
    // 认证逻辑
}
```

### domain/

领域层，包含领域模型、实体和值对象。

#### models/

领域模型模块。

```rust
// domain/models/user.rs
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct User {
    pub id: Uuid,
    pub name: String,
    pub email: Email,
    pub created_at: DateTime<Utc>,
}
```

#### entities/

实体模块。

```rust
// domain/entities/user.rs
#[derive(Debug, Clone)]
pub struct UserEntity {
    pub id: Uuid,
    pub name: String,
    pub email: Email,
    pub password_hash: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}
```

#### value_objects/

值对象模块。

```rust
// domain/value_objects/email.rs
#[derive(Debug, Clone, PartialEq)]
pub struct Email(String);

impl Email {
    pub fn new(email: String) -> Result<Self, ValidationError> {
        // 验证邮箱格式
    }
}
```

### services/

服务层，包含业务逻辑。

```rust
// services/user.rs
pub struct UserService {
    repo: Box<dyn UserRepository>,
}

impl UserService {
    pub async fn get_user(&self, id: Uuid) -> AppResult<User> {
        self.repo.find_by_id(id).await
    }
    
    pub async fn create_user(&self, data: CreateUser) -> AppResult<User> {
        // 创建用户逻辑
    }
}
```

### repositories/

仓库层，包含数据访问接口和实现。

#### traits/

仓库接口模块。

```rust
// repositories/traits/user.rs
#[async_trait]
pub trait UserRepository: Send + Sync {
    async fn find_by_id(&self, id: Uuid) -> AppResult<User>;
    async fn find_by_email(&self, email: &str) -> AppResult<User>;
    async fn save(&self, user: &User) -> AppResult<()>;
}
```

#### postgres/

PostgreSQL 实现模块。

```rust
// repositories/postgres/user.rs
pub struct PostgresUserRepository {
    pool: PgPool,
}

#[async_trait]
impl UserRepository for PostgresUserRepository {
    async fn find_by_id(&self, id: Uuid) -> AppResult<User> {
        // PostgreSQL 查询实现
    }
}
```

### infrastructure/

基础设施层，包含数据库连接、缓存、邮件等。

#### database/

数据库连接模块。

```rust
// infrastructure/database/pool.rs
pub async fn create_pool(config: &DatabaseConfig) -> AppResult<PgPool> {
    PgPool::connect(&config.url).await
}
```

### errors/

错误处理模块。

```rust
// errors/app.rs
#[derive(Debug, Error)]
pub enum AppError {
    #[error("数据库错误: {0}")]
    Database(#[from] sqlx::Error),
    
    #[error("未找到: {resource} ID={id}")]
    NotFound { resource: String, id: String },
    
    #[error("验证失败: {0}")]
    Validation(String),
}
```

### utils/

工具函数模块。

```rust
// utils/validation.rs
pub fn validate_email(email: &str) -> Result<(), ValidationError> {
    // 邮箱验证逻辑
}
```

## 模块组织

### 使用 mod.rs

每个目录使用 `mod.rs` 统一导出。

```rust
// api/mod.rs
pub mod routes;
pub mod handlers;
pub mod middleware;
pub mod extractors;
```

### 使用 pub(crate) 限制可见性

```rust
// 内部模块使用 pub(crate)
pub(crate) mod internal {
    pub(crate) fn helper() { ... }
}

// 公开 API 使用 pub
pub mod api {
    pub fn endpoint() { ... }
}
```

## 最佳实践

### 1. 分层架构

按职责分层，每层只依赖下一层。

```
API 层 → 服务层 → 仓库层 → 基础设施层
```

### 2. 依赖注入

使用 trait 实现依赖注入。

```rust
// 定义 trait
#[async_trait]
pub trait UserRepository: Send + Sync {
    async fn find_by_id(&self, id: Uuid) -> AppResult<User>;
}

// 实现 trait
pub struct PostgresUserRepository { ... }

// 使用 trait 对象
pub struct UserService {
    repo: Box<dyn UserRepository>,
}
```

### 3. 错误处理

使用自定义错误类型，统一错误处理。

```rust
#[derive(Debug, Error)]
pub enum AppError {
    #[error("数据库错误: {0}")]
    Database(#[from] sqlx::Error),
    
    #[error("未找到: {resource} ID={id}")]
    NotFound { resource: String, id: String },
}
```

### 4. 测试组织

按测试类型组织测试文件。

```
tests/
├── integration/        # 集成测试
│   ├── api/           # API 集成测试
│   └── database/      # 数据库集成测试
└── unit/              # 单元测试
    ├── services/      # 服务层测试
    └── repositories/  # 仓库层测试
```

### 5. 配置管理

使用环境变量和配置文件管理配置。

```rust
// config/app.rs
#[derive(Debug, Deserialize)]
pub struct AppConfig {
    pub host: String,
    pub port: u16,
    pub debug: bool,
}

impl AppConfig {
    pub fn from_env() -> Self {
        // 从环境变量加载配置
    }
}
```
