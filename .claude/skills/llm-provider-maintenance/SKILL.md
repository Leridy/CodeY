---
name: llm-provider-maintenance
description: 在添加或管理 LLM 提供商、切换当前使用的提供商、更新提供商配置或导入/导出提供商预设时使用此 skill。基于 SQLite 数据库管理，内置 50+ 提供商预设。触发关键词："LLM"、"提供商"、"provider"、"模型"、"OpenAI"、"Anthropic"、"切换模型"、"API Key"。
---

# LLM 提供商维护 Skill

基于 SQLite 数据库管理 CodeY 支持的 LLM 提供商配置。

## 何时激活

- 添加或管理 LLM 提供商
- 切换当前使用的提供商
- 更新提供商配置（模型列表、API 端点）
- 导入/导出提供商预设

## 核心特性

- **SQLite 存储**：原子写入，防止配置文件损坏
- **50+ 预设**：内置主流 LLM 提供商配置，开箱即用
- **可视化界面**：桌面应用管理提供商配置
- **一键切换**：系统托盘快速切换当前使用的提供商

## 快速操作

### 查看提供商列表
```bash
sqlite3 ~/.config/codey/providers.db \
  "SELECT id, name, base_url FROM providers ORDER BY name;"
```

### 切换提供商
```bash
sqlite3 ~/.config/codey/providers.db \
  "UPDATE config SET value = 'anthropic', updated_at = CURRENT_TIMESTAMP WHERE key = 'active_provider';"
```

### 可视化管理
```bash
codey-provider-manager
```

## 内置提供商

| 提供商 | 模型 | 类型 |
|--------|------|------|
| OpenAI | GPT-4o, GPT-4, GPT-3.5 | 云端 |
| Anthropic | Claude Sonnet 4, Claude 3 Opus | 云端 |
| DeepSeek | DeepSeek-V4, DeepSeek-R1 | 云端 |
| 通义千问 | Qwen3, Qwen3-Max | 云端 |
| 智谱 | GLM-5, GLM-4 | 云端 |
| 豆包 | 豆包大模型 | 云端 |
| Ollama | llama3.1, qwen2.5 | 本地 |
| vLLM | 自定义模型 | 本地 |

## 内置资源

- `presets/` - 提供商预设 JSON 文件
- `schema/` - SQLite 数据库 Schema
- `scripts/` - 导入/导出脚本
- `guides/` - 操作指南

完整文档见 `README.md`。
