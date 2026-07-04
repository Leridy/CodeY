# Phase 5: 验收与提交

## 概述

主 Agent 验证所有结果，执行原子提交，更新进度。

## 负责人

主 Agent

## 目标

验证所有结果，执行原子提交，更新进度。

## 流程

1. 验证测试结果（全部通过）
2. 验证审查结果（无 CRITICAL 问题）
3. 修复 HIGH 问题（如需要）
4. 执行原子提交
5. 更新 progress.md
6. 向用户报告完成状态

## 验收检查清单

- [ ] 测试全部通过
- [ ] 无 CRITICAL 审查问题
- [ ] HIGH 问题已处理或有明确计划
- [ ] 代码符合编码规范
- [ ] Spec 实现完整
- [ ] 进度文件已更新

## 原子提交规则

每次提交必须代表一个可工作的状态：

- 每次提交的代码必须能编译通过
- 每次提交的测试必须全部通过
- 一个提交只做一件事（single responsibility）
- 提交信息描述做了什么，不是怎么做的

## 提交信息格式

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

## 提交信息示例

```
feat: implement JWT token validation

Add JWT middleware for API endpoint protection:
- Token extraction from Authorization header
- Signature verification with RS256
- Expiration check with 5-minute grace period
- Role-based access control integration

Co-Authored-By: Claude <noreply@anthropic.com>
```

## 进度更新

提交后必须更新 progress.md：

1. 标记完成的任务：`- [x] 任务名称 (YYYY-MM-DD HH:MM)`
2. 更新当前阶段
3. 更新最后更新时间
4. 如有新任务，添加到待办池

## 验收报告

```markdown
## 验收报告

### 功能：<功能名称>
- 完成时间：YYYY-MM-DD HH:MM
- 提交：<commit hash>

### 验收结果
- [x] 测试全部通过
- [x] 无 CRITICAL 审查问题
- [x] HIGH 问题已修复
- [x] 代码符合规范
- [x] Spec 实现完整
- [x] 进度已更新

### 变更摘要
- 新增文件：X 个
- 修改文件：X 个
- 测试覆盖：XX%
```
