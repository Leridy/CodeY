# CodeY - Claude Code 配置

> 本文件是 Agent 工作指南，引导读取和使用 skill，而非重复 skill 内容
> 最后更新：2026-07-05

---

# 强制交互协议

## 核心规则：每次回复结束前必须调用 `ask_user` 工具

这是不可跳过的强制协议。在你的每一轮回复中，你必须执行以下操作之一：

### 执行规则

1. **完成用户请求后** → 立即调用 `ask_user` 工具，提出与当前上下文相关的后续问题
2. **存在任何不确定性时** → 不要猜测执行，立即调用 `ask_user` 工具进行澄清

### 问题质量要求

**禁止**提出无意义问题：
- ❌ "如果有问题请继续问我"
- ❌ "还有什么需要帮助的吗？"
- ❌ "你满意吗？"

**必须**提出建设性问题：
- ✅ 存在逻辑缺陷时明确询问
- ✅ 有多个可行方案时提供选项
- ✅ 需要确认技术细节时具体提问
- ✅ 发现潜在风险时主动提示

### 问题示例

```
# 好的问题 - 提供选项
"权限模型有两种实现方式：
1. 基于角色的访问控制 (RBAC)
2. 基于属性的访问控制 (ABAC)
你倾向于哪种？"

# 好的问题 - 逻辑缺陷澄清
"我注意到 spec 中要求支持离线模式，但 LLM 调用需要网络。
是否需要实现本地模型 fallback？"

# 坏的问题 - 无意义
"还有什么问题吗？"
```

### 何时可以不调用 ask_user

仅以下情况可以跳过：
- 用户明确说"不用问了"或"直接执行"
- 用户提供了完整的、无歧义的指令
- 正在执行原子操作（如单个文件写入），操作完成后统一提问

---

## 语言规范

### 强制要求

**所有非代码产出必须使用中文**，包括但不限于：
- 文档内容
- 代码注释
- 提交信息
- 审查报告
- 进度更新
- 问题描述

**技术术语保留英文**：
- 编程语言名称（Rust, TypeScript, JavaScript）
- 框架名称（React, Tauri, Axum）
- 协议名称（JSON-RPC, WebSocket, SSE）
- 工具名称（Vitest, Playwright, ESLint）
- API 名称（agent/start, file/read, shell/execute）

**代码本身保持英文**：
- 变量名、函数名、类型名
- 代码注释（技术说明）
- 测试用例名称

### 示例

```
# ✅ 正确
// 读取文件内容
pub async fn read(&self, params: Value) -> Result<Response> {
    // 检查路径参数
    let path = params.get("path")
        .and_then(|v| v.as_str())
        .ok_or_else(|| anyhow::anyhow!("缺少 path 参数"))?;
}

# ❌ 错误
// Read file content
pub async fn read(&self, params: Value) -> Result<Response> {
    // Check path parameter
    let path = params.get("path")
        .and_then(|v| v.as_str())
        .ok_or_else(|| anyhow::anyhow!("Missing path parameter"))?;
}
```

---

## 子 Agent 管理规则

### 主 Agent 职责（禁止亲力亲为）

**主 Agent 的工作重心：**
1. **结果验收** - 验证子 agent 产出是否符合预期
2. **进度把控** - 跟踪任务完成情况，更新 progress.md
3. **任务派发** - 将具体工作分配给子 agent
4. **需求明确** - 与用户沟通，澄清需求

**禁止**主 Agent 亲自执行具体开发工作（写代码、运行命令、调试等）
**必须**派发给子 agent 执行，主 Agent 只负责验收

### 并发控制
- **最大并发数**：6 个子 agent
- 超过 6 个时，等待部分完成后再启动新的
- 避免资源竞争和上下文混乱

### 产出验证
子 agent 完成后，**必须**执行以下检查：
1. **文件存在性检查** - 验证所有预期文件是否创建
2. **内容完整性检查** - 验证文件内容是否完整（非空、格式正确）
3. **依赖一致性检查** - 验证 import/依赖是否正确

```bash
# 示例：验证子 agent 产出
echo "=== 检查文件 ===" && ls -la <expected-files>
echo "=== 检查内容 ===" && head -20 <key-files>
echo "=== 检查依赖 ===" && grep -r "use\|import" <files> | head -10
```

### 任务遗漏预防
- 记录每个子 agent 的任务清单
- 完成后逐一核对清单
- 发现遗漏立即补充

---

## 项目概述

CodeY 是 AI Agent 工具，支持 Desktop + Web 平台。
技术栈：React 19 + TypeScript + Rust + Tauri 2 + Axum + JSON-RPC 2.0

---

## 🚀 会话开始指引

**每次会话开始时，Agent 必须按以下顺序执行：**

### 第一步：完整了解工作流（强制）

在执行任何任务之前，**必须**先完整阅读本 CLAUDE.md 文件，了解：
1. 强制交互协议（每次回复结束前调用 ask_user）
2. 语言规范（非代码产出使用中文）
3. 子 Agent 管理规则（主 Agent 不亲力亲为）
4. 核心规则（Spec 优先、进度同步、原子提交）
5. Skill 目录结构和使用方式

### 第二步：读取当前开发进度

```bash
# 读取进度文件
cat docs/progress.md
```

### 第三步：确定当前任务状态

**决策逻辑：**
- 有进行中的任务 → 读取对应 spec，继续开发
- 有新的用户需求 → 启动头脑风暴流程
- 任务完成 → 更新进度，原子提交

**⚠️ 重要：禁止跳过第一步直接读取 progress.md！**

必须先了解完整的工作流规范，再恢复任务进度。这确保 agent 遵循项目的开发流程和质量标准。

---

## 📋 核心规则

### 1. Spec 优先
- 所有开发必须从 spec 开始
- Spec 位置：`docs/specs/YYYY-MM-DD-<feature>/`
- **禁止**没有 spec 直接写代码

### 2. 进度同步
- 任务完成立即更新 `docs/progress.md`
- 原子提交：`git commit -m '<type>: <description>'`

### 3. 子 Agent 分工
- **开发子 Agent**：实现代码
- **测试子 Agent**：编写测试
- **审查子 Agent**：代码审查
- **主 Agent**：验收、提交、更新进度

---

## 🎯 子 Agent 必读 Skill

**派出子 Agent 时，必须在 prompt 中指定它读取对应的 skill：**

### 前端开发子 Agent
```
必须读取：
- .claude/skills/codey-frontend-style/SKILL.md    # UI 组件规范
- .claude/skills/codey-frontend-style/design-system/  # 设计 Token
- .claude/skills/codey-code-standards/frontend/    # 前端代码规范
- .claude/skills/codey-testing-standards/frontend/ # 前端测试规范
```

### 后端开发子 Agent
```
必须读取：
- .claude/skills/codey-code-standards/backend/     # 后端代码规范
- .claude/skills/codey-testing-standards/backend/   # 后端测试规范
- .claude/skills/protocol-maintainer/SKILL.md       # 协议规范
```

### LLM 集成子 Agent
```
必须读取：
- .claude/skills/llm-provider-maintenance/SKILL.md # LLM 提供商维护
- .claude/skills/llm-provider-maintenance/providers/ # 提供商配置
- .claude/skills/llm-provider-maintenance/schema/   # 数据库 Schema
```

### 前后端通信开发子 Agent
```
必须读取：
- .claude/skills/protocol-maintainer/SKILL.md       # 协议字典
- .claude/skills/protocol-maintainer/dictionary/    # 方法定义
- .claude/skills/codey-frontend-style/hooks/        # IPC/WebSocket hooks
```

### 测试子 Agent
```
必须读取：
- .claude/skills/codey-testing-standards/SKILL.md   # 测试标准
- 对应语言的测试规范目录
```

### 头脑风暴子 Agent
```
必须读取：
- .claude/skills/codey-brainstorming/SKILL.md       # 头脑风暴流程
- .claude/skills/doc-maintainer/SKILL.md            # 文档规范
```

---

## 📁 Skill 目录结构

所有 skill 位于 `.claude/skills/`，采用目录结构：

```
.claude/skills/
├── codey-brainstorming/      # 头脑风暴流程
├── codey-code-standards/     # 代码规范（前端/后端）
├── codey-dev-workflow/       # 开发工作流
├── codey-frontend-style/     # 前端风格 + 设计系统
├── codey-testing-standards/  # 测试标准（前端/后端）
├── doc-maintainer/           # 文档维护
├── github-integration/       # GitHub 集成（Issue/PR 管理）
├── llm-provider-maintenance/ # LLM 提供商维护
└── protocol-maintainer/      # 协议维护
```

**Skill 使用方式：**
```bash
# 查看 skill 入口
cat .claude/skills/<skill-name>/SKILL.md

# 查看详细文档
cat .claude/skills/<skill-name>/README.md

# 查看具体功能
cat .claude/skills/<skill-name>/<subdir>/<file>.md
```

---

## ⚠️ 禁止事项

1. **禁止**在 CLAUDE.md 中重复 skill 内容
2. **禁止**没有 spec 直接开发
3. **禁止**跳过测试直接提交
4. **禁止**派出子 Agent 时不指定读取 skill
5. **禁止**任务完成后不更新进度

---

## 🔗 快速参考

| 场景 | 读取 Skill |
|------|-----------|
| 开始新功能 | `codey-brainstorming` + `doc-maintainer` |
| 前端开发 | `codey-frontend-style` + `codey-code-standards/frontend/` |
| 后端开发 | `codey-code-standards/backend/` + `protocol-maintainer` |
| 前后端通信 | `protocol-maintainer` + `codey-frontend-style/hooks/` |
| 编写测试 | `codey-testing-standards` |
| 代码审查 | `codey-dev-workflow/agents/review-agent.md` |
| 更新进度 | `docs/progress.md` |
| GitHub 操作 | `github-integration` |
| LLM 提供商管理 | `llm-provider-maintenance` |
