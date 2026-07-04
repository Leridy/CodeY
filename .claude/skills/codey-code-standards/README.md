# CodeY 代码规范

## 概述

本技能定义了 CodeY 项目的全栈代码规范，确保团队协作时代码风格一致、可维护性强。

## 规范分类

| 分类 | 说明 | 文档链接 |
|------|------|----------|
| **前端规范** | TypeScript、React、ESLint、Prettier | [frontend/](./frontend/) |
| **后端规范** | Rust、rustfmt、clippy | [backend/](./backend/) |
| **命名规范** | 前后端命名约定 | [naming/](./naming/) |
| **文件组织** | 项目结构和文件组织 | [file-organization/](./file-organization/) |

## 如何使用

1. **新项目初始化**：参考 `frontend/eslint.md` 和 `backend/rustfmt.md` 配置 linter 和 formatter
2. **日常开发**：查阅对应语言的规范文档
3. **代码审查**：使用命名规范和文件组织规范作为审查标准
4. **配置同步**：定期更新配置文件，保持团队一致

## 配置文件

### 前端配置文件

- `eslint.config.js` - ESLint 规则配置
- `.prettierrc` - Prettier 格式化配置
- `tsconfig.json` - TypeScript 编译选项

### 后端配置文件

- `rustfmt.toml` - rustfmt 格式化配置
- `clippy.toml` - clippy lint 规则配置
- `.cargo/config.toml` - Cargo 构建配置

## 核心原则

1. **一致性**：同一项目内保持风格统一
2. **可读性**：代码应易于理解，减少认知负担
3. **类型安全**：充分利用类型系统，减少运行时错误
4. **错误处理**：显式处理错误，不忽略潜在问题
5. **模块化**：高内聚低耦合，便于测试和维护

## 规范更新

规范文档应随技术栈演进而更新。更新时：
1. 保持向后兼容
2. 提供迁移指南
3. 通知团队成员
