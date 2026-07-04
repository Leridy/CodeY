```
 ██████╗ ██████╗ ██████╗ ███████╗██╗   ██╗
██╔════╝██╔═══██╗██╔══██╗██╔════╝╚██╗ ██╔╝
██║     ██║   ██║██║  ██║█████╗   ╚████╔╝
██║     ██║   ██║██║  ██║██╔══╝    ╚██╔╝
╚██████╗╚██████╔╝██████╔╝███████╗   ██║
 ╚═════╝ ╚═════╝ ╚═════╝ ╚══════╝   ╚═╝
```

<h1 align="center">CodeY</h1>

<p align="center">
  <strong>AI Agent 工具 — 类似 Codex/Claude Code 的桌面和 Web 应用</strong>
</p>

<p align="center">
  <a href="https://github.com/Leridy/CodeY/actions"><img src="https://img.shields.io/github/actions/workflow/status/Leridy/CodeY/ci.yml?branch=master&logo=github&label=Build" alt="Build Status"></a>
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT"></a>
  <a href="https://github.com/Leridy/CodeY/releases"><img src="https://img.shields.io/badge/Version-0.1.0-blue.svg" alt="Version"></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.x-3178C6.svg?logo=typescript" alt="TypeScript"></a>
  <a href="https://www.rust-lang.org/"><img src="https://img.shields.io/badge/Rust-2024-DEA584.svg?logo=rust" alt="Rust Edition 2024"></a>
  <a href="https://reactjs.org/"><img src="https://img.shields.io/badge/React-19.x-61DAFB.svg?logo=react" alt="React"></a>
  <a href="https://tauri.app/"><img src="https://img.shields.io/badge/Tauri-2.x-FFC131.svg?logo=tauri" alt="Tauri"></a>
</p>

---

## 目录

- [项目简介](#项目简介)
- [核心特性](#核心特性)
- [技术架构](#技术架构)
- [快速开始](#快速开始)
- [平台安装指南](#平台安装指南)
- [开发指南](#开发指南)
- [测试](#测试)
- [部署](#部署)
- [项目结构](#项目结构)
- [文档](#文档)
- [贡献](#贡献)
- [路线图](#路线图)
- [许可证](#许可证)
- [致谢](#致谢)
- [联系方式](#联系方式)

---

## 项目简介

CodeY 是一个 AI Agent 工具，旨在提供类似 OpenAI Codex CLI 和 Anthropic Claude Code 的编程辅助能力。与传统的 CLI 工具不同，CodeY 提供了现代化的 Web 和桌面界面，让用户可以通过图形化的方式与 AI Agent 交互。

### 目标用户

| 用户类型 | 使用场景 |
|---------|---------|
| **独立开发者** | 日常编程辅助、代码生成、Bug 修复 |
| **开发团队** | 代码审查、自动化测试、协作开发 |
| **企业用户** | 内部开发工具、流程自动化、知识沉淀 |

---

## 核心特性

### 跨平台桌面应用

基于 Tauri 2 构建，一套代码同时支持 macOS、Windows、Linux 三大平台。使用系统原生 WebView，打包体积小，启动速度快。

### 智能 Agent 引擎

内置 Agent Loop 核心循环，支持多轮对话、上下文记忆、工具调用链。通过 JSON-RPC 2.0 协议统一通信，确保客户端与后端的解耦。

### 安全沙箱

操作系统级别的沙箱保护机制，对文件操作、Shell 执行等危险行为进行权限校验和拦截，防止意外的破坏性操作。

### 现代化 UI

采用 IDE 风格布局设计，支持代码高亮、终端模拟、文件树浏览等核心交互。使用 Framer Motion 实现流畅的过渡动画。

### MCP 协议扩展

支持 Model Context Protocol，可接入自定义工具和服务。通过插件化架构扩展 Agent 能力，无需修改核心代码。

### 规范驱动开发 (SDD)

内置 SDD 工作流支持，从需求分析、架构设计到代码实现全流程规范化，确保输出代码的质量和一致性。

---

## 技术架构

### 系统总览

```
┌───────────────────────────────────────────────────────────────────┐
│                          CodeY 系统架构                           │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │                    客户端层 (Client Layer)                   │  │
│  │                                                             │  │
│  │   ┌─────────────────┐          ┌─────────────────┐         │  │
│  │   │   Desktop App   │          │    Web App      │         │  │
│  │   │  (Tauri + React)│          │  (React + Vite) │         │  │
│  │   └────────┬────────┘          └────────┬────────┘         │  │
│  └────────────┼────────────────────────────┼──────────────────┘  │
│               │ IPC                        │ WebSocket            │
│  ┌────────────▼────────────────────────────▼──────────────────┐  │
│  │                    传输层 (Transport Layer)                  │  │
│  │   ┌─────────────────┐          ┌─────────────────┐         │  │
│  │   │  Tauri IPC      │          │   WebSocket     │         │  │
│  │   │  Transport      │          │   Transport     │         │  │
│  │   └────────┬────────┘          └────────┬────────┘         │  │
│  └────────────┼────────────────────────────┼──────────────────┘  │
│               │                            │                      │
│  ┌────────────▼────────────────────────────▼──────────────────┐  │
│  │                    协议层 (Protocol Layer)                   │  │
│  │         ┌──────────────────────────────────────┐           │  │
│  │         │     Agent Protocol (JSON-RPC 2.0)    │           │  │
│  │         └──────────────────────────────────────┘           │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │                     核心层 (Core Layer)                      │  │
│  │                                                             │  │
│  │   ┌────────────┐   ┌────────────┐   ┌────────────┐        │  │
│  │   │ Agent Loop │   │   Tool     │   │ Permission │        │  │
│  │   │  (LLM 驱动)│   │Orchestrator│   │   Engine   │        │  │
│  │   └────────────┘   └────────────┘   └────────────┘        │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │                     工具层 (Tool Layer)                      │  │
│  │                                                             │  │
│  │   ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐  │  │
│  │   │ File │ │Shell │ │ Git  │ │ MCP  │ │ Web  │ │Agent │  │  │
│  │   │ Ops  │ │ Exec │ │ Ops  │ │ Ext  │ │Search│ │Spawn │  │  │
│  │   └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘  │  │
│  └─────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────┘
```

### 数据流

```
┌──────────┐     User Input      ┌──────────┐
│   用户    │ ──────────────────▶ │  Client  │
│  (浏览器  │                     │  (React) │
│  /桌面)   │ ◀────────────────── │          │
└──────────┘     UI Render        └────┬─────┘
                                       │ JSON-RPC 2.0
                                       ▼
                                 ┌──────────┐
                                 │  Server  │
                                 │  (Axum)  │
                                 └────┬─────┘
                                      │
                          ┌───────────┼───────────┐
                          ▼           ▼           ▼
                    ┌──────────┐ ┌──────────┐ ┌──────────┐
                    │  LLM API │ │  Tools   │ │ Sandbox  │
                    │(OpenAI / │ │(File/Shell│ │(Permission│
                    │Anthropic)│ │ /Git/MCP)│ │  Check)  │
                    └──────────┘ └──────────┘ └──────────┘
```

### Rust Crate 依赖关系

```
┌──────────────┐     ┌──────────────┐
│ codey-tauri  │────▶│              │
│  (Desktop)   │     │  codey-core  │
└──────────────┘     │   (核心库)    │
                     │              │
┌──────────────┐     │  - agent     │
│ codey-server │────▶│  - llm       │
│   (Web API)  │     │  - tools     │
└──────────────┘     │  - permission│
                     │  - protocol  │
                     └──────────────┘
```

### 技术栈

| 层 | 技术 | 说明 |
|---|------|------|
| **前端** | React 19 + TypeScript 5 + Vite 7 | 现代 Web 技术栈 |
| **UI** | Tailwind CSS 4 + Framer Motion 11 | 样式系统和动画引擎 |
| **状态管理** | Zustand 5 | 轻量级、类型安全的状态管理 |
| **Desktop** | Tauri 2 | 跨平台桌面应用框架，IPC 通信 |
| **后端** | Rust + Axum | 高性能异步 Web 服务器 |
| **LLM 集成** | async-openai / async-anthropic | OpenAI 和 Anthropic SDK |
| **协议** | JSON-RPC 2.0 | 统一通信协议 |
| **测试** | Vitest + Testing Library + Playwright | 完整测试金字塔 |

---

## 快速开始

### 环境要求

| 工具 | 最低版本 | 说明 |
|------|---------|------|
| **Node.js** | >= 18.0.0 | JavaScript 运行时 |
| **pnpm** | >= 8.0.0 | 包管理器 |
| **Rust** | >= 1.75.0 | 后端编译工具链 |
| **系统依赖** | — | macOS: Xcode CLI Tools; Linux: libwebkit2gtk; Windows: WebView2 |

### 一分钟上手

```bash
# 1. 克隆仓库
git clone https://github.com/Leridy/CodeY.git
cd CodeY

# 2. 安装前端依赖
pnpm install

# 3. 构建 Rust 后端
cargo build

# 4. 启动开发服务器
pnpm tauri dev    # Desktop 应用
# 或
pnpm dev          # 纯 Web 模式
```

---

## 平台安装指南

### macOS

```bash
# 安装 Xcode Command Line Tools (如尚未安装)
xcode-select --install

# 安装 Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# 安装 pnpm
npm install -g pnpm

# 克隆并构建
git clone https://github.com/Leridy/CodeY.git && cd CodeY
pnpm install && cargo build
```

### Ubuntu / Debian

```bash
# 系统依赖
sudo apt update
sudo apt install -y libwebkit2gtk-4.1-dev libappindicator3-dev \
  librsvg2-dev patchelf libssl-dev libgtk-3-dev libsoup-3.0-dev

# 安装 Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# 安装 pnpm
npm install -g pnpm

# 克隆并构建
git clone https://github.com/Leridy/CodeY.git && cd CodeY
pnpm install && cargo build
```

### Windows

```powershell
# 确保已安装 WebView2 (Windows 10/11 通常已预装)
# 下载地址: https://developer.microsoft.com/en-us/microsoft-edge/webview2/

# 安装 Rust (下载 rustup-init.exe)
# https://www.rust-lang.org/tools/install

# 安装 pnpm
npm install -g pnpm

# 克隆并构建
git clone https://github.com/Leridy/CodeY.git
cd CodeY
pnpm install
cargo build
```

---

## 开发指南

### 启动开发环境

```bash
# Desktop 模式 (Tauri + Vite 热重载)
pnpm tauri dev

# 纯 Web 模式 (仅前端)
pnpm dev

# 仅启动 Rust 后端
cargo run -p codey-server
```

### 可用脚本

| 命令 | 说明 |
|------|------|
| `pnpm dev` | 启动 Vite 开发服务器 (Web 模式) |
| `pnpm tauri dev` | 启动 Tauri Desktop 开发模式 |
| `pnpm build` | 构建前端生产包 |
| `pnpm tauri build` | 构建 Desktop 安装包 |
| `pnpm lint` | ESLint 代码检查 |
| `pnpm format` | Prettier 代码格式化 |
| `pnpm test` | 运行 Vitest 测试 |
| `pnpm test:ui` | Vitest UI 模式 |
| `pnpm test:coverage` | 生成覆盖率报告 |
| `pnpm test:e2e` | Playwright E2E 测试 |
| `cargo test` | 运行 Rust 单元测试 |
| `cargo clippy` | Rust 代码检查 |
| `cargo fmt` | Rust 代码格式化 |

### 代码规范

| 端 | 工具 | 配置 |
|----|------|------|
| 前端 | ESLint + Prettier | `eslint.config.js`, `.prettierrc` |
| 后端 | rustfmt + clippy | `rustfmt.toml`, `clippy.toml` |
| Git | Conventional Commits | `feat:`, `fix:`, `refactor:` 等前缀 |

### 环境变量

创建 `.env` 文件配置 LLM API Key:

```env
# OpenAI
OPENAI_API_KEY=sk-xxx

# Anthropic
ANTHROPIC_API_KEY=sk-ant-xxx

# Server
CODEY_SERVER_PORT=3000
CODEY_LOG_LEVEL=info
```

---

## 测试

### 测试策略

```
┌─────────────────────────────────────────────────┐
│                测试金字塔                         │
│                                                  │
│                   ▲                              │
│                  / \      E2E (Playwright)       │
│                 /   \     关键用户流程            │
│                /─────\                           │
│               /       \   组件测试               │
│              / Testing \  (Testing Library)      │
│             /  Library  \                        │
│            /─────────────\                       │
│           /               \  单元测试            │
│          /    Vitest +     \ (Vitest / cargo)    │
│         /   cargo test      \                    │
│        /─────────────────────\                   │
└─────────────────────────────────────────────────┘
```

### 运行测试

```bash
# ─── 前端测试 ───
pnpm test:unit          # 单元测试
pnpm test:component     # 组件测试
pnpm test:e2e           # E2E 测试 (Playwright)
pnpm test:coverage      # 生成覆盖率报告 (目标: 80%+)

# ─── 后端测试 ───
cargo test              # 全部 Rust 测试
cargo test -p codey-core    # 仅 core 模块
cargo test -p codey-server  # 仅 server 模块

# ─── 全量测试 ───
pnpm test && cargo test
```

### 覆盖率目标

| 模块 | 目标 | 工具 |
|------|------|------|
| 前端 | >= 80% | Vitest + c8 |
| 后端 | >= 80% | cargo-tarpaulin |
| E2E | 关键路径覆盖 | Playwright |

---

## 构建与部署

### 构建 Desktop 应用

```bash
# 构建当前平台的安装包
pnpm tauri build

# 输出目录
# macOS:   target/release/bundle/dmg/
# Windows: target/release/bundle/msi/
# Linux:   target/release/bundle/deb/ 或 .AppImage
```

### 构建 Web 应用

```bash
# 构建前端
pnpm build

# 输出到 dist/ 目录
# 可直接部署到 Nginx / Vercel / Cloudflare Pages
```

### Docker 部署 (Web 模式)

```dockerfile
FROM rust:1.75 AS builder
WORKDIR /app
COPY . .
RUN cargo build --release -p codey-server

FROM node:18-alpine AS frontend
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm i -g pnpm && pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*
COPY --from=builder /app/target/release/codey-server /usr/local/bin/
COPY --from=frontend /app/dist /app/static
EXPOSE 3000
CMD ["codey-server"]
```

---

## 项目结构

```
CodeY/
├── crates/                            # Rust 后端
│   ├── codey-core/                   # 核心逻辑库
│   │   └── src/
│   │       ├── agent/               #   Agent Loop 引擎
│   │       ├── llm/                 #   LLM API 集成
│   │       ├── tools/               #   工具注册与执行
│   │       ├── permission/          #   权限校验引擎
│   │       └── protocol/            #   JSON-RPC 协议定义
│   ├── codey-tauri/                  # Tauri Desktop 应用
│   │   └── src/
│   │       ├── commands/            #   Tauri IPC 命令
│   │       ├── main.rs              #   入口
│   │       └── state.rs             #   应用状态
│   └── codey-server/                 # Axum Web 服务器
│       └── src/
│           ├── routes/              #   HTTP/WS 路由
│           ├── state/               #   服务器状态
│           ├── main.rs              #   入口
│           └── state.rs             #   共享状态
│
├── src/                               # React 前端
│   ├── components/                   # UI 组件
│   ├── hooks/                        # 自定义 Hooks
│   ├── stores/                       # Zustand 状态管理
│   ├── lib/                          # 工具函数库
│   ├── styles/                       # 全局样式
│   ├── App.tsx                       # 根组件
│   └── main.tsx                      # 入口文件
│
├── docs/                              # 项目文档
│   ├── 2026-07-05/                   # 设计文档 (按日期)
│   │   ├── architecture.md          #   架构设计
│   │   ├── design-decisions.md      #   设计决策
│   │   ├── protocol-design.md       #   协议设计
│   │   └── permission-model.md      #   权限模型
│   └── specs/                        # 规范文档
│
├── tests/                             # 测试目录
│   ├── frontend/                     # 前端测试
│   └── backend/                      # 后端测试
│
├── Cargo.toml                         # Rust Workspace 配置
├── package.json                       # Node.js 项目配置
├── vite.config.ts                     # Vite 构建配置
├── tailwind.config.js                 # Tailwind CSS 配置
├── tsconfig.json                      # TypeScript 配置
├── CLAUDE.md                          # Claude Code 配置
└── LICENSE                            # MIT 许可证
```

---

## 文档

| 文档 | 说明 |
|------|------|
| [架构设计](docs/2026-07-05/architecture.md) | 系统整体架构、模块划分、通信机制 |
| [设计决策](docs/2026-07-05/design-decisions.md) | 关键技术选型的决策记录 (ADR) |
| [协议设计](docs/2026-07-05/protocol-design.md) | JSON-RPC 2.0 Agent 通信协议规范 |
| [权限模型](docs/2026-07-05/permission-model.md) | 安全沙箱权限控制机制 |
| [规范文档](docs/specs/) | SDD 规范文档集合 |
| [进度跟踪](docs/progress.md) | 项目开发进度记录 |

---

## 贡献

欢迎参与 CodeY 的开发！请阅读以下流程:

### 开发流程

```
Fork 仓库 ──▶ 创建分支 ──▶ 编写代码 ──▶ 运行测试 ──▶ 提交 PR
                │              │              │
                ▼              ▼              ▼
         feature/xxx      遵循代码规范    确保覆盖率 80%+
```

### 步骤

1. **Fork** 本仓库到你的 GitHub 账号
2. **Clone** 到本地: `git clone https://github.com/Leridy/CodeY.git`
3. **创建分支**: `git checkout -b feature/your-feature`
4. **编写代码** 并确保通过所有测试
5. **提交**: `git commit -m 'feat: add your feature'`
6. **推送**: `git push origin feature/your-feature`
7. **创建 Pull Request** 并填写说明

### Commit 规范

使用 [Conventional Commits](https://www.conventionalcommits.org/):

```
feat:     新功能
fix:      Bug 修复
refactor: 重构
docs:     文档更新
test:     测试相关
chore:    构建/工具链
perf:     性能优化
ci:       CI/CD 配置
```

### 代码审查

所有 PR 需要至少一位维护者审核通过。审查重点:

- 代码风格一致性
- 测试覆盖率 (>= 80%)
- 无安全漏洞
- 性能影响评估

---

## 路线图

### Phase 1 — 协议与核心 (当前)

- [x] JSON-RPC 2.0 通信协议
- [x] Agent Loop 核心引擎
- [x] Tauri IPC 传输层
- [x] 基础文件操作工具
- [x] 权限校验引擎

### Phase 2 — LLM 集成

- [ ] OpenAI GPT-4o 集成
- [ ] Anthropic Claude 集成
- [ ] 多模型切换支持
- [ ] 流式响应处理

### Phase 3 — 高级功能

- [ ] MCP 协议完整支持
- [ ] 自定义工具插件系统
- [ ] 会话持久化与历史
- [ ] 多 Agent 协作

### Phase 4 — 生产就绪

- [ ] 性能优化与压测
- [ ] 安全审计
- [ ] 自动更新机制
- [ ] 插件市场

---

## 许可证

本项目采用 [MIT 许可证](LICENSE) 开源。

```
MIT License

Copyright (c) 2026 CodeY

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software...
```

---

## 致谢

| 项目 | 说明 |
|------|------|
| [OpenAI Codex CLI](https://github.com/openai/codex) | 架构参考 |
| [Anthropic Claude Code](https://docs.anthropic.com/claude-code) | 功能参考 |
| [Tauri](https://tauri.app/) | 跨平台桌面应用框架 |
| [React](https://reactjs.org/) | UI 框架 |
| [Rust](https://www.rust-lang.org/) | 后端语言 |
| [Axum](https://github.com/tokio-rs/axum) | Web 框架 |

---

## 联系方式

| 渠道 | 链接 |
|------|------|
| Issues | [GitHub Issues](https://github.com/Leridy/CodeY/issues) |
| Discussions | [GitHub Discussions](https://github.com/Leridy/CodeY/discussions) |
| Releases | [GitHub Releases](https://github.com/Leridy/CodeY/releases) |

---

<p align="center">
  <strong>Made with care by CodeY Team</strong>
</p>
