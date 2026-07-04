# doc-maintainer 完整文档

维护 CodeY 项目的文档一致性、版本管理和规范执行。

---

## 文档规范（Document Standards）

### 目录结构

```
docs/
├── YYYY-MM-DD/          # 按日期组织
│   ├── design-decisions.md
│   ├── architecture.md
│   └── api-spec.md
├── specs/               # 规范文档
│   ├── YYYY-MM-DD-<topic>-design.md
│   └── ...
├── guides/              # 使用指南
│   ├── getting-started.md
│   └── ...
└── CHANGELOG.md         # 变更日志
```

### 文件命名规范

| 规则 | 说明 | 示例 |
|------|------|------|
| 小写字母 | 文件名全部小写 | `design-decisions.md` |
| 连字符分隔 | 单词之间用连字符 | `api-spec.md` |
| 日期前缀 | 可选，按需添加 | `2026-07-05-design-decisions.md` |
| 版本后缀 | 重大版本添加 | `api-spec-v2.md` |

### 文档头部格式

所有文档必须包含规范的头部信息：

```markdown
# 文档标题

> 日期：YYYY-MM-DD
> 阶段：[需求收集|架构设计|实现|测试|发布]
> 版本：vX.Y.Z
> 作者：[作者名]
```

**头部字段说明**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| 日期 | YYYY-MM-DD | 是 | 文档创建或最后更新日期 |
| 阶段 | 枚举 | 是 | 文档所属的项目阶段 |
| 版本 | vX.Y.Z | 是 | 语义化版本号 |
| 作者 | string | 是 | 文档作者名称 |

### 版本管理规则

| 变更类型 | 版本递增 | 示例 |
|----------|----------|------|
| 新增章节（向后兼容） | MINOR | v1.0.0 -> v1.1.0 |
| 重大内容修改 | MINOR | v1.1.0 -> v1.2.0 |
| 结构性重组 | MAJOR | v1.2.0 -> v2.0.0 |
| 修正错误或格式 | PATCH | v1.0.0 -> v1.0.1 |

---

## 命令参考（Command Reference）

### 1. doc-create

创建新文档，自动添加日期目录和规范头部。

**语法**

```bash
doc-create <filename> [--date YYYY-MM-DD] [--stage <stage>] [--author <author>]
```

**参数**

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| filename | string | 是 | - | 文件名（如 `architecture.md`） |
| --date | YYYY-MM-DD | 否 | 今天 | 文档日期 |
| --stage | string | 否 | `架构设计` | 项目阶段 |
| --author | string | 否 | 环境变量或配置 | 作者名称 |

**执行流程**

1. 检查 `docs/YYYY-MM-DD/` 目录是否存在
2. 如果不存在，创建目录
3. 检查同名文件是否已存在
4. 如果存在，提示用户选择：
   - 覆盖（需确认）
   - 创建新版本（添加版本后缀）
   - 取消操作
5. 写入文档，添加规范头部
6. 更新 `CHANGELOG.md`

**示例**

```bash
# 创建架构设计文档
doc-create architecture.md

# 指定日期和阶段
doc-create api-spec.md --date 2026-07-05 --stage "实现"

# 指定作者
doc-create design-decisions.md --author "张三"
```

---

### 2. doc-update

更新现有文档，自动递增版本号。

**语法**

```bash
doc-update <filename> [--section <section>] [--reason <reason>] [--version <version>]
```

**参数**

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| filename | string | 是 | - | 要更新的文件名 |
| --section | string | 否 | - | 更新的章节名称 |
| --reason | string | 否 | - | 更新原因 |
| --version | string | 否 | 自动递增 | 指定版本号 |

**执行流程**

1. 读取现有文档
2. 检查版本号
3. 递增版本号（除非指定）
4. 更新指定章节
5. 更新文档头部的日期和版本
6. 更新 `CHANGELOG.md`

**示例**

```bash
# 更新指定章节
doc-update architecture.md --section "权限模型" --reason "添加规则引擎细节"

# 指定版本号
doc-update api-spec.md --section "用户接口" --version "v2.0.0"

# 更新整个文档
doc-update design-decisions.md --reason "重构数据模型"
```

---

### 3. doc-check-conflicts

检查同名文件是否存在冲突。

**语法**

```bash
doc-check-conflicts <filename>
doc-check-all
```

**参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| filename | string | 否 | 要检查的文件名（不填则检查所有） |

**检查内容**

| 检查类型 | 说明 |
|----------|------|
| 文件名冲突 | 同名文件在不同日期目录下 |
| 内容冲突 | 同名文件内容不一致 |
| 版本不一致 | 版本号与内容不匹配 |
| 头部缺失 | 缺少规范的头部信息 |

**输出格式**

```
冲突报告

文件名：architecture.md
位置：
  - docs/2026-07-01/architecture.md (v1.0.0)
  - docs/2026-07-05/architecture.md (v1.1.0)

差异：
  - 第 15 行：权限模型描述不同
  - 第 28 行：API 端点列表不同

建议：
  - 合并两个版本
  - 使用最新版本（v1.1.0）
  - 手动检查差异
```

---

### 4. doc-generate-tree

生成文档目录结构。

**语法**

```bash
doc-generate-tree [--output <file>] [--format <format>]
```

**参数**

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| --output | string | 否 | stdout | 输出文件路径 |
| --format | string | 否 | `tree` | 输出格式：`tree`、`json`、`markdown` |

**示例**

```bash
# 生成树形结构
doc-generate-tree

# 输出到文件
doc-generate-tree --output docs/README.md

# JSON 格式
doc-generate-tree --format json --output docs/structure.json
```

---

### 5. doc-generate-changelog

生成变更日志。

**语法**

```bash
doc-generate-changelog [--since YYYY-MM-DD] [--output <file>]
```

**参数**

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| --since | YYYY-MM-DD | 否 | 全部 | 起始日期 |
| --output | string | 否 | `docs/CHANGELOG.md` | 输出文件路径 |

**执行流程**

1. 扫描 `docs/` 目录下所有 `.md` 文件
2. 提取文档头部信息（日期、版本、作者）
3. 按日期倒序排列
4. 生成 CHANGELOG 格式
5. 写入输出文件

**示例**

```bash
# 生成完整变更日志
doc-generate-changelog

# 只生成最近一周的变更
doc-generate-changelog --since 2026-06-28

# 输出到指定文件
doc-generate-changelog --output docs/RELEASE_NOTES.md
```

---

## 配置选项（Configuration）

### 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `CODEY_DOCS_ROOT` | `./docs` | 文档根目录 |
| `CODEY_DOC_AUTHOR` | - | 默认作者 |
| `CODEY_AUTO_CHANGELOG` | `true` | 自动更新 CHANGELOG |
| `CODEY_DATE_FORMAT` | `YYYY-MM-DD` | 日期格式 |
| `CODEY_VERSION_FORMAT` | `vX.Y.Z` | 版本号格式 |

### 配置文件

在项目根目录创建 `.codey/doc-config.json`：

```json
{
  "docsRoot": "./docs",
  "defaultAuthor": "CodeY Team",
  "autoChangelog": true,
  "dateFormat": "YYYY-MM-DD",
  "versionFormat": "vX.Y.Z",
  "stages": [
    "需求收集",
    "架构设计",
    "实现",
    "测试",
    "发布"
  ],
  "ignorePatterns": [
    "node_modules",
    ".git",
    "dist"
  ]
}
```

**配置字段说明**

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| docsRoot | string | `./docs` | 文档根目录路径 |
| defaultAuthor | string | - | 默认作者名称 |
| autoChangelog | boolean | `true` | 创建/更新文档时自动更新 CHANGELOG |
| dateFormat | string | `YYYY-MM-DD` | 日期格式 |
| versionFormat | string | `vX.Y.Z` | 版本号格式 |
| stages | string[] | 见上 | 项目阶段枚举值 |
| ignorePatterns | string[] | `[]` | 忽略的目录/文件模式 |

---

## 集成方式（Integration）

### 在 Claude Code 中使用

```bash
# 直接调用 skill
/doc-maintainer create architecture.md
/doc-maintainer check-conflicts
/doc-maintainer update design-decisions.md --section "UI设计"
/doc-maintainer generate-tree
/doc-maintainer generate-changelog --since 2026-07-01
```

### 在工作流中使用

```javascript
// 在 workflow 脚本中调用
const result = await agent("创建架构文档", {
  skill: "doc-maintainer",
  args: ["create", "architecture.md", "--stage", "架构设计"]
});
```

### 与其他 Skill 的集成

| Skill | 集成方式 |
|-------|----------|
| codey-brainstorming | Spec 文档按日期目录组织，遵循文档规范 |
| codey-dev-workflow | 开发流程中的文档创建和更新 |
| protocol-maintainer | 协议文档的版本管理 |
| codey-frontend-style | 前端文档的规范检查 |
| codey-testing-standards | 测试文档的规范检查 |

---

## 最佳实践（Best Practices）

### 1. 日期目录组织

```
✅ 正确
docs/2026-07-05/architecture.md
docs/2026-07-05/api-spec.md

❌ 错误
docs/architecture.md
docs/api-spec.md
```

### 2. 版本管理

```
✅ 正确
v1.0.0 → v1.1.0 (新增章节)
v1.1.0 → v2.0.0 (结构性重组)

❌ 错误
v1.0.0 → v2.0.0 (小改动却升大版本)
```

### 3. 变更记录

```
✅ 正确
每次更新都记录到 CHANGELOG.md

❌ 错误
只在发布时才更新 CHANGELOG.md
```

### 4. 冲突检查

```
✅ 正确
创建文档前检查同名文件

❌ 错误
直接覆盖同名文件
```

### 5. 规范头部

```
✅ 正确
所有文档都包含规范的头部信息

❌ 错误
部分文档缺少头部信息
```

### 6. 中文交流

```
✅ 正确
技术术语使用英文，说明使用中文

❌ 错误
全部使用英文或全部使用中文
```

---

## 常见问题（FAQ）

### Q1: 如何处理同名文件冲突？

A1: 使用 `doc-check-conflicts` 检查冲突，然后选择：
- 合并两个版本
- 使用最新版本
- 手动检查差异

### Q2: 如何批量更新文档版本？

A2: 使用 `doc-update` 命令配合 `--version` 参数，或编写脚本批量处理。

### Q3: 如何自定义文档模板？

A3: 修改 `templates/doc-template.md` 文件，或在配置文件中指定自定义模板路径。

### Q4: 如何忽略某些目录？

A4: 在配置文件的 `ignorePatterns` 字段中添加要忽略的目录/文件模式。

### Q5: 如何导出文档结构？

A5: 使用 `doc-generate-tree --format json` 导出 JSON 格式的文档结构。

---

## 故障排除（Troubleshooting）

### 问题：文档创建失败

**症状**：`doc-create` 命令执行失败

**可能原因**：
1. 目录权限不足
2. 同名文件已存在且未选择覆盖
3. 磁盘空间不足

**解决方案**：
1. 检查目录权限：`ls -la docs/`
2. 使用 `doc-check-conflicts` 检查冲突
3. 清理磁盘空间

### 问题：版本号不递增

**症状**：`doc-update` 后版本号未变化

**可能原因**：
1. 未指定 `--section` 或 `--reason`
2. 文档头部格式不正确
3. 版本号格式不匹配

**解决方案**：
1. 指定更新原因：`doc-update file.md --reason "更新内容"`
2. 检查文档头部格式
3. 确保版本号格式为 `vX.Y.Z`

### 问题：CHANGELOG 未更新

**症状**：创建/更新文档后 CHANGELOG 未变化

**可能原因**：
1. `CODEY_AUTO_CHANGELOG` 设置为 `false`
2. 配置文件中 `autoChangelog` 设置为 `false`
3. CHANGELOG 文件被锁定

**解决方案**：
1. 检查环境变量：`echo $CODEY_AUTO_CHANGELOG`
2. 检查配置文件：`.codey/doc-config.json`
3. 手动生成 CHANGELOG：`doc-generate-changelog`

---

## 更新日志（CHANGELOG）

### v1.0.0 (2026-07-05)

- 初始版本
- 实现文档创建功能（doc-create）
- 实现文档更新功能（doc-update）
- 实现冲突检查功能（doc-check-conflicts）
- 实现目录生成功能（doc-generate-tree）
- 实现变更日志生成功能（doc-generate-changelog）
- 支持环境变量和配置文件
- 提供文档模板和变更日志模板

---

*Skill 版本：v1.0.0*
*创建日期：2026-07-05*
