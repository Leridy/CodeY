# 添加提供商指南

## 概述

本指南介绍如何向 LLM 提供商数据库添加新的提供商配置。

## 前置条件

- 了解提供商的 API 文档
- 获取 API Key（如需要）
- 确认 API 端点和认证方式
- 数据库已初始化（`sqlite3 ~/.config/codey/providers.db < schema/database.sql`）

## 方式一：从 JSON 预设导入（推荐）

### 1. 创建预设文件

在 `presets/` 目录下创建 JSON 文件：

```json
{
  "id": "new-provider",
  "name": "新提供商",
  "base_url": "https://api.new.com/v1",
  "api_key_env": "NEW_API_KEY",
  "chat_endpoint": "/chat/completions",
  "default_model": "default-model",
  "supports_streaming": true,
  "supports_function_calling": false,
  "headers": {
    "Authorization": "Bearer ${api_key}"
  },
  "models": [
    {
      "id": "model-1",
      "name": "Model 1",
      "context_window": 128000,
      "max_output_tokens": 4096
    }
  ]
}
```

### 2. 导入预设

```bash
python scripts/import_preset.py presets/new-provider.json
```

## 方式二：直接操作数据库

### 1. 插入提供商记录

```bash
sqlite3 ~/.config/codey/providers.db <<EOF
INSERT INTO providers (
  id, name, base_url, api_key_env, chat_endpoint,
  default_model, supports_streaming, supports_function_calling, headers
) VALUES (
  'new-provider',
  '新提供商',
  'https://api.new.com/v1',
  'NEW_API_KEY',
  '/chat/completions',
  'default-model',
  1,
  0,
  '{"Authorization": "Bearer \${api_key}"}'
);
EOF
```

### 2. 插入模型记录

```bash
sqlite3 ~/.config/codey/providers.db <<EOF
INSERT INTO models (id, provider_id, name, context_window, max_output_tokens)
VALUES
  ('model-1', 'new-provider', 'Model 1', 128000, 4096),
  ('model-2', 'new-provider', 'Model 2', 32768, 4096);
EOF
```

### 3. 验证添加结果

```bash
# 查看提供商
sqlite3 ~/.config/codey/providers.db \
  "SELECT id, name, base_url FROM providers WHERE id = 'new-provider';"

# 查看模型
sqlite3 ~/.config/codey/providers.db \
  "SELECT id, name, context_window FROM models WHERE provider_id = 'new-provider';"
```

## 字段说明

| 字段 | 必填 | 说明 |
|------|------|------|
| `id` | 是 | 唯一标识符，使用小写字母和连字符 |
| `name` | 是 | 显示名称 |
| `base_url` | 是 | API 基础 URL |
| `api_key_env` | 否 | API Key 环境变量名 |
| `chat_endpoint` | 是 | 聊天接口端点路径 |
| `default_model` | 否 | 默认模型 ID |
| `supports_streaming` | 否 | 是否支持流式输出，默认 true |
| `supports_function_calling` | 否 | 是否支持函数调用，默认 true |
| `headers` | 否 | 自定义请求头（JSON 格式） |

## 完整示例

以下是一个完整的提供商配置示例：

```json
{
  "id": "example",
  "name": "示例提供商",
  "base_url": "https://api.example.com/v1",
  "api_key_env": "EXAMPLE_API_KEY",
  "models_endpoint": "/models",
  "chat_endpoint": "/chat/completions",
  "default_model": "example-model",
  "supports_streaming": true,
  "supports_function_calling": true,
  "headers": {
    "Authorization": "Bearer ${api_key}"
  },
  "models": [
    {
      "id": "example-model",
      "name": "示例模型",
      "context_window": 32768,
      "max_output_tokens": 4096
    },
    {
      "id": "example-model-pro",
      "name": "示例模型 Pro",
      "context_window": 128000,
      "max_output_tokens": 8192
    }
  ]
}
```

## 常见问题

### Q: API Key 如何管理？

A: 将 API Key 设置为环境变量，配置文件中只写变量名：

```bash
export NEW_API_KEY="your-api-key-here"
```

### Q: 如何确认 API 端点？

A: 参考提供商的官方 API 文档，通常端点格式为：
- OpenAI 兼容：`/chat/completions`
- 自定义端点：根据文档确定

### Q: 模型 ID 从哪里获取？

A: 从提供商的 API 文档或模型列表接口获取，确保使用正确的模型 ID。

## 最佳实践

1. **命名规范**：提供商 ID 使用小写字母和连字符
2. **环境变量**：API Key 通过环境变量管理，不要硬编码
3. **测试连接**：添加后测试 API 连接是否正常
4. **文档记录**：在 README.md 中更新提供商列表

## 提交检查清单

- [ ] JSON 预设格式正确
- [ ] 数据库插入成功
- [ ] API Key 环境变量已配置
- [ ] 模型列表完整准确
- [ ] 功能支持标记正确
- [ ] 已测试 API 调用
