# CodeY

> 🤖 AI Agent 工具 - 类似 Codex/Claude Code 的桌面和 Web 应用

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Rust](https://img.shields.io/badge/Rust-2024-orange.svg)](https://www.rust-lang.org/)
[![React](https://img.shields.io/badge/React-19.x-61DAFB.svg)](https://reactjs.org/)
[![Tauri](https://img.shields.io/badge/Tauri-2.x-FFC131.svg)](https://tauri.app/)

## 📖 项目简介

CodeY 是一个 AI Agent 工具，旨在提供类似 OpenAI Codex CLI 和 Anthropic Claude Code 的编程辅助能力。与传统的 CLI 工具不同，CodeY 提供了现代化的 Web 和桌面界面，让用户可以通过图形化的方式与 AI Agent 交互。

### ✨ 核心特性

- 🖥️ **跨平台支持** - Desktop (macOS/Windows/Linux) + Web
- 🤖 **智能 Agent** - 基于 LLM 的代码生成、文件操作、Shell 执行
- 🔒 **安全沙箱** - OS 级沙箱保护，防止意外操作
- 🎨 **现代 UI** - IDE 风格布局，流畅动画
- 🔌 **可扩展** - MCP 协议支持，轻松添加自定义工具
- 📝 **规范驱动** - SDD 工作流，确保代码质量

### 🎯 目标用户

- 开发者 - 日常编程辅助
- 团队 - 代码审查、自动化测试
- 企业 - 内部开发工具

## 🏗️ 技术架构

### 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                    CodeY 整体架构                            │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                 客户端层 (Client Layer)              │    │
│  │  ┌─────────────┐  ┌─────────────┐                  │    │
│  │  │   Desktop   │  │     Web     │                  │    │
│  │  │   (Tauri)   │  │  (Browser)  │                  │    │
│  │  └──────┬──────┘  └──────┬──────┘                  │    │
│  └─────────┼────────────────┼─────────────────────────┘    │
│            │ IPC            │ WS                            │
│  ┌─────────▼────────────────▼─────────────────────────┐    │
│  │              传输层 (Transport Layer)                │    │
│  │  ┌─────────────┐  ┌─────────────┐                  │    │
│  │  │ Tauri IPC   │  │  WebSocket  │                  │    │
│  │  │ Transport   │  │  Transport  │                  │    │
│  │  └──────┬──────┘  └──────┬──────┘                  │    │
│  └─────────┼────────────────┼─────────────────────────┘    │
│            │                │                              │
│  ┌─────────▼────────────────▼─────────────────────────┐    │
│  │              协议层 (Protocol Layer)                 │    │
│  │  ┌─────────────────────────────────────────────┐    │    │
│  │  │         Agent Protocol (JSON-RPC 2.0)       │    │    │
│  │  └─────────────────────────────────────────────┘    │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              核心层 (Core Layer)                     │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │    │
│  │  │ Agent Loop  │  │    Tool     │  │ Permission  │ │    │
│  │  │             │  │ Orchestrator│  │   Engine    │ │    │
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

### 技术栈

| 层 | 技术 | 说明 |
|---|------|------|
| 前端 | React 19 + TypeScript 5 + Vite 7 | 现代 Web 技术栈 |
| UI | Tailwind CSS 4 + Framer Motion 11 | 样式和动画 |
| 状态管理 | Zustand 5 | 轻量级状态管理 |
| Desktop | Tauri 2 | 跨平台桌面应用 |
| 后端 | Rust + Axum | 高性能 Web 服务器 |
| 协议 | JSON-RPC 2.0 | 统一通信协议 |
| 测试 | Vitest + Testing Library + Playwright | 完整测试金字塔 |

### Rust Crate 结构

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

## 🚀 快速开始

### 环境要求

- **Node.js**: >= 18.0.0
- **Rust**: >= 1.75.0
- **pnpm**: >= 8.0.0

### 安装

```bash
# 克隆仓库
git clone https://github.com/your-username/CodeY.git
cd CodeY

# 安装前端依赖
pnpm install

# 构建 Rust 后端
cargo build
```

### 开发

```bash
# 启动 Desktop 开发服务器
pnpm tauri dev

# 启动 Web 开发服务器
pnpm dev

# 运行测试
pnpm test

# 运行 E2E 测试
pnpm test:e2e
```

### 构建

```bash
# 构建 Desktop 应用
pnpm tauri build

# 构建 Web 应用
pnpm build
```

## 📁 项目结构

```
CodeY/
├── docs/                          # 文档目录
│   ├── 2026-07-05/               # 按日期组织
│   │   ├── design-decisions.md   # 设计决策
│   │   ├── architecture.md       # 架构设计
│   │   └── protocol-design.md    # 协议设计
│   ├── specs/                    # 规范文档
│   └── guides/                   # 使用指南
├── crates/                       # Rust crates
│   ├── codey-core/              # 核心逻辑
│   ├── codey-tauri/             # Desktop 应用
│   └── codey-server/            # Web 服务器
├── src/                          # React 前端
│   ├── components/              # 组件
│   ├── hooks/                   # Hooks
│   ├── stores/                  # 状态管理
│   └── lib/                     # 工具库
├── tests/                        # 测试目录
│   ├── frontend/                # 前端测试
│   └── backend/                 # 后端测试
├── CLAUDE.md                     # Claude Code 配置
└── README.md                     # 项目说明
```

## 🧪 测试

### 测试策略

- **单元测试**: Vitest + Testing Library (前端) / cargo test (后端)
- **组件测试**: Testing Library
- **E2E 测试**: Playwright
- **覆盖率目标**: 80%+

### 运行测试

```bash
# 前端单元测试
pnpm test:unit

# 前端组件测试
pnpm test:component

# 前端 E2E 测试
pnpm test:e2e

# 后端测试
cargo test

# 覆盖率报告
pnpm test:coverage
```

## 📚 文档

- [架构设计](docs/2026-07-05/architecture.md)
- [协议设计](docs/2026-07-05/protocol-design.md)
- [权限模型](docs/2026-07-05/permission-model.md)
- [开发工作流](docs/2026-07-05/development-workflow.md)

## 🤝 贡献

欢迎贡献！请阅读 [贡献指南](CONTRIBUTING.md) 了解详情。

### 开发流程

1. Fork 仓库
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'feat: add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

### 代码规范

- 前端: ESLint + Prettier
- 后端: rustfmt + clippy
- 测试: 每个功能必须有对应测试

## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

## 🙏 致谢

- [OpenAI Codex CLI](https://github.com/openai/codex) - 架构参考
- [Anthropic Claude Code](https://docs.anthropic.com/claude-code) - 功能参考
- [Tauri](https://tauri.app/) - 跨平台框架
- [React](https://reactjs.org/) - UI 框架
- [Rust](https://www.rust-lang.org/) - 后端语言

## 📞 联系方式

- Issues: [GitHub Issues](https://github.com/your-username/CodeY/issues)
- Discussions: [GitHub Discussions](https://github.com/your-username/CodeY/discussions)

---

**Made with ❤️ by CodeY Team**
