# 贡献指南

感谢你对 CodeY 项目的关注！本文档将帮助你了解如何参与贡献。

---

## 目录

- [行为准则](#行为准则)
- [开发环境](#开发环境)
- [项目结构](#项目结构)
- [开发流程](#开发流程)
- [代码规范](#代码规范)
- [提交规范](#提交规范)
- [Pull Request 流程](#pull-request-流程)
- [Issue 规范](#issue-规范)
- [常见问题](#常见问题)

---

## 行为准则

参与本项目即表示你同意遵守以下准则：

- 尊重所有参与者
- 接受建设性批评
- 专注于对社区最有利的事情
- 对他人表示同理心

---

## 开发环境

### 环境要求

| 工具 | 最低版本 | 说明 |
|------|---------|------|
| **Node.js** | >= 18.0.0 | JavaScript 运行时 |
| **pnpm** | >= 8.0.0 | 包管理器 |
| **Rust** | >= 1.75.0 | 后端编译工具链 |
| **Git** | >= 2.30.0 | 版本控制 |

### 快速设置

```bash
# 1. Fork 并克隆仓库
git clone https://github.com/YOUR_USERNAME/CodeY.git
cd CodeY

# 2. 添加上游远程仓库
git remote add upstream https://github.com/Leridy/CodeY.git

# 3. 安装依赖
pnpm install

# 4. 构建 Rust 后端
cargo build

# 5. 启动开发服务器
pnpm tauri dev    # Desktop 模式
# 或
pnpm dev          # Web 模式
```

### 开发模式

| 模式 | 命令 | 说明 |
|------|------|------|
| Desktop | `pnpm tauri dev` | Tauri + Vite 热重载 |
| Web | `pnpm dev` | 仅前端开发 |
| Backend | `cargo run -p codey-server` | 仅 Rust 后端 |

---

## 项目结构

```
CodeY/
├── crates/                    # Rust 后端
│   ├── codey-core/           # 核心逻辑库
│   ├── codey-tauri/          # Tauri Desktop 应用
│   └── codey-server/         # Axum Web 服务器
├── src/                       # React 前端
│   ├── components/           # UI 组件
│   ├── hooks/                # 自定义 Hooks
│   ├── stores/               # Zustand 状态管理
│   └── lib/                  # 工具函数库
├── docs/                      # 项目文档
├── tests/                     # 测试目录
└── .claude/                   # Claude Code 配置和 Skills
```

---

## 开发流程

### 1. 创建分支

```bash
# 同步上游
git fetch upstream
git checkout master
git merge upstream/master

# 创建功能分支
git checkout -b feature/your-feature-name
```

**分支命名规范：**

| 类型 | 前缀 | 示例 |
|------|------|------|
| 新功能 | `feature/` | `feature/user-auth` |
| Bug 修复 | `fix/` | `fix/login-error` |
| 文档 | `docs/` | `docs/api-guide` |
| 重构 | `refactor/` | `refactor/auth-module` |
| 测试 | `test/` | `test/auth-service` |

### 2. 开发代码

- 遵循 [代码规范](#代码规范)
- 编写测试（覆盖率 >= 80%）
- 保持提交原子性

### 3. 运行检查

```bash
# 前端检查
pnpm lint           # ESLint
pnpm format         # Prettier
pnpm test           # Vitest

# 后端检查
cargo clippy        # Rust 代码检查
cargo fmt           # Rust 格式化
cargo test          # Rust 测试

# E2E 测试
pnpm test:e2e       # Playwright
```

### 4. 提交代码

```bash
git add .
git commit -m "feat: add your feature"
git push origin feature/your-feature-name
```

### 5. 创建 Pull Request

在 GitHub 上创建 PR，填写说明模板。

---

## 代码规范

### 前端 (TypeScript / React)

**工具链：**
- ESLint + Prettier
- TypeScript 严格模式

**命名规范：**
- 组件：PascalCase（`UserProfile.tsx`）
- 函数/变量：camelCase（`getUserById`）
- 常量：UPPER_SNAKE_CASE（`MAX_RETRY_COUNT`）
- 文件名：camelCase 或 PascalCase

**代码风格：**
```typescript
// ✅ 正确
export function UserProfile({ userId }: UserProfileProps) {
  const { data, isLoading } = useUser(userId);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return <div>{data.name}</div>;
}

// ❌ 错误
export function userprofile(props) {
  var data = getUser(props.id);
  return <div>{data.name}</div>;
}
```

### 后端 (Rust)

**工具链：**
- rustfmt
- clippy

**命名规范：**
- 函数/变量：snake_case（`get_user_by_id`）
- 类型/结构体：PascalCase（`UserService`）
- 常量：UPPER_SNAKE_CASE（`MAX_CONNECTIONS`）
- 模块：snake_case（`user_service.rs`）

**代码风格：**
```rust
// ✅ 正确
pub async fn get_user(user_id: Uuid) -> Result<User, AppError> {
    let user = repository::find_by_id(user_id).await?;
    Ok(user)
}

// ❌ 错误
pub async fn getUser(userId: Uuid) -> Result<User, AppError> {
    let user = repository::findById(userId).await?;
    Ok(user)
}
```

---

## 提交规范

使用 [Conventional Commits](https://www.conventionalcommits.org/) 格式：

```
<type>(<scope>): <subject>

<body>

<footer>
```

### 类型

| 类型 | 说明 | 示例 |
|------|------|------|
| `feat` | 新功能 | `feat: add user authentication` |
| `fix` | Bug 修复 | `fix: handle null pointer in parser` |
| `docs` | 文档更新 | `docs: update API reference` |
| `style` | 代码格式（不影响逻辑） | `style: format with prettier` |
| `refactor` | 重构 | `refactor: extract validation logic` |
| `perf` | 性能优化 | `perf: optimize database queries` |
| `test` | 测试相关 | `test: add unit tests for auth` |
| `chore` | 构建/工具链 | `chore: update dependencies` |
| `ci` | CI/CD 配置 | `ci: add GitHub Actions workflow` |

### 范围（可选）

- `frontend` - 前端相关
- `backend` - 后端相关
- `core` - 核心库
- `protocol` - 协议相关
- `docs` - 文档

### 示例

```bash
# 简单提交
git commit -m "feat: add user login"

# 带范围
git commit -m "feat(auth): add JWT token refresh"

# 带正文
git commit -m "fix(parser): handle edge case in JSON parsing

The parser now correctly handles nested arrays with mixed types.

Fixes #123"
```

---

## Pull Request 流程

### PR 标题

使用与提交信息相同的格式：

```
feat: add user authentication
```

### PR 说明模板

创建 PR 时，请填写以下内容：

```markdown
## 描述

简要描述此 PR 的目的和实现方式。

## 变更类型

- [ ] 新功能 (feat)
- [ ] Bug 修复 (fix)
- [ ] 文档更新 (docs)
- [ ] 重构 (refactor)
- [ ] 其他: ___

## 测试

- [ ] 添加了新测试
- [ ] 所有测试通过
- [ ] 覆盖率 >= 80%

## 截图（如适用）

添加截图或 GIF 展示 UI 变更。

## 相关 Issue

Closes #___
```

### 审查要求

- 至少一位维护者审核通过
- 所有 CI 检查通过
- 无合并冲突
- 测试覆盖率达标

---

## Issue 规范

### Bug 报告

使用 Bug 报告模板，包含：

1. **环境信息**
   - 操作系统
   - Node.js 版本
   - Rust 版本
   - 浏览器（如适用）

2. **复现步骤**
   - 详细的操作步骤
   - 预期行为
   - 实际行为

3. **错误日志**
   - 控制台错误
   - 网络请求错误
   - 截图或视频

### 功能请求

使用功能请求模板，包含：

1. **问题描述**
   - 当前痛点
   - 使用场景

2. **期望方案**
   - 功能描述
   - 界面设计（如适用）

3. **替代方案**
   - 其他可能的实现方式

---

## 常见问题

### Q: 如何运行 E2E 测试？

```bash
# 安装 Playwright 浏览器
npx playwright install

# 运行 E2E 测试
pnpm test:e2e
```

### Q: 如何调试 Rust 代码？

```bash
# 使用 cargo run 运行
cargo run -p codey-server

# 使用 rust-gdb 调试
rust-gdb target/debug/codey-server
```

### Q: 如何更新依赖？

```bash
# 前端依赖
pnpm update

# 后端依赖
cargo update
```

### Q: 如何解决合并冲突？

```bash
# 同步上游
git fetch upstream
git rebase upstream/master

# 解决冲突后
git add .
git rebase --continue
```

---

## 获取帮助

- [GitHub Issues](https://github.com/Leridy/CodeY/issues)
- [GitHub Discussions](https://github.com/Leridy/CodeY/discussions)

---

感谢你的贡献！🎉
