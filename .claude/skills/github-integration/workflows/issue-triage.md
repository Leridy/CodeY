# Issue 分类工作流

AI 辅助的 Issue 智能分类，自动识别类型、评估优先级、添加标签。

---

## 流程概览

```
获取 Issue → AI 分析 → 类型识别 → 优先级评估 → 添加标签 → 生成报告
```

---

## 分类标准

### Issue 类型

| 类型 | 标签 | 触发关键词 | 示例 |
|------|------|-----------|------|
| Bug | `bug` | 错误、失败、异常、崩溃 | "登录失败"、"页面崩溃" |
| Feature | `enhancement` | 添加、实现、支持、希望 | "添加导出功能"、"支持暗色模式" |
| Question | `question` | 如何、怎么、为什么 | "如何配置"、"为什么不支持" |
| Documentation | `docs` | 文档、说明、README | "文档缺失"、"说明不清晰" |

### 优先级

| 优先级 | 标签 | 评估标准 | 响应时间 |
|--------|------|---------|---------|
| Critical | `priority:critical` | 生产环境阻断、安全漏洞 | 立即 |
| High | `priority:high` | 核心功能异常、严重影响体验 | 24小时 |
| Medium | `priority:medium` | 非核心功能异常、有 workaround | 1周 |
| Low | `priority:low` | 优化建议、非紧急改进 | 下个版本 |

---

## 执行步骤

### Step 1: 获取未分类 Issue

```bash
# 获取没有标签的 Issue
gh issue list --label "" --json number,title,body,createdAt

# 或获取最近创建的 Issue
gh issue list --state open --limit 20 --json number,title,body,labels
```

### Step 2: AI 分析

对每个 Issue 进行 AI 分析：

1. **内容理解**
   - 提取关键信息
   - 理解用户意图
   - 识别技术细节

2. **类型判断**
   - 分析问题描述
   - 匹配类型关键词
   - 考虑上下文

3. **优先级评估**
   - 影响范围评估
   - 紧急程度判断
   - 资源需求估算

### Step 3: 添加标签

```bash
# 添加类型标签
gh issue edit 123 --add-label "bug"

# 添加优先级标签
gh issue edit 123 --add-label "priority:high"

# 添加其他标签
gh issue edit 123 --add-label "needs-triage,needs-reproduction"
```

### Step 4: 生成分类报告

```markdown
## Issue 分类报告

**时间**: 2026-07-05 14:30
**处理数量**: 15 个 Issue

### 分类统计

| 类型 | 数量 | 占比 |
|------|------|------|
| Bug | 8 | 53% |
| Feature | 4 | 27% |
| Question | 2 | 13% |
| Docs | 1 | 7% |

### 优先级分布

| 优先级 | 数量 | 占比 |
|--------|------|------|
| Critical | 1 | 7% |
| High | 3 | 20% |
| Medium | 8 | 53% |
| Low | 3 | 20% |

### 详细列表

| Issue | 标题 | 类型 | 优先级 | 标签 |
|-------|------|------|--------|------|
| #123 | 登录失败 | Bug | High | bug, priority:high |
| #124 | 添加导出 | Feature | Medium | enhancement, priority:medium |
| #125 | 如何配置 | Question | Low | question, priority:low |
```

---

## AI 分析提示词

### 类型识别

```
分析以下 GitHub Issue，判断其类型：

标题：{title}
内容：{body}

类型选项：
- bug: 报告错误、异常或失败
- enhancement: 功能请求或改进建议
- question: 使用疑问或咨询
- docs: 文档相关问题

请返回 JSON 格式：
{
  "type": "bug|enhancement|question|docs",
  "confidence": 0.95,
  "reasoning": "判断依据"
}
```

### 优先级评估

```
评估以下 GitHub Issue 的优先级：

标题：{title}
内容：{body}
类型：{type}

优先级标准：
- critical: 生产环境阻断、安全漏洞、数据丢失
- high: 核心功能异常、严重影响用户体验
- medium: 非核心功能异常、有 workaround
- low: 优化建议、非紧急改进、文档完善

请返回 JSON 格式：
{
  "priority": "critical|high|medium|low",
  "confidence": 0.90,
  "reasoning": "评估依据",
  "impact": "影响范围",
  "urgency": "紧急程度"
}
```

---

## 自动化配置

### GitHub Actions

```yaml
# .github/workflows/issue-triage.yml
name: Issue Triage

on:
  issues:
    types: [opened]

jobs:
  triage:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Analyze Issue
        id: analyze
        uses: ./.github/actions/analyze-issue
        with:
          title: ${{ github.event.issue.title }}
          body: ${{ github.event.issue.body }}

      - name: Add Labels
        uses: actions/github-script@v7
        with:
          script: |
            await github.rest.issues.addLabels({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              labels: [steps.analyze.outputs.type, steps.analyze.outputs.priority]
            })
```

### Webhook 集成

```javascript
// Express.js 示例
app.post('/webhook/issues', (req, res) => {
  const { action, issue } = req.body;

  if (action === 'opened') {
    // 调用 AI 分析
    const analysis = await analyzeIssue(issue.title, issue.body);

    // 添加标签
    await addLabels(issue.number, [
      analysis.type,
      `priority:${analysis.priority}`
    ]);
  }

  res.status(200).send('OK');
});
```

---

## 特殊标签

### 状态标签

| 标签 | 说明 | 使用场景 |
|------|------|---------|
| `needs-triage` | 待分类 | 新创建的 Issue |
| `needs-reproduction` | 需要复现 | Bug 报告缺少复现步骤 |
| `needs-info` | 需要信息 | 描述不清晰 |
| `duplicate` | 重复 | 与已有 Issue 重复 |
| `wontfix` | 不修复 | 不计划修复 |
| `good-first-issue` | 适合新手 | 简单任务 |

### 优先级标签

| 标签 | 说明 | 响应时间 |
|------|------|---------|
| `priority:critical` | 紧急 | 立即 |
| `priority:high` | 高优 | 24小时 |
| `priority:medium` | 中等 | 1周 |
| `priority:low` | 低优 | 下个版本 |

---

## 最佳实践

### 1. 及时分类

```
✅ 好的做法
- Issue 创建后 24小时内分类
- 使用自动化工具辅助
- 定期清理待分类 Issue

❌ 差的做法
- Issue 长期未分类
- 完全依赖人工
- 忽略新 Issue
```

### 2. 准确标签

```
✅ 好的做法
- 标签准确反映 Issue 性质
- 使用多个标签组合
- 定期审查标签使用

❌ 差的做法
- 随意添加标签
- 标签过多或过少
- 标签含义模糊
```

### 3. 优先级合理

```
✅ 好的做法
- 根据影响范围评估
- 考虑用户数量
- 平衡紧急和重要

❌ 差的做法
- 所有 Issue 都标为高优
- 忽略长期影响
- 只看紧急程度
```

---

## 常见问题

### Q: AI 分类不准确怎么办？

1. 提供更多上下文信息
2. 调整提示词模板
3. 人工复核 AI 结果
4. 持续优化模型

### Q: 如何处理模糊的 Issue？

```bash
# 添加需要信息标签
gh issue edit 123 --add-label "needs-info"

# 添加评论请求更多信息
gh issue comment 123 --body "请提供更多详细信息：\n- 复现步骤\n- 环境信息\n- 错误日志"
```

### Q: 如何处理重复 Issue？

```bash
# 标记为重复
gh issue edit 123 --add-label "duplicate"

# 添加评论指向原始 Issue
gh issue comment 123 --body "Duplicate of #100"

# 关闭重复 Issue
gh issue close 123
```

---

## 相关文档

- [PR 创建工作流](./pr-creation.md)
- [Bug Fix 工作流](./bugfix-flow.md)
- [Feature 工作流](./feature-flow.md)
