# GitHub Integration - 完整文档

AI 驱动的 GitHub 工作流集成，实现 Issue/PR 的智能化管理。

---

## 核心概念

### 设计理念

1. **AI 辅助决策**：使用 AI 分析 Issue 类型、优先级和实现方案
2. **流程自动化**：从 Issue 到 PR 的全链路自动化
3. **标准化执行**：遵循项目既定的开发规范和工作流
4. **知识沉淀**：通过头脑风暴积累项目经验

### 工作流模式

| 模式 | 触发条件 | 执行流程 |
|------|---------|----------|
| Bug Fix | Issue 标记为 `bug` | Issue → 分析 → 修复 → PR |
| Feature | Issue 标记为 `enhancement` | Issue → 头脑风暴 → Spec → 开发 → PR |
| Triage | 新 Issue 创建 | Issue → AI 分类 → 标签 → 分配 |
| Review | PR 创建/更新 | PR → 代码审查 → 反馈 → 合并 |

---

## 命令参考

### 1. Issue 管理

#### create issue

创建新的 GitHub Issue。

**语法**

```bash
/github-integration create issue [options]
```

**参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| --type | string | 否 | Issue 类型：bug, feature, question, docs |
| --title | string | 是 | Issue 标题 |
| --body | string | 否 | Issue 描述 |
| --labels | string[] | 否 | 标签列表 |
| --assignees | string[] | 否 | 指派人员 |
| --milestone | string | 否 | 里程碑 |

**示例**

```bash
# 创建 Bug 报告
/github-integration create issue \
  --type bug \
  --title "登录页面500错误" \
  --body "用户在登录时遇到服务器错误" \
  --labels "bug,urgent"

# 创建功能请求
/github-integration create issue \
  --type feature \
  --title "添加数据导出功能" \
  --body "支持导出为PDF和Excel格式" \
  --labels "enhancement"
```

#### list issues

获取 Issue 列表。

**语法**

```bash
/github-integration list issues [options]
```

**参数**

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| --state | string | 否 | open | Issue 状态：open, closed, all |
| --labels | string[] | 否 | - | 按标签过滤 |
| --assignee | string | 否 | - | 按指派人过滤 |
| --limit | number | 否 | 30 | 返回数量 |

**示例**

```bash
# 查看所有开放的 Issue
/github-integration list issues --state open

# 查看特定标签的 Issue
/github-integration list issues --labels "bug,urgent"

# 查看指派给我的 Issue
/github-integration list issues --assignee "@me"
```

#### view issue

查看 Issue 详情。

**语法**

```bash
/github-integration view issue <number>
```

**示例**

```bash
/github-integration view issue 123
```

#### update issue

更新 Issue 信息。

**语法**

```bash
/github-integration update issue <number> [options]
```

**参数**

| 参数 | 类型 | 说明 |
|------|------|------|
| --title | string | 新标题 |
| --body | string | 新描述 |
| --add-labels | string[] | 添加标签 |
| --remove-labels | string[] | 移除标签 |
| --add-assignees | string[] | 添加指派人 |
| --state | string | 状态：open, closed |

**示例**

```bash
# 添加标签
/github-integration update issue 123 --add-labels "bug,priority:high"

# 关闭 Issue
/github-integration update issue 123 --state closed
```

---

### 2. PR 管理

#### create pr

创建 Pull Request。

**语法**

```bash
/github-integration create pr [options]
```

**参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| --title | string | 是 | PR 标题 |
| --body | string | 否 | PR 描述 |
| --base | string | 否 | 目标分支（默认：main/master） |
| --head | string | 否 | 源分支（默认：当前分支） |
| --draft | boolean | 否 | 创建为草稿 |
| --reviewers | string[] | 否 | 审查人员 |
| --assignees | string[] | 否 | 指派人员 |
| --labels | string[] | 否 | 标签 |

**示例**

```bash
# 从当前分支创建 PR
/github-integration create pr \
  --title "feat: 添加用户认证功能" \
  --body "实现JWT token认证机制" \
  --reviewers "teammate1,teammate2"

# 创建草稿 PR
/github-integration create pr \
  --title "WIP: 新功能开发" \
  --draft
```

#### list prs

获取 PR 列表。

**语法**

```bash
/github-integration list prs [options]
```

**参数**

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| --state | string | 否 | open | PR 状态：open, closed, merged, all |
| --base | string | 否 | - | 目标分支过滤 |
| --head | string | 否 | - | 源分支过滤 |
| --limit | number | 否 | 30 | 返回数量 |

**示例**

```bash
# 查看所有开放的 PR
/github-integration list prs --state open

# 查看目标为 main 的 PR
/github-integration list prs --base main
```

#### view pr

查看 PR 详情。

**语法**

```bash
/github-integration view pr <number>
```

**示例**

```bash
/github-integration view pr 456
```

#### review pr

审查 Pull Request。

**语法**

```bash
/github-integration review pr <number> [options]
```

**参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| --event | string | 是 | 审查事件：approve, request_changes, comment |
| --body | string | 否 | 审查评论 |

**示例**

```bash
# 批准 PR
/github-integration review pr 456 --event approve --body "LGTM!"

# 请求修改
/github-integration review pr 456 --event request_changes --body "需要添加测试"
```

#### merge pr

合并 Pull Request。

**语法**

```bash
/github-integration merge pr <number> [options]
```

**参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| --method | string | 否 | 合并方法：merge, squash, rebase（默认：squash） |
| --delete-branch | boolean | 否 | 合并后删除分支 |

**示例**

```bash
# 使用 squash 合并
/github-integration merge pr 456 --method squash --delete-branch
```

---

### 3. 智能分类

#### triage issues

AI 辅助的 Issue 分类。

**语法**

```bash
/github-integration triage issues [options]
```

**参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| --limit | number | 否 | 处理数量（默认：10） |
| --auto-label | boolean | 否 | 自动添加标签（默认：true） |
| --auto-assign | boolean | 否 | 自动指派（默认：false） |

**执行流程**

1. 获取未分类的 Issue
2. AI 分析 Issue 内容
3. 识别类型（bug/feature/question/docs）
4. 评估优先级（low/medium/high/critical）
5. 自动添加标签
6. 生成分类报告

**示例**

```bash
# 分类最近 20 个 Issue
/github-integration triage issues --limit 20

# 仅分析，不自动标签
/github-integration triage issues --auto-label false
```

---

### 4. 流程转化

#### convert issue

将 Issue 转化为开发流程。

**语法**

```bash
/github-integration convert issue <number> [options]
```

**参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| --to | string | 否 | 转化类型：bugfix, feature（默认：自动判断） |
| --branch | string | 否 | 自定义分支名 |
| --spec | boolean | 否 | 生成 Spec 文档（默认：true） |

**执行流程**

1. 获取 Issue 详情
2. AI 分析需求
3. 调用 `codey-brainstorming` skill 进行头脑风暴
4. 生成 Spec 文档（design.md, api.md, test.md）
5. 创建功能分支
6. 调用 `codey-dev-workflow` skill 执行开发流程
7. 完成后自动创建 PR

**示例**

```bash
# 自动判断类型并转化
/github-integration convert issue 123

# 指定为 feature 类型
/github-integration convert issue 123 --to feature

# 自定义分支名
/github-integration convert issue 123 --branch feature/issue-123-export
```

---

### 5. 状态同步

#### sync status

同步远程仓库状态。

**语法**

```bash
/github-integration sync status [options]
```

**参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| --fetch | boolean | 否 | 获取远程更新（默认：true） |
| --prune | boolean | 否 | 清理已删除的远程分支（默认：true） |

**示例**

```bash
# 完整同步
/github-integration sync status

# 仅获取，不清理
/github-integration sync status --prune false
```

---

## 工作流详解

### Bug Fix 工作流

```
Issue (bug)
    │
    ▼
AI 分析
    │
    ├── 严重程度评估
    ├── 影响范围分析
    └── 修复方案建议
    │
    ▼
创建分支
    │
    └── fix/<issue-number>-<short-description>
    │
    ▼
实现修复
    │
    ├── 定位问题
    ├── 编写修复代码
    └── 添加回归测试
    │
    ▼
创建 PR
    │
    ├── 关联 Issue
    ├── 描述修复内容
    └── 请求审查
    │
    ▼
审查合并
    │
    └── 自动关闭 Issue
```

### Feature 工作流

```
Issue (feature)
    │
    ▼
AI 分析
    │
    ├── 需求理解
    ├── 技术可行性
    └── 实现复杂度
    │
    ▼
头脑风暴
    │
    ├── 调用 codey-brainstorming
    ├── 需求澄清
    ├── 方案生成
    └── Spec 文档
    │
    ▼
创建分支
    │
    └── feature/<issue-number>-<short-description>
    │
    ▼
开发实现
    │
    ├── 调用 codey-dev-workflow
    ├── 代码实现
    ├── 测试编写
    └── 代码审查
    │
    ▼
创建 PR
    │
    ├── 关联 Issue
    ├── Spec 文档引用
    └── 测试报告
    │
    ▼
审查合并
    │
    └── 自动关闭 Issue
```

---

## 模板说明

### 分支命名规范

| 类型 | 格式 | 示例 |
|------|------|------|
| Feature | `feature/<issue>-<desc>` | `feature/123-user-auth` |
| Bugfix | `fix/<issue>-<desc>` | `fix/456-login-error` |
| Hotfix | `hotfix/<issue>-<desc>` | `hotfix/789-security-patch` |
| Docs | `docs/<issue>-<desc>` | `docs/101-api-guide` |
| Refactor | `refactor/<issue>-<desc>` | `refactor/202-auth-module` |

### PR 模板

自动使用项目根目录的 `.github/PULL_REQUEST_TEMPLATE.md`。

### Issue 模板

自动使用项目根目录的 `.github/ISSUE_TEMPLATE/` 下的模板。

---

## 配置

### 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `GITHUB_DEFAULT_BASE` | `main` | 默认目标分支 |
| `GITHUB_DEFAULT_METHOD` | `squash` | 默认合并方法 |
| `GITHUB_AUTO_DELETE_BRANCH` | `true` | 合并后自动删除分支 |
| `GITHUB_AUTO_LINK_ISSUES` | `true` | 自动关联 Issue |
| `GITHUB_SPEC_GENERATION` | `true` | 转化时自动生成 Spec |

### 配置文件

在项目根目录创建 `.codey/github-config.json`：

```json
{
  "defaultBase": "main",
  "defaultMethod": "squash",
  "autoDeleteBranch": true,
  "autoLinkIssues": true,
  "specGeneration": true,
  "triage": {
    "autoLabel": true,
    "autoAssign": false,
    "priorityMapping": {
      "critical": ["security", "production"],
      "high": ["bug", "urgent"],
      "medium": ["enhancement"],
      "low": ["docs", "question"]
    }
  },
  "branches": {
    "feature": "feature/{issue}-{desc}",
    "bugfix": "fix/{issue}-{desc}",
    "hotfix": "hotfix/{issue}-{desc}"
  }
}
```

---

## 最佳实践

### 1. Issue 编写

```
✅ 好的 Issue
标题：[Bug] 登录页面输入正确密码仍提示错误
内容：
- 环境：macOS, Chrome 120
- 步骤：1. 打开登录页 2. 输入正确密码 3. 点击登录
- 预期：登录成功
- 实际：提示"密码错误"
- 日志：[错误日志]

❌ 差的 Issue
标题：登录有问题
内容：登录不了
```

### 2. PR 编写

```
✅ 好的 PR
标题：fix: 修复登录密码验证逻辑 (#123)
内容：
## 描述
修复登录时密码验证失败的问题

## 变更
- 修正密码哈希比较逻辑
- 添加回归测试

## 测试
- [x] 单元测试通过
- [x] 手动测试验证

Closes #123

❌ 差的 PR
标题：修复bug
内容：修复了登录问题
```

### 3. 分支管理

```bash
# 从最新 main 创建分支
git checkout main
git pull origin main
git checkout -b feature/123-new-feature

# 定期同步主分支
git fetch origin
git rebase origin/main

# 合并后删除分支
git branch -d feature/123-new-feature
git push origin --delete feature/123-new-feature
```

---

## 故障排除

### 问题：gh 命令执行失败

**症状**：`gh: command not found` 或认证失败

**解决方案**：

```bash
# 安装 GitHub CLI
brew install gh

# 认证
gh auth login

# 验证
gh auth status
```

### 问题：无法创建 PR

**症状**：`no commits between base and head`

**解决方案**：

```bash
# 确保有提交
git log origin/main..HEAD

# 确保分支已推送
git push origin feature/123-new-feature
```

### 问题：Issue 关联失败

**症状**：PR 创建时未自动关联 Issue

**解决方案**：

```bash
# 在 PR 描述中使用关键词
Closes #123
Fixes #123
Resolves #123
```

---

## 更新日志

### v1.0.0 (2026-07-05)

- 初始版本
- Issue 创建、列表、查看、更新功能
- PR 创建、列表、查看、审查、合并功能
- AI 辅助 Issue 分类
- Issue 到开发流程转化
- 与 brainstorming 和 dev-workflow skill 集成

---

*Skill 版本：v1.0.0*
*创建日期：2026-07-05*
