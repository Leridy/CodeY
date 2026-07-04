# CodeY 设计决策记录

> 日期：2026-07-05
> 阶段：需求收集与架构设计

## 决策汇总

| # | 问题 | 决策 | 理由 |
|---|------|------|------|
| 1 | 目标平台 | Desktop + Web | Desktop 提供完整系统访问，Web 提供便捷访问 |
| 2 | 后端架构 | Rust-only | Tauri (Desktop) + Axum (Web)，单一语言，性能最佳 |
| 3 | LLM 提供商 | AI SDK 抽象层 | 统一接口，支持多提供商切换 |
| 4 | Agent 核心能力 | 文件操作 + Shell + Git + Sub-agent + MCP + Web 搜索 | 全部核心能力 |
| 5 | 权限模型 | 细粒度权限 (7+ 级) + 规则引擎 | 灵活且安全 |
| 6 | UI 风格 | IDE 风格布局 | 适合重度开发使用 |
| 7 | 动画风格 | 流畅现代动画 (Framer Motion) | 提升用户体验 |
| 8 | 测试策略 | 完整测试金字塔 | Vitest + Testing Library + Playwright + cargo test |
| 9 | Harness 工作流 | 自定义混合 harness | 统一协议 + 分层权限 + 双模式沙箱 |
| 10 | 架构方案 | 方案 C：统一协议架构 | 协议统一，传输层可插拔，核心逻辑 100% 复用 |

## 详细说明

### 1. 目标平台：Desktop + Web

- **Desktop (Tauri)**：完整系统访问，文件系统、Shell 执行、Git 操作
- **Web (Browser)**：浏览器沙箱限制，通过 Axum 服务器提供后端能力
- 未来可扩展 CLI 和 IDE 插件

### 2. 后端架构：Rust-only

- **Desktop**：Tauri 内置 Rust 后端，通过 IPC 与前端通信
- **Web**：Axum HTTP/WebSocket 服务器，提供相同的后端能力
- 共享 `codey-core` crate，确保逻辑一致性

### 3. LLM 提供商：AI SDK 抽象层

- 使用 Vercel AI SDK 或类似的抽象层
- 支持 OpenAI、Anthropic、Google Gemini、本地模型 (Ollama)
- 用户可配置提供商和模型

### 4. Agent 核心能力

- **文件操作**：读取、写入、编辑、搜索、目录遍历
- **Shell 执行**：命令执行、超时控制、后台运行、输出流式传输
- **Git 集成**：commit、branch、diff、status、PR 创建
- **Sub-agent**：子 agent 生成、并行执行、任务编排
- **MCP 扩展**：Model Context Protocol 支持，添加自定义工具
- **Web 搜索**：URL 抓取、文档查询

**重要约束**：
- 文件操作和 Shell 执行需要沙箱功能
- 指定工作目录，避免 agent 错误操作无关文件
- 敏感操作需要申请权限

### 5. 权限模型：细粒度 + 规则引擎

**细粒度权限 (7+ 级别)**：
1. `ReadOnly` - 只读访问
2. `FileRead` - 文件读取
3. `FileWrite` - 文件写入
4. `ShellRead` - Shell 只读命令
5. `ShellWrite` - Shell 写入命令
6. `Network` - 网络访问
7. `FullAccess` - 完全访问

**规则引擎**：
- 用户定义规则文件 `.codey/rules/*.rules`
- 命令匹配规则决定是否需要批准
- 支持通配符和正则表达式

### 6. UI 风格：IDE 风格布局

- 左侧：文件树 + 会话列表
- 中间：聊天/编辑器（可切换）
- 右侧：详情面板（工具调用、文件预览）
- 底部：终端/输出面板

### 7. 动画风格：流畅现代动画

- 使用 Framer Motion
- 打字机效果（流式文本渲染）
- 工具调用卡片展开/收起动画
- 面板切换过渡动画
- 加载状态动画

### 8. 测试策略：完整测试金字塔

**前端测试**：
- **单元测试**：Vitest + Testing Library
- **组件测试**：Testing Library + jsdom
- **E2E 测试**：Playwright

**后端测试**：
- **单元测试**：cargo test
- **集成测试**：cargo test + 临时目录
- **端到端测试**：实际进程执行

### 9. Harness 工作流：自定义混合

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

### 10. 架构方案：统一协议架构

**核心理念**：协议统一，传输层可插拔

**优势**：
- 协议统一，Desktop 和 Web 使用相同的 agent 协议
- 核心逻辑 100% 复用
- 易于扩展新的传输方式（CLI、IDE 插件）
- 符合 Codex App Server 的设计理念

---

## 待确认事项

- [ ] 具体的 LLM 提供商优先级
- [ ] 规则引擎的具体 DSL 语法
- [ ] IDE 布局的具体面板配置
- [ ] 动画的具体参数和时长
- [ ] 测试覆盖率目标（建议 80%+）

---

*文档生成时间：2026-07-05*
