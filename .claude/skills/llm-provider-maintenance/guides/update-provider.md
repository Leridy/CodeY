# 更新提供商指南

## 概述

本指南介绍如何更新现有 LLM 提供商的配置，包括模型列表、API 端点、功能支持等。

## 常见更新场景

### 1. 添加新模型

当提供商发布新模型时，需要更新模型列表。

**步骤：**

1. 打开提供商配置文件：
   ```bash
   vim providers/openai.json
   ```

2. 在 `models` 数组中添加新模型：
   ```json
   {
     "models": [
       {"id": "gpt-4o", "name": "GPT-4o", "context_window": 128000, "max_output_tokens": 16384},
       {"id": "gpt-4o-mini", "name": "GPT-4o Mini", "context_window": 128000, "max_output_tokens": 16384}
     ]
   }
   ```

3. 验证配置：
   ```bash
   cat providers/openai.json | jq .
   ```

### 2. 更新 API 端点

当提供商更改 API 端点时：

```json
{
  "base_url": "https://api.new-endpoint.com/v1",
  "chat_endpoint": "/v2/chat/completions"
}
```

**注意事项：**
- 更新前备份原配置
- 测试新端点是否可用
- 确认认证方式是否变化

### 3. 更改默认模型

当推荐使用新默认模型时：

```json
{
  "default_model": "gpt-4o"
}
```

### 4. 更新功能支持

当提供商新增功能支持时：

```json
{
  "supports_streaming": true,
  "supports_function_calling": true
}
```

### 5. 更新模型参数

当模型上下文窗口或输出限制变化时：

```json
{
  "models": [
    {
      "id": "gpt-4o",
      "name": "GPT-4o",
      "context_window": 256000,
      "max_output_tokens": 32768
    }
  ]
}
```

## 更新流程

### 步骤 1：备份原配置

```bash
cp providers/openai.json providers/openai.json.backup
```

### 步骤 2：编辑配置文件

使用编辑器修改配置：

```bash
vim providers/openai.json
```

### 步骤 3：验证 JSON 格式

```bash
cat providers/openai.json | jq .
```

如果格式错误，`jq` 会提示具体位置。

### 步骤 4：验证 Schema

```bash
ajv validate -s schema/provider-schema.json -d providers/openai.json
```

### 步骤 5：测试 API 调用

使用新配置测试 API 连通性：

```bash
# 示例：测试 OpenAI 连接
curl -H "Authorization: Bearer $OPENAI_API_KEY" \
     https://api.openai.com/v1/models
```

### 步骤 6：提交变更

```bash
git add providers/openai.json
git commit -m "feat: 更新 OpenAI 提供商配置"
```

## 模型下架处理

当模型被提供商下架时：

1. 从 `models` 数组中移除该模型
2. 如果下架的是默认模型，更新 `default_model`
3. 更新文档说明

```json
{
  "default_model": "gpt-4o",
  "models": [
    {"id": "gpt-4o", "name": "GPT-4o", "context_window": 128000, "max_output_tokens": 16384}
  ]
}
```

## 批量更新

当需要同时更新多个提供商时：

```bash
# 创建更新脚本
cat > update-providers.sh << 'EOF'
#!/bin/bash
for f in providers/*.json; do
  echo "验证 $f..."
  cat "$f" | jq . > /dev/null 2>&1
  if [ $? -eq 0 ]; then
    echo "  ✓ JSON 格式正确"
  else
    echo "  ✗ JSON 格式错误"
  fi
done
EOF

chmod +x update-providers.sh
./update-providers.sh
```

## 版本管理建议

### 使用 Git 标签

```bash
# 标记配置版本
git tag -a v1.0.0 -m "提供商配置 v1.0.0"
git push origin v1.0.0
```

### 变更日志

在项目根目录维护 `CHANGELOG.md`：

```markdown
## [1.1.0] - 2024-01-15

### Added
- 新增 DeepSeek R1 模型支持

### Changed
- 更新 OpenAI 默认模型为 GPT-4o
- 更新通义千问 API 端点

### Removed
- 移除已下架的 GPT-3.5 模型
```

## 常见问题

### Q: 更新后配置不生效？

A: 检查以下几点：
1. JSON 格式是否正确
2. 环境变量是否设置
3. 应用是否重新加载配置

### Q: 如何回滚更新？

A: 使用备份文件恢复：

```bash
cp providers/openai.json.backup providers/openai.json
```

或使用 Git 回滚：

```bash
git checkout HEAD~1 providers/openai.json
```

### Q: 如何确认模型可用？

A: 使用 API 测试：

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

## 更新检查清单

- [ ] 备份原配置
- [ ] JSON 格式正确
- [ ] Schema 验证通过
- [ ] 模型 ID 正确
- [ ] API 端点可达
- [ ] 环境变量已配置
- [ ] 测试 API 调用成功
- [ ] 更新文档
- [ ] 提交变更
