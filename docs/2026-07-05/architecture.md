# CodeY 架构设计文档

> 日期：2026-07-05
> 阶段：架构设计
> 版本：v1.0.0

## 整体架构

### 5 层架构

```
┌─────────────────────────────────────────────────────────────┐
│                    CodeY 整体架构                            │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                 客户端层 (Client Layer)              │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │    │
│  │  │   Desktop   │  │     Web     │  │    CLI      │ │    │
│  │  │   (Tauri)   │  │  (Browser)  │  │  (Future)   │ │    │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘ │    │
│  └─────────┼────────────────┼────────────────┼─────────┘    │
│            │ IPC            │ WS            │ stdio         │
│  ┌─────────▼────────────────▼────────────────▼─────────┐    │
│  │              传输层 (Transport Layer)                │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │    │
│  │  │ Tauri IPC   │  │  WebSocket  │  │    Stdio    │ │    │
│  │  │ Transport   │  │  Transport  │  │  Transport  │ │    │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘ │    │
│  └─────────┼────────────────┼────────────────┼─────────┘    │
│            │                │                │              │
│  ┌─────────▼────────────────▼────────────────▼─────────┐    │
│  │              协议层 (Protocol Layer)                 │    │
│  │  ┌─────────────────────────────────────────────┐    │    │
│  │  │         Agent Protocol (JSON-RPC 2.0)       │    │    │
│  │  │  - Request/Response                         │    │    │
│  │  │  - Server Push (Notifications)              │    │    │
│  │  │  - Streaming (SSE/WebSocket)                │    │    │
│  │  └─────────────────────────────────────────────┘    │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              核心层 (Core Layer)                     │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │    │
│  │  │ Agent Loop  │  │    Tool     │  │ Permission  │ │    │
│  │  │             │  │ Orchestrator│  │   Engine    │ │    │
│  │  └─────────────┘  └─────────────┘  └─────────────┘ │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │    │
│  │  │  Context    │  │    LLM      │  │   Sandbox   │ │    │
│  │  │  Manager    │  │  Provider   │  │   Manager   │ │    │
│  │  └─────────────┘  └─────────────┘  └─────────────┘ │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              工具层 (Tool Layer)                     │    │
│  │  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ │    │
│  │  │File │ │Shell│ │ Git │ │ MCP │ │ Web │ │Agent│ │    │
│  │  │ Ops │ │ Exec│ │ Ops │ │ Ext │ │Search│ │Spawn│ │    │
│  │  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### 各层职责

| 层 | 职责 | 技术选型 |
|---|------|---------|
| 客户端层 | 用户界面、交互 | React + TypeScript + Framer Motion |
| 传输层 | 进程间通信 | Tauri IPC / WebSocket / Stdio |
| 协议层 | 消息格式、序列化 | JSON-RPC 2.0 |
| 核心层 | Agent 逻辑、权限、LLM | Rust (codey-core) |
| 工具层 | 具体操作执行 | Rust (codey-core) |

---

## Rust Crate 结构

### Workspace 布局

```
codey/
├── Cargo.toml                    # Workspace 根配置
├── crates/
│   ├── codey-core/              # 核心逻辑库
│   ├── codey-tauri/             # Tauri Desktop 应用
│   └── codey-server/            # Axum Web 服务器
├── src/                         # React 前端
└── tests/                       # 测试目录
```

### Crate 依赖关系

```
┌─────────────────┐    ┌─────────────────┐
│   codey-tauri   │    │  codey-server   │
│   (Desktop)     │    │    (Web)        │
└────────┬────────┘    └────────┬────────┘
         │                      │
         └──────────┬───────────┘
                    │
              ┌─────▼─────┐
              │ codey-core │
              │  (核心库)  │
              └───────────┘
```

### codey-core 模块结构

```
codey-core/
├── Cargo.toml
└── src/
    ├── lib.rs                   # 库入口
    ├── agent/                   # Agent 核心循环
    │   ├── mod.rs
    │   ├── loop.rs              # Agent 主循环
    │   └── context.rs           # 上下文管理
    ├── tools/                   # 工具系统
    │   ├── mod.rs
    │   ├── registry.rs          # 工具注册表
    │   ├── orchestrator.rs      # 工具编排器
    │   ├── file_ops.rs          # 文件操作工具
    │   ├── shell.rs             # Shell 执行工具
    │   ├── git.rs               # Git 操作工具
    │   ├── web.rs               # Web 搜索工具
    │   └── mcp.rs               # MCP 扩展工具
    ├── permission/              # 权限系统
    │   ├── mod.rs
    │   ├── engine.rs            # 权限引擎
    │   ├── rules.rs             # 规则引擎
    │   └── sandbox.rs           # 沙箱管理
    ├── llm/                     # LLM 集成
    │   ├── mod.rs
    │   ├── provider.rs          # 提供商抽象
    │   ├── openai.rs            # OpenAI 实现
    │   ├── anthropic.rs         # Anthropic 实现
    │   └── ollama.rs            # Ollama 本地模型
    └── protocol/                # 协议定义
        ├── mod.rs
        ├── jsonrpc.rs           # JSON-RPC 2.0
        ├── types.rs             # 类型定义
        └── events.rs            # 事件定义
```

### Crate 职责说明

| Crate | 职责 | 依赖 |
|-------|------|------|
| `codey-core` | Agent 核心逻辑、工具系统、权限引擎、LLM 集成 | 无外部 GUI 依赖 |
| `codey-tauri` | Tauri Desktop 应用，IPC 命令处理 | `codey-core` |
| `codey-server` | Axum Web 服务器，WebSocket 处理 | `codey-core` |

**设计原则**：
- `codey-core` 不依赖任何 GUI 框架，可在任何 Rust 环境运行
- `codey-tauri` 和 `codey-server` 是薄壳，仅负责传输层适配
- 所有业务逻辑都在 `codey-core` 中实现

---

## 前端结构

### React 组件布局

```
src/
├── App.tsx                      # 应用入口
├── components/
│   ├── layout/                  # 布局组件
│   │   ├── IDELayout.tsx        # IDE 主布局
│   │   ├── Sidebar.tsx          # 侧边栏
│   │   ├── EditorPanel.tsx      # 编辑器面板
│   │   └── TerminalPanel.tsx    # 终端面板
│   ├── chat/                    # 聊天组件
│   │   ├── ChatWindow.tsx       # 聊天窗口
│   │   ├── MessageList.tsx      # 消息列表
│   │   ├── MessageBubble.tsx    # 消息气泡
│   │   └── StreamingText.tsx    # 流式文本
│   ├── tools/                   # 工具展示组件
│   │   ├── ToolCard.tsx         # 工具调用卡片
│   │   ├── BashTool.tsx         # Shell 执行展示
│   │   ├── EditTool.tsx         # 文件编辑展示
│   │   └── GitTool.tsx          # Git 操作展示
│   └── common/                  # 通用组件
│       ├── AnimatedPanel.tsx    # 动画面板
│       └── LoadingState.tsx     # 加载状态
├── hooks/                       # React Hooks
│   ├── useAgent.ts              # Agent 交互 hook
│   ├── useIPC.ts                # IPC 通信 hook
│   └── useWebSocket.ts          # WebSocket hook
├── stores/                      # Zustand 状态管理
│   ├── agentStore.ts            # Agent 状态
│   ├── chatStore.ts             # 聊天状态
│   └── configStore.ts           # 配置状态
└── lib/                         # 工具库
    ├── ipc.ts                   # IPC 通信层
    ├── websocket.ts             # WebSocket 通信层
    └── protocol.ts              # 协议类型定义
```

### 前端技术栈

| 技术 | 用途 | 版本 |
|------|------|------|
| React | UI 框架 | 19.x |
| TypeScript | 类型安全 | 5.x |
| Vite | 构建工具 | 7.x |
| Tailwind CSS | 样式 | 4.x |
| Framer Motion | 动画 | 11.x |
| Zustand | 状态管理 | 5.x |
| Vitest | 单元测试 | 4.x |
| Testing Library | 组件测试 | 16.x |
| Playwright | E2E 测试 | 1.x |

---

## 测试策略

### 测试金字塔

```
        ┌─────────────────┐
        │    E2E Tests    │  ← 关键用户流程
        │   (Playwright)  │
        ├─────────────────┤
        │ Component Tests │  ← UI 组件
        │ (Testing Library)│
        ├─────────────────┤
        │   Unit Tests    │  ← 核心逻辑
        │    (Vitest)     │
        └─────────────────┘
```

### 测试覆盖率目标

- **前端**：80%+ 代码覆盖率
- **后端**：90%+ 代码覆盖率
- **E2E**：覆盖所有关键用户流程

---

## 待确认事项

- [ ] 具体的 LLM 提供商优先级
- [ ] 规则引擎的具体 DSL 语法
- [ ] IDE 布局的具体面板配置
- [ ] 动画的具体参数和时长
- [ ] 测试覆盖率目标（建议 80%+）

---

*文档生成时间：2026-07-05*
