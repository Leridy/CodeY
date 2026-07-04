# 提交信息模板

## 格式

```
<type>: <description>

<optional body>

Co-Authored-By: Claude <noreply@anthropic.com>
```

## 类型定义

| 类型 | 说明 | 示例 |
|------|------|------|
| feat | 新功能 | feat: add user authentication module |
| fix | Bug 修复 | fix: handle null pointer in file parser |
| refactor | 代码重构 | refactor: extract validation logic to utils |
| docs | 文档更新 | docs: add API spec for user endpoints |
| test | 测试相关 | test: add unit tests for auth service |
| chore | 构建/工具相关 | chore: update build configuration |
| perf | 性能优化 | perf: optimize database query performance |
| ci | CI/CD 相关 | ci: add GitHub Actions workflow |

## 提交信息规范

### 标题行

- 长度：<= 72 字符
- 格式：`<type>: <description>`
- 语言：英文
- 语态：祈使句（动词开头）

### 正文

- 空行后开始
- 解释做了什么，为什么做
- 列出关键变更点
- 每行 <= 72 字符

### 页脚

- 空行后开始
- 包含 Co-Authored-By 信息
- 可包含其他元数据（如 Issue 编号）

## 示例

### 简单提交

```
feat: add user authentication module
```

### 详细提交

```
feat: implement JWT token validation

Add JWT middleware for API endpoint protection:
- Token extraction from Authorization header
- Signature verification with RS256
- Expiration check with 5-minute grace period
- Role-based access control integration

Co-Authored-By: Claude <noreply@anthropic.com>
```

### 修复提交

```
fix: handle null pointer in file parser

The file parser was crashing when encountering empty files.
Added null check before processing file content.

Fixes #123

Co-Authored-By: Claude <noreply@anthropic.com>
```

### 重构提交

```
refactor: extract validation logic to utils

Move input validation functions from controller to utils module
for better code organization and reusability.

- Extract validateEmail()
- Extract validatePassword()
- Extract validateUsername()
- Add unit tests for all validators

Co-Authored-By: Claude <noreply@anthropic.com>
```

## 原子提交规则

每次提交必须代表一个可工作的状态：

- 每次提交的代码必须能编译通过
- 每次提交的测试必须全部通过
- 一个提交只做一件事（single responsibility）
- 提交信息描述做了什么，不是怎么做的

## 注意事项

1. **不要提交半成品**：确保代码完整且可工作
2. **不要混合无关变更**：一个提交只做一件事
3. **使用祈使句**：说 "add feature" 而不是 "added feature"
4. **解释为什么**：正文解释变更的原因，而不仅仅是做了什么
5. **保持简洁**：标题行 <= 72 字符，正文每行 <= 72 字符
