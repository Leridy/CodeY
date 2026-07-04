# PR 创建工作流

标准化的 Pull Request 创建流程，确保代码质量和可追溯性。

---

## 流程概览

```
准备代码 → 选择模板 → 填写信息 → 关联 Issue → 请求审查 → 等待合并
```

---

## 前置条件

1. **代码准备**
   - 所有测试通过
   - 代码符合项目规范
   - 无合并冲突

2. **分支状态**
   - 分支已推送到远程
   - 有明确的提交历史
   - 分支命名符合规范

3. **文档完整**
   - 提交信息符合 Conventional Commits
   - 代码有适当注释
   - 变更已记录到 CHANGELOG（如适用）

---

## 执行步骤

### Step 1: 验证代码状态

```bash
# 检查测试
pnpm test
cargo test

# 检查代码规范
pnpm lint
cargo clippy

# 检查格式
pnpm format
cargo fmt

# 检查分支状态
git status
git log origin/main..HEAD --oneline
```

### Step 2: 同步主分支

```bash
# 获取最新代码
git fetch origin

# 变基到主分支
git rebase origin/main

# 解决冲突（如有）
# ...

# 推送更新
git push origin feature/123-new-feature --force-with-lease
```

### Step 3: 创建 PR

```bash
# 使用 skill 创建
/github-integration create pr \
  --title "feat: 添加新功能 (#123)" \
  --body "实现详情..." \
  --reviewers "teammate1,teammate2"
```

### Step 4: 填写 PR 描述

使用项目模板（`.github/PULL_REQUEST_TEMPLATE.md`）：

```markdown
## 描述

简要描述此 PR 的目的和实现方式。

## 变更类型

- [x] 新功能 (feat)

## 变更内容

### 新增
- 功能 A
- 功能 B

### 变更
- 优化 C

## 相关 Issue

Closes #123

## 测试

- [x] 添加了新的单元测试
- [x] 所有测试通过
- [x] 测试覆盖率 >= 80%

## 截图（如适用）

[截图]

## 检查清单

- [x] 代码遵循项目规范
- [x] 已运行 linter
- [x] 已运行 formatter
- [x] 无合并冲突
```

### Step 5: 请求审查

```bash
# 添加审查人员
/github-integration update pr 456 --add-reviewers "teammate1"

# 或在创建时指定
/github-integration create pr --reviewers "teammate1,teammate2"
```

### Step 6: 等待审查

- 响应审查意见
- 进行必要的修改
- 再次请求审查（如需要）

### Step 7: 合并 PR

```bash
# 审查通过后合并
/github-integration merge pr 456 --method squash --delete-branch
```

---

## PR 标题规范

使用 Conventional Commits 格式：

```
<type>(<scope>): <description> (#<issue>)
```

| 类型 | 说明 | 示例 |
|------|------|------|
| `feat` | 新功能 | `feat(auth): 添加JWT认证 (#123)` |
| `fix` | Bug 修复 | `fix(parser): 修复JSON解析错误 (#456)` |
| `docs` | 文档更新 | `docs: 更新API文档 (#789)` |
| `refactor` | 重构 | `refactor(auth): 重构认证模块 (#101)` |
| `test` | 测试 | `test(auth): 添加认证测试 (#202)` |
| `chore` | 构建/工具 | `chore: 更新依赖 (#303)` |

---

## 审查要点

### 代码质量

- [ ] 代码风格一致
- [ ] 命名清晰
- [ ] 函数职责单一
- [ ] 无重复代码
- [ ] 适当的错误处理

### 功能正确性

- [ ] 实现符合需求
- [ ] 边界条件处理
- [ ] 错误场景覆盖
- [ ] 性能可接受

### 测试覆盖

- [ ] 单元测试完整
- [ ] 集成测试覆盖
- [ ] 测试用例清晰
- [ ] 覆盖率达标

### 安全性

- [ ] 无硬编码密钥
- [ ] 输入已验证
- [ ] 无 SQL 注入
- [ ] 无 XSS 漏洞

---

## 常见问题

### Q: PR 有合并冲突怎么办？

```bash
# 同步主分支
git fetch origin
git rebase origin/main

# 解决冲突
# 编辑冲突文件
git add .
git rebase --continue

# 强制推送
git push origin feature/123-new-feature --force-with-lease
```

### Q: 审查人员不响应怎么办？

1. 等待合理时间（24-48小时）
2. 通过其他渠道提醒
3. 请求其他审查人员

### Q: 需要修改已提交的代码怎么办？

```bash
# 修改代码
git add .
git commit --amend

# 或创建新提交
git commit -m "fix: 根据审查意见修改"

# 推送更新
git push origin feature/123-new-feature --force-with-lease
```

---

## 自动化集成

### GitHub Actions

```yaml
# .github/workflows/pr-check.yml
name: PR Check

on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run tests
        run: pnpm test
      - name: Run linter
        run: pnpm lint
```

### 自动合并

配置自动合并条件：

```bash
# 设置自动合并
gh pr merge 456 --auto --squash
```

---

## 相关文档

- [Issue Triage 工作流](./issue-triage.md)
- [Bug Fix 工作流](./bugfix-flow.md)
- [Feature 工作流](./feature-flow.md)
- [分支命名规范](../templates/branch-naming.md)
