# doc-maintainer

维护 CodeY 项目的文档一致性、版本管理和规范执行。确保所有文档遵循统一的目录结构、命名规范和版本管理流程。

## 何时使用

- 创建新文档时（自动添加日期目录和规范头部）
- 更新现有文档时（自动递增版本号和更新 CHANGELOG）
- 检查文档冲突或过期内容时
- 生成文档目录结构或变更日志时

## 快速开始

```
用户：创建架构设计文档

Agent：好的，我将创建架构设计文档。
       日期：2026-07-05
       阶段：架构设计
       版本：v1.0.0

       文档已创建：docs/2026-07-05/architecture.md
       CHANGELOG 已更新。

用户：更新权限模型章节

Agent：好的，我将更新 architecture.md 的权限模型章节。
       版本：v1.0.0 → v1.1.0

       文档已更新。
       CHANGELOG 已记录变更。
```

## 核心功能

| 功能 | 说明 | 示例 |
|------|------|------|
| 创建文档 | 自动添加日期目录和规范头部 | `doc-create architecture.md` |
| 更新文档 | 自动递增版本号 | `doc-update architecture.md --section "权限模型"` |
| 检查冲突 | 扫描同名文件的内容差异 | `doc-check-conflicts architecture.md` |
| 生成目录 | 生成文档目录结构 | `doc-generate-tree` |
| 生成变更日志 | 自动生成 CHANGELOG | `doc-generate-changelog` |
| 博客写作 | 创建博客文章，遵循写作指南 | 参见 [blog-writing.md](./guides/blog-writing.md) |

## 详细文档

- [README.md](./README.md) - 完整文档：规范说明、命令参考、配置选项、最佳实践
- [guides/](./guides/) - 写作指南
  - [blog-writing.md](./guides/blog-writing.md) - 博客写作指南
  - [naming-conventions.md](./guides/naming-conventions.md) - 文档命名规则
- [examples/](./examples/) - 使用示例
  - [create-doc.md](./examples/create-doc.md) - 创建文档示例
  - [update-doc.md](./examples/update-doc.md) - 更新文档示例
  - [check-conflicts.md](./examples/check-conflicts.md) - 检查冲突示例
- [templates/](./templates/) - 文档模板
  - [doc-template.md](./templates/doc-template.md) - 文档模板
  - [changelog-template.md](./templates/changelog-template.md) - 变更日志模板

## 核心原则

1. **日期组织**：所有文档按日期目录组织
2. **版本管理**：重大更新递增版本号
3. **变更记录**：每次更新都记录到 CHANGELOG
4. **冲突检查**：创建文档前检查同名文件
5. **规范头部**：所有文档都包含规范的头部信息
6. **中文交流**：技术术语使用英文，说明使用中文
7. **博客写作**：博客文章使用 `[Blog]` 前缀，遵循图文并茂、减少代码的原则

---

*Skill 版本：v1.0.0*
*创建日期：2026-07-05*
