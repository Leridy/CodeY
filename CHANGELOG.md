# 更新日志

本项目遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/) 格式，并遵循 [语义化版本](https://semver.org/lang/zh-CN/) 规范。

---

## [未发布]

### 新增
- 前端 UI 搭建（进行中）

---

## [0.1.0] - 2026-07-05

### 新增

#### 核心架构
- JSON-RPC 2.0 通信协议实现
- Agent Loop 核心引擎
- Tauri IPC 传输层
- WebSocket 传输层
- 权限校验引擎

#### Rust 后端
- `codey-core` 核心逻辑库
- `codey-tauri` Tauri Desktop 应用
- `codey-server` Axum Web 服务器
- 文件操作工具
- Shell 执行工具
- 协议定义和错误处理

#### 前端
- React 19 + TypeScript 5 + Vite 7 技术栈
- Tailwind CSS 4 + Framer Motion 11 设计系统
- Zustand 5 状态管理
- 基础组件结构

#### 开发工具
- Claude Code Skills 系统（7 个 Skill）
- 代码质量工具配置（ESLint, Prettier, clippy, rustfmt）
- CI/CD 配置（GitHub Actions）
- 测试框架（Vitest, Playwright, cargo test）

#### 文档
- 架构设计文档
- 设计决策记录（ADR）
- 协议设计文档
- 权限模型文档
- README.md 项目说明
- CONTRIBUTING.md 贡献指南

### 变更
- 无

### 弃用
- 无

### 移除
- 无

### 修复
- 编译警告修复
- target/ 目录从版本控制中移除

---

## 版本说明

### 版本号规则

- **主版本号 (MAJOR)**: 不兼容的 API 变更
- **次版本号 (MINOR)**: 向后兼容的功能性新增
- **修订号 (PATCH)**: 向后兼容的问题修正

### 变更类型

- **新增 (Added)**: 新功能
- **变更 (Changed)**: 对现有功能的变更
- **弃用 (Deprecated)**: 即将移除的功能
- **移除 (Removed)**: 已移除的功能
- **修复 (Fixed)**: Bug 修复
- **安全 (Security)**: 安全相关的变更

---

## 链接

- [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)
- [语义化版本](https://semver.org/lang/zh-CN/)
- [GitHub Releases](https://github.com/Leridy/CodeY/releases)
