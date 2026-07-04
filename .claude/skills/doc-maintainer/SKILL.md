---
name: doc-maintainer
description: 在创建新文档、更新现有文档、检查文档冲突或生成文档目录结构时使用此 skill。确保所有文档遵循统一的目录结构、命名规范和版本管理流程。触发关键词："文档"、"doc"、"CHANGELOG"、"版本"、"创建文档"、"更新文档"、"博客"。
---

# 文档维护 Skill

维护 CodeY 项目的文档一致性、版本管理和规范执行。

## 何时激活

- 创建新文档时（自动添加日期目录和规范头部）
- 更新现有文档时（自动递增版本号和更新 CHANGELOG）
- 检查文档冲突或过期内容时
- 生成文档目录结构或变更日志时

## 文档规范

**目录结构**：
```
docs/
├── YYYY-MM-DD/          # 按日期组织
├── specs/               # 规范文档
├── guides/              # 使用指南
└── CHANGELOG.md         # 变更日志
```

**文件命名**：
- 小写字母，连字符分隔
- 示例：`design-decisions.md`、`api-spec.md`

**文档头部**：
```markdown
# 文档标题

> 日期：YYYY-MM-DD
> 阶段：[需求收集|架构设计|实现|测试|发布]
> 版本：vX.Y.Z
> 作者：[作者名]
```

## 版本管理

| 变更类型 | 版本递增 | 示例 |
|----------|----------|------|
| 新增章节 | MINOR | v1.0.0 → v1.1.0 |
| 重大修改 | MINOR | v1.1.0 → v1.2.0 |
| 结构重组 | MAJOR | v1.2.0 → v2.0.0 |
| 修正错误 | PATCH | v1.0.0 → v1.0.1 |

## 核心功能

- `doc-create` - 创建文档
- `doc-update` - 更新文档
- `doc-check-conflicts` - 检查冲突
- `doc-generate-tree` - 生成目录结构
- `doc-generate-changelog` - 生成变更日志

## 博客写作

博客文章使用 `[Blog]` 前缀，遵循图文并茂、减少代码的原则。详见 `guides/blog-writing.md`。

## 集成

- 与 `codey-brainstorming` 集成：Spec 文档规范化
- 与 `codey-dev-workflow` 集成：开发流程中的文档管理

## 内置资源

- `guides/` - 写作指南
- `examples/` - 使用示例
- `templates/` - 文档模板

完整文档见 `README.md`。
