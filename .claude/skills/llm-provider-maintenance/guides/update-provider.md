# 更新提供商指南

## 概述

本指南介绍如何更新现有 LLM 提供商的配置，包括模型列表、API 端点、功能支持等。

## 常见更新场景

### 1. 添加新模型

当提供商发布新模型时，需要更新模型列表。

```bash
sqlite3 ~/.config/codey/providers.db <<EOF
INSERT INTO models (id, provider_id, name, context_window, max_output_tokens)
VALUES ('gpt-4o-mini', 'openai', 'GPT-4o Mini', 128000, 16384);
EOF
```

### 2. 更新 API 端点

当提供商更改 API 端点时：

```bash
sqlite3 ~/.config/codey/providers.db <<EOF
UPDATE providers
SET base_url = 'https://api.new-endpoint.com/v1',
    chat_endpoint = '/v2/chat/completions'
WHERE id = 'openai';
EOF
```

**注意事项：**
- 更新前导出备份
- 测试新端点是否可用
- 确认认证方式是否变化

### 3. 更改默认模型

当推荐使用新默认模型时：

```bash
sqlite3 ~/.config/codey/providers.db \
  "UPDATE providers SET default_model = 'gpt-4o' WHERE id = 'openai';"
```

### 4. 更新功能支持

当提供商新增功能支持时：

```bash
sqlite3 ~/.config/codey/providers.db \
  "UPDATE providers SET supports_function_calling = 1 WHERE id = 'minimax';"
```

### 5. 更新模型参数

当模型上下文窗口或输出限制变化时：

```bash
sqlite3 ~/.config/codey/providers.db \
  "UPDATE models SET context_window = 256000, max_output_tokens = 32768 WHERE id = 'gpt-4o';"
```

## 更新流程

### 步骤 1：备份数据库

```bash
cp ~/.config/codey/providers.db ~/.config/codey/providers.db.backup
```

### 步骤 2：执行更新

使用 SQL 语句更新配置。

### 步骤 3：验证更新结果

```bash
# 查看提供商信息
sqlite3 ~/.config/codey/providers.db \
  "SELECT id, name, base_url, default_model FROM providers WHERE id = 'openai';"

# 查看模型信息
sqlite3 ~/.config/codey/providers.db \
  "SELECT id, name, context_window, max_output_tokens FROM models WHERE provider_id = 'openai';"
```

### 步骤 4：测试 API 调用

使用新配置测试 API 连通性：

```bash
curl -X POST https://api.openai.com/v1/chat/completions \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4o",
    "messages": [{"role": "user", "content": "Hello"}],
    "max_tokens": 10
  }'
```

## 导出预设

更新后可以导出为 JSON 预设备份：

```bash
python scripts/export_preset.py openai > presets/openai.json
```

## 模型下架处理

当模型被提供商下架时：

1. 从数据库中删除该模型
2. 如果下架的是默认模型，更新 `default_model`

```bash
# 删除下架模型
sqlite3 ~/.config/codey/providers.db \
  "DELETE FROM models WHERE id = 'old-model' AND provider_id = 'openai';"

# 更新默认模型（如需要）
sqlite3 ~/.config/codey/providers.db \
  "UPDATE providers SET default_model = 'gpt-4o' WHERE id = 'openai';"
```

## 批量更新

当需要同时验证多个提供商时：

```bash
sqlite3 ~/.config/codey/providers.db \
  "SELECT p.id, p.name, COUNT(m.id) as model_count FROM providers p LEFT JOIN models m ON p.id = m.provider_id GROUP BY p.id;"
```

## 常见问题

### Q: 更新后配置不生效？

A: 检查以下几点：
1. SQL 语句是否执行成功
2. 环境变量是否设置
3. 应用是否重新加载配置

### Q: 如何回滚更新？

A: 使用备份文件恢复：

```bash
cp ~/.config/codey/providers.db.backup ~/.config/codey/providers.db
```

### Q: 如何确认模型可用？

A: 使用 API 测试或查看提供商的模型列表接口。

## 更新检查清单

- [ ] 备份数据库
- [ ] SQL 语句正确
- [ ] 更新结果验证
- [ ] API 端点可达
- [ ] 环境变量已配置
- [ ] 测试 API 调用成功
- [ ] 导出预设备份
