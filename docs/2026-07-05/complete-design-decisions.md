# CodeY 完整设计决策记录

> 日期：2026-07-05
> 阶段：需求收集与架构设计
> 版本：v1.0.0

---

## 1. 项目概述

**CodeY** 是一款 AI Agent 工具，定位为类似 Codex / Claude Code 的开发者辅助工具。它将提供完整的文件操作、Shell 执行、Git 集成、子 Agent 调度、MCP 协议支持和 Web 搜索等能力，面向 Desktop 和 Web 双平台。

### 1.1 项目基本信息

| 属性 | 值 |
|------|------|
| 项目名称 | CodeY |
| 项目类型 | AI Agent 工具（类似 Codex / Claude Code） |
| 目标平台 | Desktop (Tauri) + Web |
| 后端架构 | Rust-only (Tauri + Axum) |
| 前端技术 | React + TypeScript + Framer Motion |
| 仓库可见性 | 公开（GitHub Open Source） |

---

## 2. 设计决策详情

### 2.1 目标平台

**决策：Desktop + Web 双平台**

| 方案 | 优点 | 缺点 |
|------|------|------|
| 仅 Desktop | 完整系统访问能力，性能好 | 安装门槛高，无法即时使用 |
| 仅 Web | 零安装，便捷访问 | 受限于浏览器沙箱，系统能力有限 |
| **Desktop + Web（选定）** | Desktop 提供完整系统访问，Web 提供便捷访问 | 需要维护两套传输层 |

**Q：为什么不做移动端？**
A：移动端在当前阶段不优先考虑，AI Agent 的核心交互（大量代码编辑、Terminal 操作）在小屏设备上体验不佳。移动端列为后续待开发功能。

**Q：Desktop 和 Web 的代码复用率如何？**
A：通过统一协议架构，核心 Agent 逻辑 100% 复用，仅传输层（Tauri IPC vs WebSocket/HTTP）和部分 UI 适配有差异。

---

### 2.2 后端架构

**决策：Rust-only 后端**

| 方案 | 优点 | 缺点 |
|------|------|------|
| Node.js 后端 | 生态丰富，开发快 | 性能一般，运行时开销大 |
| Python 后端 | AI/ML 生态强 | 性能差，类型安全弱 |
| **Rust-only（选定）** | 单一语言，性能最佳，类型安全 | 学习曲线陡峭，编译时间长 |
| Rust + Node.js 混合 | 优势互补 | 两套运行时，复杂度高 |

**Q：为什么选择 Rust-only 而不是混合方案？**
A：单一语言降低维护成本，Rust 的性能和类型安全性适合构建可靠的 Agent 系统。Tauri (Desktop) 和 Axum (Web) 同属 Rust 生态，核心逻辑无需跨语言桥接。

**Q：Tauri 和 Axum 的分工是什么？**
A：
- **Tauri**：Desktop 应用框架，负责窗口管理、系统托盘、本地 IPC 通信
- **Axum**：Web 服务端框架，负责 HTTP/WebSocket API、认证、会话管理
- **共享核心**：Agent 引擎、LLM 集成、工具执行等核心逻辑由两者共享

---

### 2.3 LLM 提供商集成

**决策：AI SDK 抽象层**

| 方案 | 优点 | 缺点 |
|------|------|------|
| 直接对接单一 API | 实现简单 | 锁定厂商，切换成本高 |
| 每个提供商独立实现 | 各自优化 | 代码重复，维护成本高 |
| **AI SDK 抽象层（选定）** | 统一接口，支持多提供商切换 | 需要设计良好的抽象层 |

**Q：支持哪些 LLM 提供商？**
A：初期支持 OpenAI、Anthropic、Google Gemini，通过抽象层可扩展至任何兼容 OpenAI API 格式的服务（如 Ollama、Azure OpenAI 等）。

**Q：抽象层的设计思路是什么？**
A：
- 统一的 `LLMProvider` trait，定义 `chat()`、`stream()`、`embed()` 等方法
- 每个提供商实现该 trait
- 支持 Provider 配置切换（API Key、Base URL、Model 等）
- 流式响应统一封装为 `Stream<ChatChunk>`

---

### 2.4 Agent 核心能力

**决策：全能力 Agent**

Agent 核心能力包括：

| 能力 | 说明 | 优先级 |
|------|------|--------|
| 文件操作 | 读取、创建、修改、删除文件 | P0 |
| Shell 执行 | 执行系统命令，获取输出 | P0 |
| Git 集成 | commit、branch、diff、merge 等 | P0 |
| 子 Agent 调度 | 启动和管理子 Agent 执行子任务 | P1 |
| MCP 协议支持 | Model Context Protocol 集成 | P1 |
| Web 搜索 | 搜索引擎集成，获取实时信息 | P2 |

**Q：为什么需要沙箱功能？**
A：Agent 执行 Shell 命令和文件操作存在安全风险。沙箱模式限制 Agent 的操作范围，防止误操作破坏系统。分为两级：
- **受限沙箱**：仅允许在指定工作目录内操作
- **完全沙箱**：通过容器或虚拟化技术完全隔离

**Q：工作目录如何指定？**
A：用户在启动会话时指定工作目录（Project Root），Agent 所有文件操作和 Shell 命令默认在此目录下执行。支持通过配置文件 `.codey.yaml` 设置默认工作目录。

**Q：哪些操作需要权限确认？**
A：敏感操作需要用户确认后才能执行：
- 删除文件（`rm`、`rmdir`）
- Git push（推送到远程）
- 系统级命令（`sudo`、包管理器安装）
- 网络请求到非白名单地址
- 修改系统配置文件

---

### 2.5 权限模型

**决策：细粒度权限（7+ 级）+ 规则引擎**

权限级别定义：

| 级别 | 名称 | 说明 | 示例 |
|------|------|------|------|
| 0 | ReadOnly | 只读访问 | 读取文件、查看 Git 状态 |
| 1 | FileRead | 文件读取 | 查看源代码文件 |
| 2 | FileWrite | 文件写入 | 创建/修改源代码文件 |
| 3 | ShellRead | Shell 只读命令 | `ls`、`cat`、`git status` |
| 4 | ShellWrite | Shell 写入命令 | `npm install`、`cargo build` |
| 5 | Network | 网络访问 | API 调用、Web 搜索 |
| 6 | FullAccess | 完全访问 | 所有操作 |

**Q：规则引擎的作用是什么？**
A：规则引擎允许用户自定义权限策略，例如：
- 自动允许特定目录下的所有文件操作
- 自动允许特定 Git 命令（如 `git status`、`git diff`）
- 对特定工具组合需要二次确认
- 基于时间的临时权限提升

规则文件存放位置：`.codey/rules/*.rules`，支持通配符和正则表达式匹配。

**Q：权限是全局的还是按会话的？**
A：权限分三层配置：
1. **全局默认**：适用于所有项目的默认权限级别
2. **项目级**：`.codey.yaml` 中的项目特定权限配置
3. **会话级**：运行时临时提升或降低的权限

---

### 2.6 UI 风格

**决策：IDE 风格布局**

布局设计：
```
+------------------------------------------------------+
|  Menu Bar (File, Edit, View, Tools, Help)            |
+------------------------------------------------------+
| Sidebar    |  Main Area                | Right Panel  |
| - Files    |  Chat / Terminal          | - Context    |
| - Git      |  Code Editor              | - Files      |
| - Tools    |                           | - History    |
| - Settings |                           |              |
+------------------------------------------------------+
|  Status Bar                                          |
+------------------------------------------------------+
```

面板说明：
- **左侧 Sidebar**：文件树 + 会话列表
- **中间 Main Area**：聊天/编辑器（可切换）
- **右侧 Right Panel**：详情面板（工具调用、文件预览）
- **底部**：终端/输出面板

**Q：为什么选择 IDE 风格而不是聊天风格？**
A：CodeY 是面向重度开发场景的工具，IDE 风格更适合：
- 同时查看代码和 AI 对话
- 多面板协作（文件树、编辑器、终端、对话）
- 键盘快捷键操作
- 符合开发者使用习惯

**Q：是否支持纯聊天模式？**
A：支持。用户可以关闭侧边栏和右侧面板，切换到纯聊天视图。布局支持完全自定义。

---

### 2.7 动画风格

**决策：流畅现代动画（Framer Motion）**

动画规范：
- **过渡时间**：150ms-300ms（快速响应感）
- **缓动函数**：`ease-out` 为主，强调进入感
- **状态指示**：Agent 思考中使用脉冲动画，执行中使用进度条
- **页面切换**：滑入/淡出过渡
- **面板调整**：弹性动画（spring physics）
- **打字机效果**：流式文本渲染
- **工具调用卡片**：展开/收起动画

**Q：动画是否影响性能？**
A：Framer Motion 基于硬件加速的 CSS transforms 和 opacity，性能影响极小。对于复杂列表（如文件树），使用虚拟化滚动避免性能问题。

**Q：是否可以关闭动画？**
A：支持。提供 `prefers-reduced-motion` 媒体查询适配，以及手动关闭动画的设置选项。

---

### 2.8 测试策略

**决策：完整测试金字塔**

```
        /  E2E  \          <- Playwright
       /----------\
      / Integration \       <- Testing Library + cargo test
     /----------------\
    /    Unit Tests     \    <- Vitest (前端) + cargo test (后端)
   /----------------------\
```

| 层级 | 工具 | 覆盖率目标 | 说明 |
|------|------|------------|------|
| 单元测试 | Vitest + cargo test | 80%+ | 函数、组件、模块级别 |
| 集成测试 | Testing Library + cargo test | 关键路径 100% | API 端点、组件交互 |
| E2E 测试 | Playwright | 核心用户流程 | 完整用户操作流程 |

**前端测试详情**：
- **单元测试**：Vitest + Testing Library
- **组件测试**：Testing Library + jsdom
- **E2E 测试**：Playwright

**后端测试详情**：
- **单元测试**：cargo test
- **集成测试**：cargo test + 临时目录
- **端到端测试**：实际进程执行

**Q：为什么选择 Vitest 而不是 Jest？**
A：
- Vitest 原生支持 ESM，无需复杂的 transform 配置
- 与 Vite 共享配置，一致的模块解析
- 更快的测试执行速度（基于 Vite 的 HMR）
- 兼容 Jest API，迁移成本低

**Q：后端测试有什么特殊考虑？**
A：
- 使用 `#[tokio::test]` 进行异步测试
- 使用 `mockall` crate 进行 trait mocking
- 集成测试使用临时目录隔离文件操作
- LLM API 调用使用 snapshot testing（录制-回放模式）

---

### 2.9 Harness 工作流

**决策：自定义混合 Harness**

Harness 设计目标：
- **统一协议**：所有工具通过统一的 Tool Protocol 通信
- **分层权限**：每层工具调用经过权限检查
- **双模式沙箱**：受限模式和完全隔离模式

Harness 流程：
```
用户输入 -> LLM 推理 -> Tool Call -> 权限检查 -> 沙箱执行 -> 结果返回 -> LLM 总结
```

**统一协议层**：
- JSON-RPC 2.0 协议
- Desktop 用 Tauri IPC 传输
- Web 用 WebSocket 传输

**分层权限**：
- 细粒度权限 (7+ 级)
- 规则引擎（用户可定义）

**双模式沙箱**：
- Desktop：OS 级沙箱（macOS Seatbelt / Linux bubblewrap）
- Web：浏览器沙箱 + 服务端限制

**Q：Harness 和 Claude Code 的 Harness 有什么区别？**
A：CodeY 的 Harness 更灵活：
- 支持自定义工具注册（通过 MCP 和 Plugin）
- 权限模型更细粒度（7+ 级 vs Claude Code 的 3 级）
- 支持双模式沙箱
- 工具执行可被中断和回滚

**Q：如何处理长时间运行的工具？**
A：
- 支持流式输出（实时显示 Shell 命令输出）
- 支持超时设置（默认 5 分钟，可配置）
- 支持手动中断（用户可随时取消执行）
- 支持后台执行（长时间任务不阻塞对话）

---

### 2.10 架构方案

**决策：统一协议架构（方案 C）**

核心理念：协议统一，传输层可插拔

架构分层：
```
+--------------------------------------------------+
|                 Frontend (React)                  |
+--------------------------------------------------+
|              Transport Layer (IPC / WS)           |
+--------------------------------------------------+
|           Unified Tool Protocol (Rust)            |
+--------------------------------------------------+
|    Agent Engine  |  Tool Registry  |  LLM Layer   |
+--------------------------------------------------+
|    Sandbox  |  File System  |  Shell  |  Git      |
+--------------------------------------------------+
```

核心设计原则：
1. **协议统一**：所有工具通过统一的 `Tool Protocol` 通信
2. **传输层可插拔**：Tauri IPC（Desktop）和 WebSocket（Web）可互换
3. **核心逻辑 100% 复用**：Agent 引擎、工具注册、LLM 集成在 Desktop 和 Web 之间完全共享

**优势**：
- 协议统一，Desktop 和 Web 使用相同的 agent 协议
- 核心逻辑 100% 复用
- 易于扩展新的传输方式（CLI、IDE 插件）
- 符合 Codex App Server 的设计理念

**Q：统一协议的具体形式是什么？**
A：采用 JSON-RPC 风格的协议：
```rust
struct ToolRequest {
    tool: String,           // 工具名称
    params: Value,          // 工具参数
    request_id: String,     // 请求 ID
    session_id: String,     // 会话 ID
    permission_level: u8,   // 所需权限级别
}

struct ToolResponse {
    request_id: String,     // 对应请求 ID
    success: bool,          // 是否成功
    result: Value,          // 结果数据
    error: Option<String>,  // 错误信息
    metadata: Value,        // 元数据（执行时间等）
}
```

**Q：如何确保协议的向后兼容性？**
A：
- 协议使用版本号（`protocol_version` 字段）
- 新增字段使用 `Option<T>`，旧版本客户端可忽略
- 提供协议迁移工具
- 严格的 semver 版本管理

---

### 2.11 Spec 落档原则

**决策：目录结构 + 多文件**

```
docs/specs/
├── 2026-07-05-agent-engine/
│   ├── design.md          # 设计文档
│   ├── api.md             # API 规范
│   ├── test.md            # 测试计划
│   └── progress.md        # 进度跟踪
├── 2026-07-05-tool-protocol/
│   ├── design.md
│   ├── api.md
│   ├── test.md
│   └── progress.md
└── 2026-07-10-permission-system/
    ├── ...
```

文件说明：
- **design.md**：架构设计、数据流、决策理由
- **api.md**：接口定义、数据结构、错误码
- **test.md**：测试用例、覆盖率要求、E2E 场景
- **progress.md**：任务分解、完成状态、阻塞项

**Q：为什么按日期组织而不是按功能？**
A：日期前缀确保时间顺序，便于追踪设计演变。功能名称作为后缀，保持可读性。同一功能的迭代设计会创建新的日期目录。

---

### 2.12 进度管理

**决策：强制更新进度**

进度更新规则：
1. **任务完成后立即更新** `progress.md`
2. **每个 commit 必须反映当前进度**
3. **阻塞项必须及时记录**
4. **每日结束前更新当日进度**

进度文件格式：
```markdown
# 进度跟踪

## 当前状态：开发中

## 已完成
- [x] 2026-07-05: 完成核心数据结构定义
- [x] 2026-07-05: 完成 Tool Protocol 设计

## 进行中
- [ ] 2026-07-06: 实现 Agent Engine 基础框架

## 阻塞项
- 无

## 下一步
- 实现 LLM Provider 抽象层
- 设计权限检查中间件
```

**Q：进度管理是否自动化？**
A：部分自动化：
- CI/CD 自动更新测试覆盖率
- GitHub Actions 自动标记过期任务
- 主要进度仍由开发者手动更新，确保准确性

---

### 2.13 代码提交规范

**决策：原子化提交**

提交规范：
- 每个小功能一个 commit
- 确保每个 commit 都是可编译、可测试的状态
- 不允许中间状态的 commit（如"WIP: half implemented"）

提交消息格式：
```
<type>: <description>

<optional body>

<optional footer>
```

类型说明：
| 类型 | 说明 | 示例 |
|------|------|------|
| `feat` | 新功能 | `feat: add file read tool` |
| `fix` | 修复 bug | `fix: handle empty file content` |
| `refactor` | 重构 | `refactor: extract tool registry` |
| `docs` | 文档 | `docs: add API specification` |
| `test` | 测试 | `test: add unit tests for sandbox` |
| `chore` | 杂项 | `chore: update dependencies` |
| `perf` | 性能 | `perf: optimize file watcher` |
| `ci` | CI/CD | `ci: add release workflow` |

**Q：如何保证每个 commit 都可用？**
A：
- 提交前运行完整的测试套件
- 使用 pre-commit hook 自动检查
- CI/CD 对每个 commit 运行测试
- 代码审查确保质量

---

### 2.14 错误处理策略

**决策：自动修复 + 报告**

错误处理分层：
```
错误发生
    |
    v
自动修复尝试（可修复的错误）
    |
    v（无法自动修复）
错误报告（结构化错误信息）
    |
    v
用户提示（友好错误消息 + 修复建议）
```

错误分类：
| 类型 | 处理方式 | 示例 |
|------|----------|------|
| 可自动修复 | 自动重试/修复后继续 | 网络超时重试、文件路径修正 |
| 需要用户输入 | 暂停并提示用户 | 权限不足、文件不存在 |
| 不可恢复 | 终止并报告 | LLM 服务不可用、磁盘空间不足 |

**Q：自动修复的范围是什么？**
A：
- **网络错误**：自动重试（指数退避，最多 3 次）
- **路径错误**：尝试修正路径（如大小写、分隔符）
- **格式错误**：自动修正 JSON/YAML 格式问题
- **超时错误**：增加超时时间后重试
- **权限错误**：提示用户并等待确认

**Q：错误报告包含哪些信息？**
A：
- 错误类型和错误码
- 发生时间和上下文（工具名称、参数）
- 堆栈跟踪（开发模式）
- 用户友好的错误消息
- 建议的修复步骤
- 相关文档链接

---

### 2.15 上下文管理策略

**决策：混合方案**

上下文管理策略：
| 场景 | 策略 | 说明 |
|------|------|------|
| 短任务 | 每次读取 | 简单任务直接读取最新上下文 |
| 长任务 | 缓存 | 多轮对话中缓存已读取的上下文 |
| 跨会话 | 持久化 | 关键上下文持久化到数据库 |

上下文层级：
```
+------------------+
| System Prompt    |  <- 固定上下文（角色、规则）
+------------------+
| Project Context  |  <- 项目级上下文（配置、结构）
+------------------+
| Session Context  |  <- 会话级上下文（对话历史）
+------------------+
| File Context     |  <- 文件级上下文（当前操作的文件）
+------------------+
| Tool Context     |  <- 工具级上下文（工具执行结果）
+------------------+
```

**Q：如何管理 LLM 的上下文窗口限制？**
A：
- **智能截断**：优先保留最近的对话和关键上下文
- **摘要压缩**：对历史对话生成摘要，减少 token 占用
- **按需加载**：仅在需要时加载文件内容到上下文
- **分页策略**：长文件分页读取，避免一次性加载

**Q：跨会话上下文如何持久化？**
A：
- 使用 SQLite 持久化关键上下文（项目结构、常用文件路径）
- 用户偏好和设置持久化到配置文件
- 对话历史可选择性导出/导入
- 支持上下文快照（保存和恢复特定上下文状态）

---

### 2.16 头脑风暴流程

**决策：问答式 + 方案选择式混合**

流程设计：
```
1. 需求澄清（问答式）
   - 理解用户的核心需求
   - 明确约束条件和优先级

2. 方案生成（Agent 主导）
   - 基于需求生成 2-3 个方案
   - 每个方案包含优缺点分析

3. 方案选择（用户决策）
   - 用户选择或修改方案
   - 确认最终方案

4. 细节完善（协作式）
   - 补充技术细节
   - 生成设计文档
```

**Q：为什么不完全由用户主导或完全由 Agent 主导？**
A：完全用户主导效率低（用户可能不了解技术细节），完全 Agent 主导可能偏离需求。混合模式结合两者优势：
- 用户把控方向和优先级
- Agent 提供专业建议和方案
- 最终决策权在用户

---

### 2.17 GitHub 仓库

**决策：公开仓库**

| 属性 | 选择 | 理由 |
|------|------|------|
| 可见性 | 公开（Public） | 开源项目，社区可以参与贡献 |
| License | 待定（建议 MIT 或 Apache 2.0） | 宽松许可，鼓励社区使用 |
| 分支策略 | Git Flow（main + develop + feature/*） | 适合持续开发 |
| PR 策略 | 需要 Code Review + CI 通过 | 确保代码质量 |

**Q：为什么选择公开仓库？**
A：
- 吸引社区贡献
- 提高项目可见性和影响力
- 接受社区反馈和建议
- 利用开源生态的工具和服务

---

## 3. Skill 列表

以下 Skill 已创建或正在创建，用于标准化开发流程：

| # | Skill | 用途 | 状态 |
|---|-------|------|------|
| 1 | `doc-maintainer` | 文档维护和更新 | 已创建 |
| 2 | `protocol-maintainer` | 协议文档维护 | 已创建 |
| 3 | `codey-frontend-style` | 前端风格规范和组件指南 | 已创建 |
| 4 | `codey-testing-standards` | 测试标准和最佳实践 | 已创建 |
| 5 | `codey-dev-workflow` | 开发工作流（Git、CI/CD） | 已创建 |
| 6 | `codey-code-standards` | 代码规范（Rust + TypeScript） | 已创建 |
| 7 | `codey-brainstorming` | 头脑风暴流程指导 | 已创建 |

---

## 4. 待开发功能

以下功能在当前阶段不优先开发，列为后续迭代目标：

### 4.1 Memory 功能
- **优先级**：P2
- **说明**：长期记忆系统，记录用户偏好、项目知识、历史决策
- **技术方案**：向量数据库 + 知识图谱
- **预期时间**：v0.3.0

### 4.2 CLI 支持
- **优先级**：P2
- **说明**：命令行界面，支持在终端中使用 CodeY
- **技术方案**：基于 `clap` crate 的 Rust CLI
- **预期时间**：v0.4.0

### 4.3 移动端支持
- **优先级**：P3
- **说明**：iOS/Android 移动端应用
- **技术方案**：Tauri Mobile 或 React Native
- **预期时间**：v1.0.0+

---

## 5. 技术栈总结

### 5.1 前端

| 技术 | 用途 | 版本 |
|------|------|------|
| React | UI 框架 | 18.x |
| TypeScript | 类型安全 | 5.x |
| Framer Motion | 动画库 | 11.x |
| Vite | 构建工具 | 5.x |
| Vitest | 单元测试 | 1.x |
| Testing Library | 组件测试 | 14.x |
| Playwright | E2E 测试 | 1.x |
| Tailwind CSS | 样式方案 | 3.x |
| Monaco Editor | 代码编辑器 | 最新 |

### 5.2 后端

| 技术 | 用途 | 版本 |
|------|------|------|
| Rust | 主语言 | 1.75+ |
| Tauri | Desktop 框架 | 2.x |
| Axum | Web 框架 | 0.7.x |
| Tokio | 异步运行时 | 1.x |
| Serde | 序列化 | 1.x |
| SQLx | 数据库 | 0.7.x |
| tracing | 日志 | 0.1.x |
| cargo test | 单元测试 | - |
| mockall | Mock 框架 | 0.12.x |

### 5.3 基础设施

| 技术 | 用途 |
|------|------|
| GitHub | 代码托管 |
| GitHub Actions | CI/CD |
| Docker | 容器化（可选） |
| SQLite | 本地数据库 |
| Redis | 缓存（可选） |

---

## 6. 风险与缓解

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| Rust 学习曲线 | 开发速度慢 | 预留充足学习时间，使用成熟 crate |
| Tauri 生态不成熟 | 可能遇到框架限制 | 关注社区动态，准备降级方案 |
| LLM API 变动 | 接口不兼容 | 抽象层隔离变化，多 Provider 支持 |
| 性能瓶颈 | 用户体验差 | 早期性能测试，优化关键路径 |
| 安全漏洞 | 数据泄露 | 安全审查，沙箱隔离，最小权限原则 |

---

## 7. 里程碑规划

| 里程碑 | 目标 | 预期时间 |
|--------|------|----------|
| v0.1.0 | 核心框架搭建 | 2026-07-31 |
| v0.2.0 | 基础 Agent 功能 | 2026-08-31 |
| v0.3.0 | 权限系统 + 沙箱 | 2026-09-30 |
| v0.4.0 | MCP 支持 + CLI | 2026-10-31 |
| v0.5.0 | Memory 功能 | 2026-11-30 |
| v1.0.0 | 正式发布 | 2026-12-31 |

---

## 8. 附录

### 8.1 术语表

| 术语 | 说明 |
|------|------|
| Agent | AI 驱动的自主执行实体，能调用工具完成任务 |
| Tool | Agent 可调用的功能单元（如文件读取、Shell 执行） |
| Harness | Agent 的运行时环境，管理工具调用和权限 |
| MCP | Model Context Protocol，工具和资源的标准化协议 |
| Sandbox | 限制 Agent 操作范围的安全隔离环境 |
| Sub-agent | 由主 Agent 启动的子任务执行 Agent |

### 8.2 参考资料

- [Tauri 官方文档](https://tauri.app/)
- [Axum 官方文档](https://docs.rs/axum)
- [Framer Motion 文档](https://www.framer.com/motion/)
- [MCP 协议规范](https://modelcontextprotocol.io/)
- [Vitest 文档](https://vitest.dev/)
- [Playwright 文档](https://playwright.dev/)

---

*文档生成时间：2026-07-05*
