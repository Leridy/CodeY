# Phase 2.5 集成实现设计文档

> 日期：2026-07-05
> 版本：v1.0.0
> 状态：Phase 2.5 - 工具执行 + 流式集成 + Anthropic Tool Use + 沙箱集成

## 1. 概述

Phase 2.5 将 Phase 2.4 中搭建的 Agent Loop 骨架与实际工具执行、流式响应、Anthropic Tool Use 和沙箱安全机制进行集成，使 Agent 真正具备文件操作和 Shell 命令执行能力。

### 1.1 设计目标

| 目标 | 说明 |
|------|------|
| 工具执行器 | 实现 FileExecutor 和 ShellExecutor，注册到 ToolOrchestrator |
| 流式集成 | AgentLoop::process_message() 支持流式/非流式双模式 |
| Anthropic Tool Use | AnthropicProvider 完整支持 tool_use content block |
| 沙箱集成 | 工具执行层面集成 PathValidator 路径校验 |
| 重命名 | permission::sandbox::SandboxManager 重命名为 PathValidator |

### 1.2 头脑风暴决策

| 问题 | 决策 | 说明 |
|------|------|------|
| 工具优先级 | A+B: 文件+Shell | 同时实现 FileExecutor 和 ShellExecutor |
| 流式响应 | A: 立即集成 | 在本次 Phase 中直接集成到 AgentLoop |
| Anthropic | A: 实现 Tool Use | AnthropicProvider 完整支持 tool_use |
| 沙箱集成 | A: 工具执行层面 | PathValidator 在 Executor 层面拦截 |
| SandboxManager 命名 | A: 重命名为 PathValidator | permission::sandbox::SandboxManager -> PathValidator |

---

## 2. 架构变更

### 2.1 变更总览

| 变更类型 | 文件路径 | 说明 |
|----------|----------|------|
| 重构 | `permission/sandbox.rs` | SandboxManager -> PathValidator |
| 重构 | `permission/mod.rs` | 更新 re-export |
| 新增 | `tools/file_executor.rs` | FileExecutor 实现 |
| 新增 | `tools/shell_executor.rs` | ShellExecutor 实现 |
| 修改 | `tools/mod.rs` | 注册新模块 |
| 修改 | `tools/orchestrator.rs` | 集成 PathValidator |
| 修改 | `agent/loop.rs` | 流式集成 |
| 修改 | `llm/anthropic.rs` | Tool Use 支持 |

### 2.2 依赖关系图

```
AgentLoop
  |
  +-- LlmProvider (AnthropicProvider / OpenAI / Ollama)
  |     |
  |     +-- ToolUseAdapter (Anthropic Tool Use 格式转换)
  |
  +-- ToolOrchestrator
  |     |
  |     +-- FileExecutor
  |     |     +-- PathValidator (路径校验)
  |     |
  |     +-- ShellExecutor
  |           +-- PathValidator (工作目录校验)
  |
  +-- StreamManager (流式响应管理)
  |
  +-- PermissionEngine (权限校验)
```

---

## 3. 模块详细设计

### 3.1 PathValidator（重命名）

将 `permission::sandbox::SandboxManager` 重命名为 `PathValidator`，职责更加清晰：路径级别的访问控制校验。

**变更范围**:
- `permission/sandbox.rs`: 结构体和 impl 块重命名
- `permission/mod.rs`: `pub use sandbox::PathValidator;`
- 所有引用 `permission::SandboxManager` 的测试文件

### 3.2 FileExecutor

实现文件读写工具执行器，集成 PathValidator 进行路径校验。

**核心方法**:
- `read(path)` - 读取文件内容
- `write(path, content)` - 写入文件内容

### 3.3 ShellExecutor

实现 Shell 命令执行器，复用 ShellHandler 的执行逻辑并集成 PathValidator。

**核心方法**:
- `execute(command)` - 执行 Shell 命令

### 3.4 Anthropic Tool Use 支持

修改 `AnthropicProvider` 支持 Tool Use，使 Anthropic 模型能够返回 `tool_use` content block。

**关键变更**:
- 请求格式: 添加 `tools` 字段
- 响应解析: 支持 `tool_use` content block
- `supports_function_calling()` 返回 `true`

### 3.5 流式响应集成

修改 `AgentLoop::process_message()` 支持流式/非流式双模式。

**关键变更**:
- 当 `config.enable_streaming` 为 true 时，使用 `stream_chat()`
- 通过 `StreamManager` 发送 chunks

---

## 4. 实现顺序

```
Phase 2.5.1: PathValidator 重命名
  |
  v
Phase 2.5.2: FileExecutor 实现
  |
  v
Phase 2.5.3: ShellExecutor 实现
  |
  v
Phase 2.5.4: ToolOrchestrator 沙箱集成
  |
  v
Phase 2.5.5: Anthropic Tool Use 实现
  |
  v
Phase 2.5.6: 流式响应集成
```

---

## 5. 成功标准

- [ ] `permission::sandbox::SandboxManager` 已重命名为 `PathValidator`
- [ ] `FileExecutor` 可读写文件，路径经过 PathValidator 校验
- [ ] `ShellExecutor` 可执行 Shell 命令，危险命令被拦截
- [ ] `ToolOrchestrator::execute()` 集成路径校验
- [ ] `AnthropicProvider::chat()` 正确解析 tool_use content block
- [ ] `AnthropicProvider::supports_function_calling()` 返回 true
- [ ] `AgentLoop::process_message()` 支持流式/非流式双模式
- [ ] 所有现有测试继续通过
- [ ] 新增测试覆盖所有新功能

---

*文档版本: v1.0.0*
*最后更新: 2026-07-05*
