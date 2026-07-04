# Feature 工作流

从 Issue 到功能实现的完整工作流，集成头脑风暴和标准化开发流程。

---

## 流程概览

```
Issue 分析 → 头脑风暴 → Spec 生成 → 开发实现 → 测试验证 → PR 创建 → 代码审查 → 合并关闭
```

---

## 前置条件

- Issue 已标记为 `enhancement`
- 需求描述相对清晰
- 开发环境已配置

---

## 执行步骤

### Phase 1: Issue 分析

**目标**：理解需求本质，评估实现复杂度

```bash
# 获取 Issue 详情
/github-integration view issue <number>
```

**分析要点**：

1. **需求理解**
   - 用户想要什么功能？
   - 解决什么问题？
   - 有参考实现吗？

2. **技术可行性**
   - 技术上是否可行？
   - 需要哪些依赖？
   - 有技术风险吗？

3. **实现复杂度**
   - 预计工作量
   - 涉及哪些模块
   - 是否需要重构

**输出**：

```markdown
## Issue 分析报告

**Issue**: #124 - 添加数据导出功能
**类型**: Feature
**复杂度**: Medium
**预计工作量**: 3-5天

### 需求描述
用户希望将数据导出为PDF和Excel格式。

### 技术可行性
- PDF: 使用 `printpdf` crate
- Excel: 使用 `calamine` crate
- 可行，无技术风险

### 实现范围
- 后端：新增导出API
- 前端：添加导出按钮和进度显示
- 测试：单元测试 + E2E测试
```

---

### Phase 2: 头脑风暴

**目标**：澄清需求，生成实现方案

```bash
# 调用 brainstorming skill
读取 .claude/skills/codey-brainstorming/SKILL.md
按照头脑风暴流程执行
```

**头脑风暴流程**：

1. **需求收集**
   - 澄清模糊点
   - 收集约束条件
   - 识别知识盲区

2. **研究调研**
   - 搜索类似实现
   - 查询库文档
   - 收集最佳实践

3. **方案生成**
   - 生成 2-3 个可行方案
   - 分析各方案优缺点
   - 提供推荐方案

4. **细节确认**
   - 确认技术细节
   - 确认接口设计
   - 确认测试策略

**输出**：

```markdown
## 头脑风暴记录

### 方案对比

| 维度 | 方案 A: 服务端生成 | 方案 B: 客户端生成 | 方案 C: 混合方案 |
|------|-------------------|-------------------|-----------------|
| 技术栈 | Rust + printpdf | JavaScript + jsPDF | 服务端PDF + 客户端Excel |
| 开发复杂度 | 中 | 低 | 中 |
| 性能 | 好 | 差 | 好 |
| 可扩展性 | 好 | 中 | 好 |
| 维护成本 | 中 | 低 | 中 |

### 推荐方案

**推荐方案 A**，理由：
1. 服务端生成性能更好
2. 支持大数据量
3. 格式更规范

### 技术细节

- PDF: 使用 `printpdf` crate，支持表格和图表
- Excel: 使用 `calamine` crate，支持多 Sheet
- 异步处理：使用消息队列处理大文件
```

---

### Phase 3: Spec 生成

**目标**：生成规范的 Spec 文档

```bash
# 调用 doc-maintainer skill
读取 .claude/skills/doc-maintainer/SKILL.md
按照文档规范生成 Spec
```

**Spec 文档结构**：

```
docs/specs/2026-07-05-data-export/
├── design.md          # 设计文档
├── api.md             # API 规范
└── test.md            # 测试规范
```

**design.md 模板**：

```markdown
# 数据导出功能设计

> 版本：v1.0.0
> 日期：2026-07-05
> 作者：CodeY Team
> 状态：draft

## 概述

实现数据导出功能，支持PDF和Excel格式。

## 架构设计

### 模块划分

- `export_service`: 导出服务核心
- `pdf_generator`: PDF生成器
- `excel_generator`: Excel生成器
- `queue_processor`: 队列处理器

### 数据流

1. 用户请求导出
2. 创建导出任务
3. 异步处理数据
4. 生成文件
5. 返回下载链接

## 技术选型

| 组件 | 技术 | 理由 |
|------|------|------|
| PDF生成 | printpdf | Rust原生，性能好 |
| Excel生成 | calamine | 功能完整 |
| 队列 | Redis | 可靠，支持持久化 |

## 接口设计

见 [api.md](./api.md)

## 测试策略

见 [test.md](./test.md)
```

---

### Phase 4: 开发实现

**目标**：按照 Spec 实现功能

```bash
# 创建功能分支
git checkout -b feature/124-data-export

# 调用 dev-workflow skill
读取 .claude/skills/codey-dev-workflow/SKILL.md
按照开发流程执行
```

**开发流程**：

1. **读取 Spec**
   - 理解设计文档
   - 确认接口规范
   - 了解测试要求

2. **实现代码**
   - 后端服务
   - 前端组件
   - 错误处理

3. **编写测试**
   - 单元测试
   - 集成测试
   - E2E测试

**代码组织**：

```
src/
├── services/
│   └── export/
│       ├── mod.rs
│       ├── pdf.rs
│       ├── excel.rs
│       └── queue.rs
├── routes/
│   └── export.rs
└── models/
    └── export_job.rs
```

**提交规范**：

```bash
# 功能提交
git commit -m "feat(export): 添加PDF生成功能"

# 测试提交
git commit -m "test(export): 添加导出服务单元测试"

# 修复提交
git commit -m "fix(export): 修复大文件导出超时"
```

---

### Phase 5: 测试验证

**目标**：确保功能正确且稳定

**测试类型**：

1. **单元测试**
   ```rust
   #[test]
   fn test_pdf_generation() {
       let data = create_test_data();
       let pdf = generate_pdf(&data).unwrap();
       assert!(pdf.len() > 0);
   }
   ```

2. **集成测试**
   ```bash
   # 运行完整测试套件
   cargo test

   # 运行特定模块测试
   cargo test export
   ```

3. **E2E测试**
   ```typescript
   test('用户可以导出PDF', async ({ page }) => {
     await page.goto('/data');
     await page.click('button:has-text("导出")');
     await page.click('button:has-text("PDF")');
     await expect(page.locator('.success-message')).toBeVisible();
   });
   ```

4. **性能测试**
   - 测试大数据量导出
   - 测试并发导出
   - 测试内存使用

**测试检查清单**：

- [ ] 所有单元测试通过
- [ ] 集成测试通过
- [ ] E2E测试通过
- [ ] 性能测试达标
- [ ] 代码覆盖率 >= 80%

---

### Phase 6: PR 创建

**目标**：创建清晰、可审查的 Pull Request

```bash
# 提交所有代码
git add .
git commit -m "feat(export): 实现数据导出功能 (#124)

- 支持PDF和Excel格式导出
- 异步处理大数据量
- 添加进度显示
- 完整测试覆盖

Closes #124"

# 推送分支
git push origin feature/124-data-export

# 创建 PR
/github-integration create pr \
  --title "feat(export): 实现数据导出功能 (#124)" \
  --body "添加PDF和Excel导出支持" \
  --reviewers "backend-team,frontend-team"
```

**PR 描述模板**：

```markdown
## 描述

实现数据导出功能，支持PDF和Excel格式。

## 功能特性

- PDF导出：支持表格、图表、自定义样式
- Excel导出：支持多Sheet、公式、格式化
- 异步处理：支持大数据量导出
- 进度显示：实时显示导出进度

## 技术实现

### 后端
- 使用 `printpdf` 生成PDF
- 使用 `calamine` 生成Excel
- 使用 Redis 队列处理异步任务

### 前端
- 添加导出按钮组件
- 实现进度条显示
- 错误处理和重试机制

## 测试

- [x] 单元测试：覆盖率 85%
- [x] 集成测试：所有场景覆盖
- [x] E2E测试：关键流程验证
- [x] 性能测试：大数据量通过

## 相关 Issue

Closes #124

## 截图

[导出界面截图]

## 检查清单

- [x] 代码遵循项目规范
- [x] 已运行 linter
- [x] 已运行 formatter
- [x] 无合并冲突
- [x] 文档已更新
- [x] CHANGELOG 已更新
```

---

### Phase 7: 代码审查

**目标**：确保代码质量和功能完整性

**审查要点**：

1. **功能完整性**
   - 是否实现所有需求
   - 边界条件处理
   - 错误处理

2. **代码质量**
   - 代码风格一致
   - 命名清晰
   - 注释适当

3. **测试覆盖**
   - 测试用例完整
   - 覆盖率达标
   - 测试独立

4. **性能考虑**
   - 无性能退化
   - 资源使用合理
   - 可扩展性

**响应审查**：

```bash
# 根据审查意见修改
git add .
git commit -m "feat: 根据审查意见改进导出功能"

# 推送更新
git push origin feature/124-data-export
```

---

### Phase 8: 合并关闭

**目标**：完成功能并关闭 Issue

```bash
# 审查通过后合并
/github-integration merge pr <number> --method squash --delete-branch

# 验证 Issue 已关闭
/github-integration view issue 124
```

**合并后验证**：

1. 确认 Issue 已自动关闭
2. 验证主分支测试通过
3. 部署到测试环境
4. 功能验收测试

---

## 时间估算

| 阶段 | 预计时间 | 说明 |
|------|---------|------|
| Issue 分析 | 30-60分钟 | 理解需求 |
| 头脑风暴 | 1-2小时 | 方案设计 |
| Spec 生成 | 30-60分钟 | 文档编写 |
| 开发实现 | 2-5天 | 取决于复杂度 |
| 测试验证 | 1-2天 | 包括调试 |
| PR 创建 | 30-60分钟 | 填写描述 |
| 代码审查 | 1-3天 | 取决于审查者 |
| 合并关闭 | 15-30分钟 | 最终验证 |

**总计**: 5-10天（中等复杂度功能）

---

## 常见问题

### Q: 需求不清晰怎么办？

1. 使用头脑风暴流程澄清
2. 请求更多细节
3. 创建原型验证
4. 拆分为更小的功能

### Q: 技术方案不确定怎么办？

1. 进行技术调研
2. 创建概念验证
3. 咨询团队专家
4. 选择保守方案

### Q: 开发时间不够怎么办？

1. 拆分 MVP 版本
2. 优先核心功能
3. 创建后续 Issue
4. 寻求团队帮助

### Q: 测试覆盖率不达标怎么办？

1. 补充关键路径测试
2. 添加边界条件测试
3. 使用测试生成工具
4. 创建技术债务 Issue

---

## 相关文档

- [Issue 分类工作流](./issue-triage.md)
- [Bug Fix 工作流](./bugfix-flow.md)
- [PR 创建工作流](./pr-creation.md)
- [头脑风暴 Skill](../../codey-brainstorming/SKILL.md)
- [开发工作流 Skill](../../codey-dev-workflow/SKILL.md)
