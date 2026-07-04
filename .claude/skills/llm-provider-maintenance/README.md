# LLM 提供商维护 - 完整文档

## 项目概述

本技能模块用于管理 CodeY 项目支持的所有 LLM（大语言模型）提供商配置。采用 SQLite 数据库存储，内置 50+ 提供商预设，支持可视化桌面应用管理和系统托盘一键切换。

## 核心设计

- **SQLite 数据库存储**：原子写入，防止配置文件损坏，支持并发读取
- **50+ 提供商预设**：内置大量提供商配置，开箱即用
- **可视化管理界面**：桌面应用管理配置，直观易用
- **一键切换**：系统托盘快速切换当前提供商

## 架构设计

```
llm-provider-maintenance/
├── SKILL.md                    # 技能入口文件
├── README.md                   # 本文档
├── schema/
│   └── database.sql            # SQLite 数据库 Schema
├── presets/                    # 提供商预设 JSON 文件
│   ├── openai.json
│   ├── anthropic.json
│   ├── deepseek.json
│   ├── qwen.json
│   ├── zhipu.json
│   ├── minimax.json
│   ├── kimi.json
│   ├── baichuan.json
│   ├── ollama.json
│   └── ...
├── guides/
│   ├── add-provider.md         # 添加新提供商指南
│   └── switch-provider.md      # 切换提供商指南
└── scripts/
    ├── import_preset.py        # 导入预设脚本
    └── export_preset.py        # 导出预设脚本
```

## 数据库结构

```sql
-- 提供商表
CREATE TABLE providers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  base_url TEXT NOT NULL,
  api_key_env TEXT,
  models_endpoint TEXT,
  chat_endpoint TEXT NOT NULL,
  default_model TEXT,
  supports_streaming BOOLEAN DEFAULT TRUE,
  supports_function_calling BOOLEAN DEFAULT TRUE,
  headers TEXT,  -- JSON 格式存储
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 模型表
CREATE TABLE models (
  id TEXT PRIMARY KEY,
  provider_id TEXT NOT NULL,
  name TEXT NOT NULL,
  context_window INTEGER,
  max_output_tokens INTEGER,
  FOREIGN KEY (provider_id) REFERENCES providers(id)
);

-- 配置表
CREATE TABLE config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 表结构说明

#### providers 表

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | TEXT | 提供商唯一标识符（主键） |
| `name` | TEXT | 提供商显示名称 |
| `base_url` | TEXT | API 基础 URL |
| `api_key_env` | TEXT | API Key 对应的环境变量名 |
| `models_endpoint` | TEXT | 获取模型列表的端点路径 |
| `chat_endpoint` | TEXT | 聊天完成接口端点路径 |
| `default_model` | TEXT | 默认使用的模型 ID |
| `supports_streaming` | BOOLEAN | 是否支持流式输出 |
| `supports_function_calling` | BOOLEAN | 是否支持函数调用 |
| `headers` | TEXT | 自定义请求头（JSON 格式） |
| `created_at` | TIMESTAMP | 创建时间 |
| `updated_at` | TIMESTAMP | 更新时间 |

#### models 表

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | TEXT | 模型唯一标识符（主键） |
| `provider_id` | TEXT | 所属提供商 ID（外键） |
| `name` | TEXT | 模型显示名称 |
| `context_window` | INTEGER | 上下文窗口大小（token 数） |
| `max_output_tokens` | INTEGER | 最大输出 token 数 |

#### config 表

| 字段 | 类型 | 说明 |
|------|------|------|
| `key` | TEXT | 配置键名（主键） |
| `value` | TEXT | 配置值 |
| `updated_at` | TIMESTAMP | 更新时间 |

## 提供商预设列表

### 云端提供商

| 提供商 | ID | 预设模型 | 环境变量 |
|--------|-----|----------|----------|
| OpenAI | openai | GPT-4o, GPT-4, GPT-3.5 Turbo | OPENAI_API_KEY |
| Anthropic | anthropic | Claude Sonnet 4, Claude 3.5 Haiku, Claude 3 Opus | ANTHROPIC_API_KEY |
| DeepSeek | deepseek | DeepSeek-V4, DeepSeek-R1 | DEEPSEEK_API_KEY |
| 通义千问 | qwen | Qwen3, Qwen3-Max, Qwen-Turbo | DASHSCOPE_API_KEY |
| 智谱 | zhipu | GLM-5, GLM-4, GLM-4-Flash | ZHIPU_API_KEY |
| 豆包 | doubao | 豆包大模型 | ARK_API_KEY |
| 文心一言 | wenxin | 文心 4.0, 文心 3.5 | QIANFAN_API_KEY |
| Kimi | kimi | Kimi K2.5, Moonshot v1 | MOONSHOT_API_KEY |
| MiniMax | minimax | MiniMax M2.5, abab6.5s | MINIMAX_API_KEY |
| 讯飞星火 | xinghuo | 星火 4.0, 星火 3.5 | SPARK_API_KEY |
| 腾讯元宝 | hunyuan | 混元大模型 | HUNYAN_API_KEY |
| 百川 | baichuan | 百川大模型 | BAICHUAN_API_KEY |
| 商汤 | sensetime | SenseChat | SENSECHAT_API_KEY |
| 小米 MiMo | mimo | MiMo-7B | MIMO_API_KEY |

### 本地部署

| 提供商 | ID | 说明 |
|--------|-----|------|
| Ollama | ollama | 本地模型部署，支持 llama3.1, qwen2.5 等 |
| vLLM | vllm | 高性能本地推理，支持自定义模型 |

## 使用方式

### 初始化数据库

```bash
# 创建配置目录
mkdir -p ~/.config/codey

# 创建数据库并执行 Schema
sqlite3 ~/.config/codey/providers.db < schema/database.sql

# 导入所有预设
for f in presets/*.json; do
  python scripts/import_preset.py "$f"
done
```

### 查询提供商

```bash
# 查看所有提供商
sqlite3 ~/.config/codey/providers.db \
  "SELECT id, name, base_url FROM providers ORDER BY name;"

# 查看提供商的模型
sqlite3 ~/.config/codey/providers.db \
  "SELECT m.id, m.name, m.context_window FROM models m WHERE m.provider_id = 'openai';"

# 查看当前活跃提供商
sqlite3 ~/.config/codey/providers.db \
  "SELECT value FROM config WHERE key = 'active_provider';"
```

### 添加新提供商

```bash
# 插入提供商
sqlite3 ~/.config/codey/providers.db <<EOF
INSERT INTO providers (id, name, base_url, api_key_env, chat_endpoint, default_model)
VALUES ('new-provider', '新提供商', 'https://api.new.com/v1', 'NEW_API_KEY', '/chat/completions', 'default-model');
EOF

# 插入模型
sqlite3 ~/.config/codey/providers.db <<EOF
INSERT INTO models (id, provider_id, name, context_window, max_output_tokens)
VALUES ('model-1', 'new-provider', 'Model 1', 128000, 4096);
EOF
```

### 切换提供商

```bash
# 更新当前活跃提供商
sqlite3 ~/.config/codey/providers.db \
  "INSERT OR REPLACE INTO config (key, value, updated_at) VALUES ('active_provider', 'anthropic', CURRENT_TIMESTAMP);"
```

### 可视化管理

```bash
# 启动桌面管理界面
codey-provider-manager
```

桌面应用提供：
- 提供商列表浏览
- 一键切换当前提供商
- 模型配置编辑
- API Key 管理
- 导入/导出预设

### 导入/导出预设

```bash
# 导出提供商为 JSON 预设
python scripts/export_preset.py openai > presets/openai.json

# 从 JSON 预设导入
python scripts/import_preset.py presets/new-provider.json
```

## 验证工具

### 检查数据库完整性

```bash
sqlite3 ~/.config/codey/providers.db "PRAGMA integrity_check;"
```

### 验证外键约束

```bash
sqlite3 ~/.config/codey/providers.db "PRAGMA foreign_key_check;"
```

## 最佳实践

1. **环境变量管理**：API Key 通过环境变量管理，不要硬编码到数据库
2. **定期备份**：定期备份 SQLite 数据库文件
3. **使用预设**：优先使用内置预设，减少手动配置错误
4. **原子操作**：所有写操作使用事务，确保数据一致性
5. **并发安全**：SQLite 支持并发读取，写入时自动加锁

## 相关文档

- [添加提供商指南](guides/add-provider.md)
- [切换提供商指南](guides/switch-provider.md)
