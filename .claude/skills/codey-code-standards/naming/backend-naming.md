# 后端命名规范

## 文件命名

### 源文件

```
// 推荐：snake_case
user_service.rs
database_pool.rs
error_handler.rs

// 避免
user-service.rs
UserService.rs
```

### 模块文件

```
// 推荐：snake_case
mod user { ... }  // 对应 user.rs 或 user/mod.rs
mod api { ... }   // 对应 api.rs 或 api/mod.rs
```

### 测试文件

```
// 推荐：与源文件同名
user_service.rs
user_service_test.rs  // 或使用 #[cfg(test)] 模块

// 集成测试
tests/
  user_api.rs
  database.rs
```

## 变量命名

### 基本变量

```rust
// 推荐：snake_case
let user_name = "John"
let item_count = 10
let is_active = true

// 避免
let userName = "John"
let itemCount = 10
```

### 常量

```rust
// 推荐：SCREAMING_SNAKE_CASE
const MAX_RETRY_COUNT: u32 = 3
const DEFAULT_TIMEOUT: Duration = Duration::from_secs(5)
const API_BASE_URL: &str = "https://api.example.com"

// 避免
const max_retry_count: u32 = 3
const MaxRetryCount: u32 = 3
```

### 静态变量

```rust
// 推荐：SCREAMING_SNAKE_CASE
static GLOBAL_CONFIG: Lazy<Config> = Lazy::new(|| Config::default());
static INSTANCE_COUNT: AtomicUsize = AtomicUsize::new(0);
```

### 布尔变量

```rust
// 推荐：is/has/can/should 前缀
let is_connected = true
let has_permission = false
let can_execute = true
let should_retry = false

// 避免
let connected = true
let permission = false
```

## 函数命名

### 普通函数

```rust
// 推荐：snake_case，动词开头
fn get_user(id: Uuid) -> User { ... }
fn calculate_total(items: &[Item]) -> Decimal { ... }
fn parse_config(path: &Path) -> Config { ... }

// 避免
fn getUser(id: Uuid) -> User { ... }
fn CalculateTotal(items: &[Item]) -> Decimal { ... }
```

### 异步函数

```rust
// 推荐：与普通函数相同
async fn fetch_user(id: Uuid) -> Result<User> { ... }
async fn send_email(to: &str, subject: &str) -> Result<()> { ... }
```

### 构造函数

```rust
// 推荐：new 或 from 开头
impl User {
    fn new(name: String, email: String) -> Self { ... }
    fn from_row(row: UserRow) -> Self { ... }
}
```

### 工厂函数

```rust
// 推荐：create 或 make 开头
fn create_user(data: CreateUser) -> User { ... }
fn create_pool(config: DatabaseConfig) -> Pool { ... }
```

## 类型命名

### 结构体

```rust
// 推荐：PascalCase
struct UserProfile {
    id: Uuid,
    name: String,
    email: String,
}

// 避免
struct user_profile { ... }
struct USER_PROFILE { ... }
```

### 枚举

```rust
// 推荐：PascalCase
enum UserRole {
    Admin,
    User,
    Guest,
}

// 避免
enum user_role { ... }
enum USER_ROLE { ... }
```

### Trait

```rust
// 推荐：PascalCase，动词或形容词
trait Serializable { ... }
trait Repository { ... }
trait AsyncService { ... }

// 避免
trait repository { ... }
trait IRepository { ... }
```

### 类型别名

```rust
// 推荐：PascalCase
type AppResult<T> = Result<T, AppError>;
type UserId = Uuid;
type EventHandler = Box<dyn Fn(Event) + Send>;
```

## 模块命名

### 模块

```rust
// 推荐：snake_case
mod user_service { ... }
mod database { ... }
mod error_handler { ... }

// 避免
mod UserService { ... }
mod DATABASE { ... }
```

### 模块路径

```rust
// 推荐：snake_case
use crate::services::user_service::UserService;
use crate::models::user::User;

// 避免
use crate::services::UserService::UserService;
```

## 字段命名

### 结构体字段

```rust
// 推荐：snake_case
struct User {
    id: Uuid,
    first_name: String,
    last_name: String,
    email_address: String,
    is_active: bool,
    created_at: DateTime<Utc>,
}

// 避免
struct User {
    id: Uuid,
    firstName: String,
    lastName: String,
    emailAddress: String,
    isActive: bool,
    createdAt: DateTime<Utc>,
}
```

### 数据库字段

```rust
// 推荐：与数据库列名一致（通常是 snake_case）
#[derive(sqlx::FromRow)]
struct UserRow {
    id: Uuid,
    first_name: String,
    last_name: String,
    email: String,
    is_active: bool,
    created_at: DateTime<Utc>,
}
```

## 命名检查清单

- [ ] 文件名：snake_case
- [ ] 变量：snake_case，布尔 is/has/can/should 前缀
- [ ] 常量：SCREAMING_SNAKE_CASE
- [ ] 函数：snake_case，动词开头
- [ ] 类型：PascalCase
- [ ] 模块：snake_case
- [ ] 字段：snake_case
