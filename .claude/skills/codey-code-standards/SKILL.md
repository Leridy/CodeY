---
name: codey-code-standards
description: 在编写新代码、代码审查、配置 linter/formatter 或检查命名规范时使用此 skill。覆盖 TypeScript/React 前端和 Rust 后端标准。触发关键词："代码规范"、"命名"、"ESLint"、"Prettier"、"clippy"、"rustfmt"、"代码风格"。
---

# 代码规范 Skill

统一的全栈代码规范，覆盖 TypeScript/React 前端和 Rust 后端。

## 何时激活

- 编写新代码时
- 代码审查时
- 配置 linter/formatter 时
- 检查命名规范时

## 前端规范（TypeScript/React）

**工具链**：ESLint + Prettier，TypeScript 严格模式

**命名规范**：
- 组件：PascalCase（`UserProfile.tsx`）
- 函数/变量：camelCase（`getUserById`）
- 常量：UPPER_SNAKE_CASE（`MAX_RETRY_COUNT`）

**示例**：
```typescript
export function UserProfile({ userId }: UserProfileProps) {
  const { data, isLoading } = useUser(userId);
  if (isLoading) return <LoadingSpinner />;
  return <div>{data.name}</div>;
}
```

## 后端规范（Rust）

**工具链**：rustfmt, clippy

**命名规范**：
- 函数/变量：snake_case（`get_user_by_id`）
- 类型/结构体：PascalCase（`UserService`）
- 常量：UPPER_SNAKE_CASE（`MAX_CONNECTIONS`）

**示例**：
```rust
pub async fn get_user(user_id: Uuid) -> Result<User, AppError> {
    let user = repository::find_by_id(user_id).await?;
    Ok(user)
}
```

## 文件组织原则

**原则**：多小文件 > 少大文件

- 200-400 行常规，800 行上限
- 按功能/领域组织，而非按类型
- 高内聚，低耦合

## 代码质量检查清单

- [ ] 代码可读且命名清晰
- [ ] 函数小巧（<50 行）
- [ ] 文件专注（<800 行）
- [ ] 无深层嵌套（>4 层）
- [ ] 错误处理完善
- [ ] 无硬编码值
- [ ] 使用不可变模式

## 内置资源

- `frontend/` - 前端专用规范
- `backend/` - 后端专用规范
- `naming/` - 命名规范指南
- `file-organization/` - 项目结构指南

完整文档见 `README.md`。
