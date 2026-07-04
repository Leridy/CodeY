# CodeY 开发工作流 - 完整文档

## 工作流总览

```
用户请求 → 头脑风暴 → Spec 创建 → 开发实现 → 测试 → 代码审查 → 验收提交
```

```
┌─────────────────────────────────────────────────────────────┐
│                    CodeY 开发工作流                          │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Phase 1: 头脑风暴 (主 Agent)                        │   │
│  │  - 需求澄清 / 问题提问 / Spec 生成                   │   │
│  └─────────────────────────────────────────────────────┘   │
│                              │                              │
│                              ▼                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Phase 2: 开发实现 (子 Agent)                        │   │
│  │  - 读取 Spec / 实现代码 / 基础自测                   │   │
│  └─────────────────────────────────────────────────────┘   │
│                              │                              │
│                              ▼                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Phase 3: 测试编写 (独立子 Agent)                    │   │
│  │  - 编写测试用例 / 运行测试 / 报告结果                │   │
│  └─────────────────────────────────────────────────────┘   │
│                              │                              │
│                              ▼                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Phase 4: 代码审查 (独立子 Agent)                    │   │
│  │  - 代码质量 / 安全审查 / 改进建议                    │   │
│  └─────────────────────────────────────────────────────┘   │
│                              │                              │
│                              ▼                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Phase 5: 结果验收 (主 Agent)                        │   │
│  │  - 验证结果 / 原子提交 / 更新进度                    │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

各阶段详细说明参见 [workflow/](./workflow/) 目录。

---

## Agent 角色

| 角色 | 职责 | 读权限 | 写权限 |
|------|------|--------|--------|
| 主 Agent | 头脑风暴、验收、进度管理 | 全部 | progress.md, Spec 文件 |
| 开发子 Agent | 代码实现 | Spec, progress.md | 源代码 |
| 测试子 Agent | 测试编写和执行 | Spec, 源代码 | 测试代码 |
| 审查子 Agent | 代码审查 | Spec, 源代码, 测试代码 | 审查报告 |

详细职责参见 [agents/](./agents/) 目录。

---

## Spec-Driven Development

所有开发工作从 Spec 文件开始。没有 Spec，不写代码。

**目录结构**

```
docs/
└── specs/
    └── YYYY-MM-DD-<feature>/
        ├── design.md          # 设计文档：架构决策、数据模型、技术选型
        ├── api.md             # API 规范：接口定义、请求/响应格式、错误码
        └── test.md            # 测试规范：测试策略、用例清单、覆盖率目标
```

**命名规范**

- 目录名：`YYYY-MM-DD-<feature>`，如 `2026-07-05-user-auth`
- 文件名：固定为 `design.md`、`api.md`、`test.md`
- 特性名使用小写连字符：`user-auth`、`file-upload`、`agent-protocol`

**版本管理**

- Spec 文件头部必须包含版本号：`vX.Y.Z`
- 重大变更（接口不兼容、架构调整）递增 MAJOR
- 功能补充递增 MINOR
- 文档修正递增 PATCH

**Spec 头部模板**

```markdown
# <功能名称>

> 版本：v1.0.0
> 日期：YYYY-MM-DD
> 作者：<作者>
> 状态：[draft | review | approved]
```

---

## Progress Management

进度文件是唯一的任务真相来源（single source of truth）。

**进度文件路径**：`docs/progress.md`

**强制更新规则**

- 每个任务完成后必须立即更新进度文件
- 进度更新与代码提交绑定（同一 commit 或紧随其后）
- 主 Agent 负责验收和更新进度状态
- 子 Agent 只读取进度，不直接修改

**任务状态**

| 状态 | 标记 | 说明 |
|------|------|------|
| pending | `- [ ]` | 待办，未开始 |
| in_progress | `- [~]` | 进行中 |
| completed | `- [x]` | 已完成 |
| blocked | `- [!]` | 阻塞，需要人工介入 |

进度文件模板参见 [templates/progress-template.md](./templates/progress-template.md)。

---

## 提交规范

每次提交必须代表一个可工作的状态。

**提交信息格式**

```
<type>: <description>

<optional body>

Co-Authored-By: Claude <noreply@anthropic.com>
```

**类型定义**

| 类型 | 说明 | 示例 |
|------|------|------|
| feat | 新功能 | feat: add user authentication module |
| fix | Bug 修复 | fix: handle null pointer in file parser |
| refactor | 代码重构 | refactor: extract validation logic to utils |
| docs | 文档更新 | docs: add API spec for user endpoints |
| test | 测试相关 | test: add unit tests for auth service |
| chore | 构建/工具相关 | chore: update build configuration |

提交信息模板参见 [templates/commit-template.md](./templates/commit-template.md)。

---

## 文件结构总览

```
docs/
├── specs/
│   └── YYYY-MM-DD-<feature>/
│       ├── design.md          # 设计文档
│       ├── api.md             # API 规范
│       └── test.md            # 测试规范
├── progress.md                # 进度跟踪
└── CHANGELOG.md               # 变更日志
```

---

## 配置

### 环境变量

```bash
# Spec 根目录（默认：./docs/specs）
CODEY_SPEC_ROOT=./docs/specs

# 进度文件路径（默认：./docs/progress.md）
CODEY_PROGRESS_FILE=./docs/progress.md

# 提交信息自动添加 Co-Author（默认：true）
CODEY_AUTO_CO_AUTHOR=true

# 审查严重性阈值（低于此级别的问题不阻塞提交）
CODEY_REVIEW_THRESHOLD=HIGH
```

### 配置文件

在项目根目录创建 `.codey/workflow-config.json`：

```json
{
  "specRoot": "./docs/specs",
  "progressFile": "./docs/progress.md",
  "autoCoAuthor": true,
  "reviewThreshold": "HIGH",
  "commitTypes": ["feat", "fix", "refactor", "docs", "test", "chore"],
  "phases": ["brainstorm", "develop", "test", "review", "validate"],
  "agents": {
    "main": { "role": "orchestrator", "permissions": ["read-all", "write-progress", "write-spec"] },
    "dev": { "role": "developer", "permissions": ["read-spec", "read-progress", "write-code"] },
    "test": { "role": "tester", "permissions": ["read-spec", "read-code", "write-tests"] },
    "review": { "role": "reviewer", "permissions": ["read-spec", "read-code", "read-tests", "write-report"] }
  }
}
```

---

## 最佳实践

1. **Spec 先行**：没有 Spec 不写代码，Spec 是沟通的契约
2. **进度透明**：每次状态变更都更新 progress.md
3. **原子提交**：每次提交都是可工作的最小单元
4. **独立审查**：审查 Agent 独立于开发 Agent，确保客观性
5. **测试优先**：测试覆盖率 >= 80%，关键路径 100%
6. **中文交流**：技术术语使用英文，说明和注释使用中文
7. **不可变模式**：创建新对象，不修改现有对象
8. **小文件原则**：每个文件 < 800 行，每个函数 < 50 行

---

*Skill 版本：v1.0.0*
*创建日期：2026-07-05*
