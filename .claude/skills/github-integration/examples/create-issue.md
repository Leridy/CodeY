# 创建 Issue 示例

展示如何使用 github-integration skill 创建各种类型的 Issue。

---

## 示例 1: 创建 Bug 报告

### 命令

```bash
/github-integration create issue \
  --type bug \
  --title "登录页面输入正确密码仍提示错误" \
  --body "用户在登录页面输入正确密码后，点击登录按钮提示'密码错误'。" \
  --labels "bug,urgent" \
  --assignees "leridy"
```

### 生成的 Issue

```markdown
## Bug 报告

### 描述
用户在登录页面输入正确密码后，点击登录按钮提示"密码错误"。

### 复现步骤
1. 打开登录页面
2. 输入正确的邮箱和密码
3. 点击"登录"按钮
4. 看到错误提示"密码错误"

### 预期行为
应该成功登录并跳转到首页。

### 实际行为
提示"密码错误"，无法登录。

### 环境信息
- 操作系统: macOS 14.0
- 浏览器: Chrome 120
- 应用版本: 0.1.0

### 错误日志
```
[ERROR] 2026-07-05 10:30:15 auth::login - Password verification failed
```

### 截图
[登录错误截图]

### 检查清单
- [x] 已搜索现有 Issue
- [x] 已阅读文档
- [x] 已尝试最新版本
```

---

## 示例 2: 创建功能请求

### 命令

```bash
/github-integration create issue \
  --type feature \
  --title "添加数据导出功能" \
  --body "用户希望将数据导出为PDF和Excel格式，方便离线分析和报告生成。" \
  --labels "enhancement" \
  --milestone "v1.1.0"
```

### 生成的 Issue

```markdown
## 功能请求

### 描述
用户希望将数据导出为PDF和Excel格式，方便离线分析和报告生成。

### 问题描述
当前系统只支持在线查看数据，用户无法将数据导出到本地进行进一步分析。

### 期望方案
1. 支持导出为PDF格式
   - 包含表格和图表
   - 支持自定义样式
   - 支持批量导出

2. 支持导出为Excel格式
   - 支持多Sheet
   - 保留数据格式
   - 支持公式

### 使用场景
- 场景1: 用户需要生成月度报告
- 场景2: 用户需要将数据导入到其他系统
- 场景3: 用户需要离线分析数据

### 技术细节
- PDF生成: 使用 printpdf crate
- Excel生成: 使用 calamine crate
- 异步处理: 使用消息队列

### 优先级
- [x] 重要 - 严重影响使用体验

### 额外上下文
参考实现: [类似系统](https://example.com)

### 检查清单
- [x] 已搜索现有 Issue
- [x] 已阅读文档
- [x] 已确认功能未实现
```

---

## 示例 3: 创建文档 Issue

### 命令

```bash
/github-integration create issue \
  --type docs \
  --title "API文档缺失认证接口说明" \
  --body "API文档中缺少认证接口的详细说明，包括请求参数、响应格式和错误码。" \
  --labels "docs,good-first-issue"
```

### 生成的 Issue

```markdown
## 文档问题

### 描述
API文档中缺少认证接口的详细说明，包括请求参数、响应格式和错误码。

### 影响范围
- 新开发者无法快速上手
- 集成方无法正确调用接口
- 增加技术支持负担

### 建议内容
1. 认证接口概览
2. 请求参数说明
3. 响应格式说明
4. 错误码参考
5. 使用示例

### 相关接口
- POST /api/auth/login
- POST /api/auth/register
- POST /api/auth/refresh
- POST /api/auth/logout

### 参考文档
- [OpenAPI规范](https://swagger.io/specification/)
- [认证最佳实践](https://example.com)

### 检查清单
- [x] 已搜索现有 Issue
- [x] 已阅读现有文档
- [x] 已确认文档确实缺失
```

---

## 示例 4: 批量创建 Issue

### 命令

```bash
# 使用脚本批量创建
for i in {1..5}; do
  /github-integration create issue \
    --type feature \
    --title "子任务 $i: 功能模块 $i" \
    --body "实现功能模块 $i 的详细描述" \
    --labels "enhancement" \
    --milestone "v1.1.0"
done
```

### 生成的 Issue 列表

| Issue | 标题 | 类型 | 标签 |
|-------|------|------|------|
| #101 | 子任务 1: 功能模块 1 | Feature | enhancement |
| #102 | 子任务 2: 功能模块 2 | Feature | enhancement |
| #103 | 子任务 3: 功能模块 3 | Feature | enhancement |
| #104 | 子任务 4: 功能模块 4 | Feature | enhancement |
| #105 | 子任务 5: 功能模块 5 | Feature | enhancement |

---

## 示例 5: 使用 Issue 模板

### 命令

```bash
# 使用项目模板
/github-integration create issue \
  --template bug_report \
  --title "页面加载超时" \
  --body "页面加载时间超过10秒" \
  --labels "performance"
```

### 模板内容

```markdown
---
name: Bug 报告
about: 报告一个 Bug
title: '[Bug] '
labels: bug
---

## Bug 描述

页面加载时间超过10秒。

## 复现步骤

1. 访问首页
2. 点击"数据"菜单
3. 等待页面加载
4. 观察加载时间

## 预期行为

页面应在 2秒内 加载完成。

## 实际行为

页面加载时间超过 10秒。

## 环境信息

- 操作系统: macOS 14.0
- 浏览器: Chrome 120
- 网络: 100Mbps

## 错误日志

```
[PERF] 2026-07-05 10:30:15 page::load - Load time: 12.5s
```

## 检查清单

- [x] 已搜索现有 Issue
- [x] 已阅读文档
- [x] 已尝试最新版本
```

---

## 最佳实践

### 1. 标题清晰

```
✅ 好的标题
"[Bug] 登录页面输入正确密码仍提示错误"
"[Feature] 添加数据导出功能"
"[Docs] API文档缺失认证接口说明"

❌ 差的标题
"登录有问题"
"新功能"
"文档"
```

### 2. 描述完整

```
✅ 好的描述
- 包含复现步骤
- 包含环境信息
- 包含错误日志
- 包含预期行为

❌ 差的描述
- 只说"不工作"
- 缺少上下文
- 没有具体信息
```

### 3. 标签准确

```
✅ 好的标签
- bug, urgent, priority:high
- enhancement, good-first-issue
- docs, help-wanted

❌ 差的标签
- 无标签
- 标签过多
- 标签不相关
```

---

## 相关文档

- [Issue 分类工作流](../workflows/issue-triage.md)
- [创建 PR 示例](./create-pr.md)
- [Issue 模板](../templates/issue-template.md)
