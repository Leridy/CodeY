# CodeY 代码规范

统一的全栈代码规范，覆盖 TypeScript/React 前端和 Rust 后端，确保团队代码风格一致。

## 何时使用

- 编写新代码前，查阅对应语言规范
- 代码审查时，作为规范对照标准
- 配置 linter/formatter 时，参考配置模板
- 命名不确定时，查阅命名规范

## 快速开始

编写前端组件时：
```typescript
// 遵循 PascalCase 命名组件
export function UserProfile({ userId }: UserProfileProps) {
  // 使用 camelCase 命名函数和变量
  const { data, isLoading } = useUser(userId)
  if (isLoading) return <LoadingSpinner />
  return <div>{data.name}</div>
}
```

编写 Rust 代码时：
```rust
// 使用 snake_case 命名函数和变量
pub async fn get_user(user_id: Uuid) -> Result<User, AppError> {
    let user = repository::find_by_id(user_id).await?;
    Ok(user)
}
```

## 详细文档

- [完整规范说明](./README.md)
- [前端规范](./frontend/) - TypeScript、React、ESLint、Prettier
- [后端规范](./backend/) - Rust、rustfmt、clippy
- [命名规范](./naming/) - 前端和后端命名约定
- [文件组织](./file-organization/) - 项目结构和文件组织
