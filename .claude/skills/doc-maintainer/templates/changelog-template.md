# 变更日志

所有重要更改都将记录在此文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
并且本项目遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

---

## [未发布]

### 新增
- {{UNRELEASED_ADDED}}

### 变更
- {{UNRELEASED_CHANGED}}

### 废弃
- {{UNRELEASED_DEPRECATED}}

### 移除
- {{UNRELEASED_REMOVED}}

### 修复
- {{UNRELEASED_FIXED}}

### 安全
- {{UNRELEASED_SECURITY}}

---

## [{{VERSION}}] - {{DATE}}

### 新增
- {{VERSION_ADDED}}

### 变更
- {{VERSION_CHANGED}}

### 废弃
- {{VERSION_DEPRECATED}}

### 移除
- {{VERSION_REMOVED}}

### 修复
- {{VERSION_FIXED}}

### 安全
- {{VERSION_SECURITY}}

---

## [v1.0.0] - 2026-07-05

### 新增
- 初始版本发布
- 文档创建功能（doc-create）
- 文档更新功能（doc-update）
- 冲突检查功能（doc-check-conflicts）
- 目录生成功能（doc-generate-tree）
- 变更日志生成功能（doc-generate-changelog）
- 环境变量配置支持
- 配置文件支持（.codey/doc-config.json）
- 文档模板
- 变更日志模板

### 变更
- 无

### 废弃
- 无

### 移除
- 无

### 修复
- 无

### 安全
- 无

---

## 版本说明

### 版本格式

采用语义化版本：`vMAJOR.MINOR.PATCH`

| 变更类型 | 版本递增 | 示例 |
|----------|----------|------|
| 新增功能（向后兼容） | MINOR | v1.0.0 -> v1.1.0 |
| 重大变更（不兼容） | MAJOR | v1.1.0 -> v2.0.0 |
| 问题修复 | PATCH | v1.0.0 -> v1.0.1 |

### 变更类型

| 类型 | 说明 |
|------|------|
| 新增 | 新功能 |
| 变更 | 现有功能的变更 |
| 废弃 | 即将移除的功能 |
| 移除 | 已移除的功能 |
| 修复 | 问题修复 |
| 安全 | 安全相关变更 |

### 记录规范

1. **日期格式**：YYYY-MM-DD
2. **版本格式**：vX.Y.Z
3. **变更描述**：简洁明了，说明变更内容
4. **分类准确**：按变更类型分类记录
5. **及时更新**：每次变更都及时记录

---

## 使用方法

### 自动更新

doc-maintainer 会在创建或更新文档时自动更新此文件。

### 手动更新

```bash
# 生成完整变更日志
doc-generate-changelog

# 生成指定日期范围的变更日志
doc-generate-changelog --since 2026-07-01

# 输出到指定文件
doc-generate-changelog --output docs/RELEASE_NOTES.md
```

### 查看变更

```bash
# 查看所有变更
cat docs/CHANGELOG.md

# 查看特定版本的变更
grep -A 20 "## \[v1.2.0\]" docs/CHANGELOG.md

# 查看特定日期的变更
grep -A 20 "## 2026-07-05" docs/CHANGELOG.md
```

---

## 最佳实践

1. **及时记录**：每次变更都及时记录到 CHANGELOG
2. **分类清晰**：按变更类型分类记录
3. **描述准确**：简洁明了地描述变更内容
4. **版本一致**：确保版本号与文档版本一致
5. **日期准确**：确保日期与文档日期一致

---

*最后更新：2026-07-05*
*维护者：CodeY Team*
