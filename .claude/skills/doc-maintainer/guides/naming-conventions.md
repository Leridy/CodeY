# 文档命名规则

## 通用规则

所有文档使用小写字母和连字符：
```
<type>-<topic>.md
```

## 类型前缀

| 前缀 | 说明 | 示例 |
|------|------|------|
| [Blog] | 博客文章 | [Blog] 2026-07-05-llm-integration.md |
| [Spec] | 规范文档 | [Spec] 2026-07-05-phase1-protocol.md |
| [Guide] | 使用指南 | [Guide] getting-started.md |
| [API] | API 文档 | [API] agent-methods.md |
| [Design] | 设计文档 | [Design] architecture.md |

## 日期格式

所有日期使用 YYYY-MM-DD 格式：
```
[Blog] 2026-07-05-llm-integration.md
```

## 目录结构

```
docs/
├── blog/                    # 博客文章
│   └── [Blog] 2026-07-05-llm-integration.md
├── specs/                   # 规范文档
│   └── [Spec] 2026-07-05-phase1-protocol/
├── guides/                  # 使用指南
│   └── [Guide] getting-started.md
├── api/                     # API 文档
│   └── [API] agent-methods.md
└── design/                  # 设计文档
    └── [Design] architecture.md
```
