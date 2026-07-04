---
name: github-integration
description: 在创建、查看或管理 GitHub Issue 和 Pull Request 时使用此 skill。也适用于将 Issue 转化为开发流程、AI 辅助分类 Issue 或同步仓库状态。触发关键词："issue"、"PR"、"pull request"、"GitHub"、"bug report"、"feature request"、"代码审查"、"merge"、"branch"、"分支"。
---

# GitHub 集成 Skill

AI 驱动的 GitHub 工作流集成，支持 Issue/PR 管理、自动化分类和标准化开发流程。

## 何时激活

- 创建或管理 GitHub Issue 和 Pull Request
- 获取和分析在线 Issue/PR
- 将 Issue 自动转化为 bugfix 或 feature 开发流程
- 对 Issue 进行 AI 辅助分类和优先级评估
- 执行代码审查和 PR 合并
- 同步远程仓库状态

## Issue 操作

```bash
# 创建 Issue
gh issue create --title "标题" --body "描述" --label "bug"

# 查看 Issue 列表
gh issue list --state open --limit 20

# 查看 Issue 详情
gh issue view <number>

# 更新 Issue
gh issue edit <number> --add-label "priority:high"

# 关闭 Issue
gh issue close <number>
```

## PR 操作

```bash
# 创建 PR
gh pr create --title "feat: 功能描述" --body "详情"

# 查看 PR 列表
gh pr list --state open

# 审查 PR
gh pr review <number> --approve --body "LGTM!"

# 合并 PR
gh pr merge <number> --squash --delete-branch
```

## Issue 分类

AI 辅助分类，自动识别类型和优先级：

**类型标签**：`bug`、`enhancement`、`question`、`docs`

**优先级标签**：`priority:critical`、`priority:high`、`priority:medium`、`priority:low`

## 分支命名规范

| 类型 | 格式 | 示例 |
|------|------|------|
| Feature | `feature/<issue>-<desc>` | `feature/123-user-auth` |
| Bugfix | `fix/<issue>-<desc>` | `fix/456-login-error` |
| Hotfix | `hotfix/<issue>-<desc>` | `hotfix/789-security` |
| Docs | `docs/<issue>-<desc>` | `docs/101-api-guide` |

## PR 规范

**标题格式**：`<type>(<scope>): <description> (#<issue>)`

**类型**：feat, fix, docs, refactor, test, chore, perf, ci

**自动关闭 Issue**：在 PR 描述中使用 `Fixes #<issue>`

## Skill 集成

| Skill | 集成点 |
|-------|--------|
| `codey-brainstorming` | Issue → 需求澄清 |
| `codey-dev-workflow` | Feature → 标准开发流程 |
| `codey-testing-standards` | PR → 测试覆盖率验证 |
| `doc-maintainer` | Spec → 文档更新 |

## 内置资源

- `workflows/` - 工作流详细定义
- `templates/` - PR/Issue 模板
- `examples/` - 使用示例

完整文档见 `README.md`。
