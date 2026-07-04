# 分支命名规范

标准化的 Git 分支命名，便于识别和管理。

---

## 命名格式

```
<type>/<issue-number>-<short-description>
```

### 类型前缀

| 前缀 | 说明 | 示例 |
|------|------|------|
| `feature/` | 新功能 | `feature/123-user-auth` |
| `fix/` | Bug 修复 | `fix/456-login-error` |
| `hotfix/` | 紧急修复 | `hotfix/789-security-patch` |
| `docs/` | 文档更新 | `docs/101-api-guide` |
| `refactor/` | 代码重构 | `refactor/202-auth-module` |
| `test/` | 测试相关 | `test/303-auth-tests` |
| `chore/` | 构建/工具 | `chore/404-update-deps` |

### 命名规则

1. **全小写**：所有字母小写
2. **连字符分隔**：单词之间用 `-` 连接
3. **简洁明了**：描述控制在 3-5 个单词
4. **包含 Issue 号**：便于追溯

---

## 示例

### Feature 分支

```bash
# 好的命名
feature/123-user-authentication
feature/456-data-export
feature/789-dark-mode

# 差的命名
feature/UserAuth          # 包含大写
feature/add-new-feature   # 描述太泛
feature/123               # 缺少描述
```

### Fix 分支

```bash
# 好的命名
fix/123-login-500-error
fix/456-null-pointer
fix/789-memory-leak

# 差的命名
fix/bug                   # 描述太泛
fix/123-fix               # 描述无意义
fix/123-login-error-fix   # 包含冗余的 fix
```

### Hotfix 分支

```bash
# 好的命名
hotfix/123-security-vulnerability
hotfix/456-data-corruption
hotfix/789-production-crash

# 差的命名
hotfix/urgent             # 缺少 Issue 号
hotfix/123-fix            # 描述太泛
```

---

## 特殊情况

### 无 Issue 的分支

```bash
# 使用描述性命名
feature/add-unit-tests
fix/fix-typo-in-readme
chore/update-dependencies
```

### 长期分支

```bash
# 使用版本或阶段标识
release/v1.0.0
epic/user-management
experiment/new-ui
```

### 个人分支

```bash
# 使用开发者前缀
dev/leridy/feature/123-user-auth
dev/john/fix/456-login-error
```

---

## 分支管理

### 创建分支

```bash
# 从主分支创建
git checkout main
git pull origin main
git checkout -b feature/123-user-auth

# 从指定分支创建
git checkout -b feature/123-user-auth origin/develop
```

### 删除分支

```bash
# 删除本地分支
git branch -d feature/123-user-auth

# 删除远程分支
git push origin --delete feature/123-user-auth
```

### 分支清理

```bash
# 清理已合并的本地分支
git branch --merged main | grep -v "main" | xargs git branch -d

# 清理已删除的远程分支引用
git fetch --prune
```

---

## 自动化

### Git Hook

```bash
#!/bin/bash
# .git/hooks/pre-push

BRANCH=$(git rev-parse --abbrev-ref HEAD)

# 检查分支命名
if [[ ! $BRANCH =~ ^(feature|fix|hotfix|docs|refactor|test|chore)/[0-9]+-[a-z0-9-]+$ ]]; then
    echo "错误: 分支命名不符合规范"
    echo "格式: <type>/<issue-number>-<short-description>"
    echo "示例: feature/123-user-auth"
    exit 1
fi
```

### GitHub Actions

```yaml
# .github/workflows/branch-check.yml
name: Branch Name Check

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - name: Check branch name
        run: |
          BRANCH="${{ github.head_ref }}"
          if [[ ! $BRANCH =~ ^(feature|fix|hotfix|docs|refactor|test|chore)/[0-9]+-[a-z0-9-]+$ ]]; then
            echo "错误: 分支命名不符合规范"
            exit 1
          fi
```

---

## 常见问题

### Q: Issue 号不确定怎么办？

```bash
# 先创建 Issue，再创建分支
gh issue create --title "新功能" --body "描述"
# 获取 Issue 号后创建分支
git checkout -b feature/123-new-feature
```

### Q: 分支名太长怎么办？

```bash
# 缩短描述
feature/123-user-auth     # 而不是 feature/123-user-authentication-module

# 使用缩写
feature/123-auth          # 如果上下文清晰
```

### Q: 多人协作同一 Issue 怎么办？

```bash
# 添加开发者标识
feature/123-user-auth-leridy
feature/123-user-auth-john

# 或使用个人分支前缀
dev/leridy/feature/123-user-auth
dev/john/feature/123-user-auth
```

---

## 相关文档

- [PR 创建工作流](../workflows/pr-creation.md)
- [提交规范](./commit-conventions.md)
