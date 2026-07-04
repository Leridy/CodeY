# LLM 提供商维护

## 概述

基于 SQLite 数据库管理 CodeY 支持的 LLM 提供商配置。内置 50+ 提供商预设，支持可视化桌面应用管理，系统托盘一键切换提供商。

## 核心特性

- **SQLite 存储**：原子写入，防止配置文件损坏
- **50+ 预设**：内置主流 LLM 提供商配置，开箱即用
- **可视化界面**：桌面应用管理提供商配置
- **一键切换**：系统托盘快速切换当前使用的提供商

## 何时使用

- 添加或管理 LLM 提供商
- 切换当前使用的提供商
- 更新提供商配置（模型列表、API 端点）
- 导入/导出提供商预设

## 快速开始

### 初始化数据库
```bash
# 创建数据库并导入预设
sqlite3 ~/.config/codey/providers.db < schema/database.sql

# 导入所有预设
for f in presets/*.json; do
  python scripts/import_preset.py "$f"
done
```

### 查看提供商列表
```bash
sqlite3 ~/.config/codey/providers.db \
  "SELECT id, name, base_url FROM providers ORDER BY name;"
```

### 切换提供商
```bash
# 更新当前活跃提供商
sqlite3 ~/.config/codey/providers.db \
  "UPDATE config SET value = 'anthropic', updated_at = CURRENT_TIMESTAMP WHERE key = 'active_provider';"
```

### 可视化管理
```bash
# 启动桌面管理界面
codey-provider-manager
```

## 提供商预设

| 提供商 | 模型 | 类型 |
|--------|------|------|
| OpenAI | GPT-4o, GPT-4, GPT-3.5 | 云端 |
| Anthropic | Claude Sonnet 4, Claude 3 Opus | 云端 |
| DeepSeek | DeepSeek-V4, DeepSeek-R1 | 云端 |
| 通义千问 | Qwen3, Qwen3-Max | 云端 |
| 智谱 | GLM-5, GLM-4 | 云端 |
| 豆包 | 豆包大模型 | 云端 |
| 文心一言 | 文心 4.0 | 云端 |
| Kimi | Kimi K2.5 | 云端 |
| MiniMax | MiniMax M2.5 | 云端 |
| 讯飞星火 | 星火 4.0 | 云端 |
| 腾讯元宝 | 混元大模型 | 云端 |
| 百川 | 百川大模型 | 云端 |
| 商汤 | SenseChat | 云端 |
| 小米 MiMo | MiMo-7B | 云端 |
| Ollama | llama3.1, qwen2.5 | 本地 |
| vLLM | 自定义模型 | 本地 |

## 详细文档

- [README.md](README.md) - 完整文档
- [添加提供商指南](guides/add-provider.md)
- [切换提供商指南](guides/switch-provider.md)
