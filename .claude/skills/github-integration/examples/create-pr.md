# 创建 PR 示例

展示如何使用 github-integration skill 创建各种类型的 Pull Request。

---

## 示例 1: 从当前分支创建 PR

### 命令

```bash
# 确保在功能分支上
git checkout feature/123-user-auth

# 创建 PR
/github-integration create pr \
  --title "feat(auth): 添加JWT认证功能 (#123)" \
  --body "实现JWT token认证机制" \
  --reviewers "teammate1,teammate2"
```

### 生成的 PR

```markdown
## 描述

实现JWT token认证机制，支持用户登录、token刷新和权限验证。

## 变更类型

- [x] 新功能 (feat)

## 变更内容

### 新增
- JWT token 生成和验证
- 用户登录接口
- Token 刷新接口
- 权限验证中间件

### 变更
- 更新用户模型
- 修改认证流程

## 技术实现

### 后端
- 使用 `jsonwebtoken` crate
- 实现 token 黑名单机制
- 支持 token 自动刷新

### 前端
- 添加登录组件
- 实现 token 存储
- 自动刷新机制

## 测试

- [x] 单元测试：覆盖率 85%
- [x] 集成测试：所有场景覆盖
- [x] E2E测试：登录流程验证

## 相关 Issue

Closes #123

## 截图

[登录界面截图]

## 检查清单

- [x] 代码遵循项目规范
- [x] 已运行 linter
- [x] 已运行 formatter
- [x] 无合并冲突
- [x] 文档已更新
- [x] CHANGELOG 已更新
```

---

## 示例 2: 创建草稿 PR

### 命令

```bash
# 创建草稿 PR
/github-integration create pr \
  --title "WIP: 新功能开发" \
  --body "正在开发中，不完整" \
  --draft
```

### 生成的 PR

```markdown
## 描述

正在开发中，不完整。

## 变更类型

- [ ] 新功能 (feat)

## 变更内容

### 新增
- 初始实现

### 待完成
- 完善功能
- 添加测试
- 更新文档

## 状态

- [ ] 功能实现
- [ ] 测试覆盖
- [ ] 文档更新
- [ ] 代码审查

## 备注

这是一个草稿 PR，正在开发中。
```

---

## 示例 3: 指定目标分支创建 PR

### 命令

```bash
# 从 feature 分支到 develop 分支
/github-integration create pr \
  --base develop \
  --head feature/123-user-auth \
  --title "feat(auth): 添加JWT认证功能 (#123)" \
  --body "实现JWT token认证机制"
```

### 生成的 PR

```markdown
## 描述

实现JWT token认证机制，支持用户登录、token刷新和权限验证。

## 目标分支

- 源分支: `feature/123-user-auth`
- 目标分支: `develop`

## 变更类型

- [x] 新功能 (feat)

## 变更内容

[同示例1]

## 相关 Issue

Closes #123
```

---

## 示例 4: 关联多个 Issue

### 命令

```bash
# 关联多个 Issue
/github-integration create pr \
  --title "feat(auth): 认证系统重构 (#123, #124, #125)" \
  --body "重构认证系统，解决多个相关问题" \
  --labels "enhancement,security"
```

### 生成的 PR

```markdown
## 描述

重构认证系统，解决多个相关问题。

## 变更类型

- [x] 新功能 (feat)
- [x] 重构 (refactor)

## 变更内容

### 新增
- JWT token 支持
- OAuth2.0 集成
- 多因素认证

### 重构
- 认证流程重构
- 权限系统重构

### 修复
- 修复 token 过期问题
- 修复权限验证漏洞

## 相关 Issue

- Closes #123 - JWT token 支持
- Closes #124 - OAuth2.0 集成
- Closes #125 - 多因素认证

## 测试

- [x] 单元测试：覆盖率 90%
- [x] 集成测试：所有场景覆盖
- [x] E2E测试：完整流程验证
- [x] 安全测试：渗透测试通过

## 检查清单

- [x] 代码遵循项目规范
- [x] 已运行 linter
- [x] 已运行 formatter
- [x] 无合并冲突
- [x] 文档已更新
- [x] CHANGELOG 已更新
- [x] 安全审查通过
```

---

## 示例 5: 添加标签和指派

### 命令

```bash
# 添加标签和指派
/github-integration create pr \
  --title "fix(auth): 修复登录问题 (#126)" \
  --body "修复登录时的密码验证错误" \
  --labels "bug,urgent" \
  --assignees "leridy" \
  --reviewers "security-team"
```

### 生成的 PR

```markdown
## 描述

修复登录时的密码验证错误。

## 变更类型

- [x] Bug 修复 (fix)

## 变更内容

### 修复
- 修正密码哈希比较逻辑
- 添加回归测试

## 相关 Issue

Fixes #126

## 测试

- [x] 单元测试通过
- [x] 集成测试通过
- [x] 手动测试验证

## 检查清单

- [x] 代码遵循项目规范
- [x] 已运行 linter
- [x] 已运行 formatter
- [x] 无合并冲突
- [x] 安全审查通过
```

---

## 示例 6: 使用 PR 模板

### 命令

```bash
# 使用项目模板
/github-integration create pr \
  --template default \
  --title "feat(ui): 添加暗色模式 (#127)" \
  --body "实现暗色模式主题切换" \
  --labels "enhancement,ui"
```

### 模板内容

```markdown
## 描述

实现暗色模式主题切换。

## 变更类型

- [x] 新功能 (feat)

## 变更内容

### 新增
- 暗色主题配置
- 主题切换组件
- 主题持久化

### 变更
- 更新 CSS 变量
- 修改组件样式

## 截图

### 暗色模式
[暗色模式截图]

### 亮色模式
[亮色模式截图]

## 测试

- [x] 单元测试通过
- [x] 视觉回归测试通过
- [x] 跨浏览器测试通过

## 相关 Issue

Closes #127

## 检查清单

- [x] 代码遵循项目规范
- [x] 已运行 linter
- [x] 已运行 formatter
- [x] 无合并冲突
- [x] 文档已更新
- [x] CHANGELOG 已更新
```

---

## 最佳实践

### 1. PR 标题规范

```
✅ 好的标题
"feat(auth): 添加JWT认证功能 (#123)"
"fix(parser): 修复JSON解析错误 (#456)"
"docs: 更新API文档 (#789)"

❌ 差的标题
"新功能"
"修复bug"
"更新文档"
```

### 2. PR 描述完整

```
✅ 好的描述
- 清晰说明变更内容
- 关联相关 Issue
- 包含测试信息
- 添加截图（如适用）

❌ 差的描述
- 只说"修复问题"
- 缺少上下文
- 没有测试信息
```

### 3. 审查人员选择

```
✅ 好的选择
- 选择相关领域的专家
- 包含代码所有者
- 适当数量（2-3人）

❌ 差的选择
- 选择不相关的人员
- 只选择一个人
- 选择太多人
```

### 4. 标签使用

```
✅ 好的标签
- 准确反映变更类型
- 包含优先级信息
- 包含模块信息

❌ 差的标签
- 无标签
- 标签过多
- 标签不准确
```

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
git push origin feature/123-user-auth --force-with-lease
```

### Q: 需要修改已提交的代码怎么办？

```bash
# 修改代码
git add .
git commit --amend

# 或创建新提交
git commit -m "fix: 根据审查意见修改"

# 推送更新
git push origin feature/123-user-auth --force-with-lease
```

### Q: 审查人员不响应怎么办？

1. 等待合理时间（24-48小时）
2. 通过其他渠道提醒
3. 请求其他审查人员

---

## 相关文档

- [PR 创建工作流](../workflows/pr-creation.md)
- [创建 Issue 示例](./create-issue.md)
- [PR 模板](../templates/pr-template.md)
