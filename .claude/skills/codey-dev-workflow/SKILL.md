---
name: codey-dev-workflow
description: 在启动新功能开发、协调多 Agent 任务、遵循 Spec-Driven Development 流程或追踪项目进度时使用此 skill。触发关键词："开发"、"实现"、"workflow"、"工作流"、"spec"、"进度"、"提交"、"原子提交"、"Agent"。
---

# 开发工作流 Skill

标准化的多 Agent 协作开发工作流，从头脑风暴到代码提交。

## 何时激活

- 启动新功能开发时
- 多 Agent 环境下需要协调开发任务时
- 需要规范化 Spec-Driven Development 流程时
- 追踪项目进度、规范化提交和版本管理时

## 核心流程

```
用户请求 → 头脑风暴 → Spec 创建 → 开发实现 → 测试 → 代码审查 → 验收提交
```

## Agent 角色

| 角色 | 职责 | 读权限 | 写权限 |
|------|------|--------|--------|
| 主 Agent | 头脑风暴、验收、进度管理 | 全部 | progress.md, Spec 文件 |
| 开发子 Agent | 代码实现 | Spec, progress.md | 源代码 |
| 测试子 Agent | 测试编写和执行 | Spec, 源代码 | 测试代码 |
| 审查子 Agent | 代码审查 | Spec, 源代码, 测试代码 | 审查报告 |

## Spec-Driven Development

**规则**：没有 Spec，不写代码。

**目录结构**：
```
docs/specs/YYYY-MM-DD-<feature>/
├── design.md      # 架构设计
├── api.md         # API 规范
└── test.md        # 测试规范
```

## 进度管理

**文件**：`docs/progress.md`

**状态标记**：
- `- [ ]` pending - 待办
- `- [~]` in_progress - 进行中
- `- [x]` completed - 已完成
- `- [!]` blocked - 阻塞

**规则**：任务完成后立即更新进度文件。

## 提交规范

```
<type>: <description>

<optional body>
```

**类型**：feat, fix, refactor, docs, test, chore

## 阶段详情

详见 `workflow/` 目录：
- `brainstorm-phase.md` - 头脑风暴阶段
- `develop-phase.md` - 开发实现阶段
- `test-phase.md` - 测试验证阶段
- `review-phase.md` - 代码审查阶段
- `validate-phase.md` - 验收提交阶段

## 集成

- **输入**：来自 `codey-brainstorming` 的需求
- **规范**：遵循 `codey-code-standards`
- **测试**：遵循 `codey-testing-standards`
- **文档**：使用 `doc-maintainer`

## 内置资源

- `workflow/` - 阶段工作流
- `agents/` - Agent 角色定义
- `templates/` - 进度和提交模板

完整文档见 `README.md`。
