# 设计文档模板

## 用途

用于生成 design.md 设计文档，包含架构设计、数据模型、技术选型和实现细节。

## 模板

```markdown
# 功能设计文档

> 版本：v1.0.0
> 日期：YYYY-MM-DD
> 作者：<作者>
> 状态：draft

## 概述

### 功能描述
- 这个功能做什么
- 解决什么问题
- 目标用户是谁

### 设计目标
- 目标 1
- 目标 2
- 目标 3

## 架构设计

### 整体架构
- 系统组件图
- 数据流图
- 依赖关系

### 组件设计
- 组件 1：职责、接口、依赖
- 组件 2：职责、接口、依赖

### 数据流
- 请求流程
- 响应流程
- 错误处理流程

## 数据模型

### 实体定义
- 实体 1：字段、类型、约束
- 实体 2：字段、类型、约束

### 关系
- 实体间关系
- 外键约束

## 技术选型

| 组件 | 技术选型 | 理由 |
|------|----------|------|
| 前端框架 | ... | ... |
| 状态管理 | ... | ... |
| 后端框架 | ... | ... |
| 数据库 | ... | ... |

## 实现细节

### 关键算法
- 算法描述
- 复杂度分析

### 注意事项
- 边界条件
- 异常处理
- 性能考量
```

## 示例

```markdown
# 用户认证功能设计文档

> 版本：v1.0.0
> 日期：2026-07-05
> 作者：CodeY Agent
> 状态：draft

## 概述

### 功能描述
- 实现用户注册、登录、登出功能
- 使用 JWT Token 进行身份验证
- 支持密码加密和 Token 刷新

### 设计目标
- 安全性：使用 bcrypt 加密密码，JWT Token 短过期时间
- 可扩展性：支持分布式架构，无状态设计
- 用户体验：支持 Token 自动刷新，无频繁登录

## 架构设计

### 整体架构

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client    │────►│   Server    │────►│  Database   │
└─────────────┘     └─────────────┘     └─────────────┘
                          │
                          ▼
                    ┌─────────────┐
                    │    Redis    │
                    └─────────────┘
```

### 组件设计

#### Auth Controller
- 职责：处理认证相关的 HTTP 请求
- 接口：POST /api/auth/register, POST /api/auth/login, POST /api/auth/logout, POST /api/auth/refresh
- 依赖：Auth Service, User Service

#### Auth Service
- 职责：实现认证业务逻辑
- 接口：register(), login(), logout(), refreshToken()
- 依赖：User Repository, Token Service, Password Service

#### Token Service
- 职责：生成和验证 JWT Token
- 接口：generateAccessToken(), generateRefreshToken(), verifyToken()
- 依赖：Redis

#### Password Service
- 职责：密码加密和验证
- 接口：hashPassword(), comparePassword()
- 依赖：bcrypt

### 数据流

#### 注册流程
1. Client 发送注册请求（email, password）
2. Server 验证 email 格式和密码强度
3. Server 检查 email 是否已存在
4. Server 使用 bcrypt 加密密码
5. Server 创建用户记录
6. Server 生成 JWT Token
7. Server 返回 Token 和用户信息

#### 登录流程
1. Client 发送登录请求（email, password）
2. Server 查找用户记录
3. Server 使用 bcrypt 验证密码
4. Server 生成 JWT Token（Access Token + Refresh Token）
5. Server 存储 Refresh Token 到 Redis
6. Server 返回 Token 和用户信息

#### Token 刷新流程
1. Client 发送刷新请求（Refresh Token）
2. Server 验证 Refresh Token
3. Server 检查 Redis 中是否存在该 Token
4. Server 生成新的 Access Token
5. Server 返回新的 Access Token

## 数据模型

### User 实体

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PRIMARY KEY | 唯一标识 |
| email | VARCHAR(255) | UNIQUE, NOT NULL | 用户邮箱 |
| password_hash | VARCHAR(255) | NOT NULL | 加密后的密码 |
| created_at | TIMESTAMP | NOT NULL | 创建时间 |
| updated_at | TIMESTAMP | NOT NULL | 更新时间 |

### RefreshToken 实体（Redis）

| 字段 | 类型 | 说明 |
|------|------|------|
| user_id | UUID | 用户 ID |
| token | STRING | Refresh Token |
| expires_at | TIMESTAMP | 过期时间 |

## 技术选型

| 组件 | 技术选型 | 理由 |
|------|----------|------|
| 后端框架 | Express.js | 成熟、社区活跃、中间件丰富 |
| 数据库 | PostgreSQL | 可靠、支持 UUID、事务完整 |
| 缓存 | Redis | 高性能、支持 TTL、适合存储 Token |
| 密码加密 | bcrypt | 安全、慢哈希、防止暴力破解 |
| Token | JWT | 无状态、可扩展、跨服务共享 |

## 实现细节

### 关键算法

#### 密码加密
- 算法：bcrypt
- 成本因子：12
- 复杂度：O(2^cost)

#### Token 生成
- 算法：HMAC SHA256
- Access Token 过期时间：15 分钟
- Refresh Token 过期时间：7 天

### 注意事项

#### 边界条件
- email 格式验证
- 密码强度验证（最小长度、复杂度）
- Token 过期处理
- 并发登录处理

#### 异常处理
- email 已存在：返回 409 Conflict
- 密码错误：返回 401 Unauthorized
- Token 无效：返回 401 Unauthorized
- Token 过期：返回 401 Unauthorized

#### 性能考量
- bcrypt 并发限制：使用队列或限流
- Redis 连接池：复用连接，避免频繁创建
- 数据库索引：email 字段建立唯一索引
```

## 使用说明

1. 复制模板
2. 替换占位符（<功能名称>、<作者>等）
3. 根据实际需求填写内容
4. 删除不适用的部分
5. 保存到 `docs/specs/YYYY-MM-DD-<feature>/design.md`

---

*模板版本：v1.0.0*
*创建日期：2026-07-05*
