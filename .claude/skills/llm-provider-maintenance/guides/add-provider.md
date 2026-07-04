# 添加新提供商指南

## 概述

本指南介绍如何向 CodeY 添加新的 LLM 提供商支持。

## 前置条件

- 了解提供商的 API 文档
- 获取 API Key（如需要）
- 确认 API 端点和认证方式

## 步骤

### 1. 复制模板文件

```bash
cp .claude/skills/llm-provider-maintenance/templates/provider-template.json \
   .claude/skills/llm-provider-maintenance/providers/your-provider.json
```

### 2. 填写基本信息

编辑新文件，填写以下必填字段：

```json
{
  "id": "your-provider",
  "name": "提供商显示名称",
  "base_url": "https://api.your-provider.com/v1",
  "chat_endpoint": "/chat/completions",
  "default_model": "default-model-id"
}
```

**字段说明：**

| 字段 | 说明 | 示例 |
|------|------|------|
| `id` | 唯一标识，小写字母+连字符 | `deepseek`、`zhipu` |
| `name` | 显示名称，可使用中文 | `DeepSeek`、`智谱` |
| `base_url` | API 基础 URL | `https://api.deepseek.com/v1` |
| `chat_endpoint` | 聊天接口路径 | `/chat/completions` |
| `default_model` | 默认模型 ID | `deepseek-chat` |

### 3. 配置 API Key

如果提供商需要 API Key：

```json
{
  "api_key_env": "YOUR_PROVIDER_API_KEY",
  "headers": {
    "Authorization": "Bearer ${api_key}"
  }
}
```

**注意事项：**
- `api_key_env` 是环境变量名，不是实际的 Key 值
- `headers` 中使用 `${api_key}` 作为占位符
- 运行时会自动替换为环境变量的值

### 4. 配置模型列表

添加提供商支持的模型：

```json
{
  "models": [
    {
      "id": "model-id",
      "name": "模型显示名称",
      "context_window": 32768,
      "max_output_tokens": 4096
    }
  ]
}
```

**模型字段说明：**

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | 模型 ID，用于 API 调用 |
| `name` | string | 显示名称 |
| `context_window` | integer | 上下文窗口大小（token） |
| `max_output_tokens` | integer | 最大输出 token 数 |

### 5. 设置功能支持

根据提供商 API 能力设置：

```json
{
  "supports_streaming": true,
  "supports_function_calling": false
}
```

### 6. 验证配置

```bash
# 检查 JSON 格式
cat providers/your-provider.json | jq .

# 验证 Schema
ajv validate -s schema/provider-schema.json -d providers/your-provider.json
```

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
export YOUR_PROVIDER_API_KEY="your-api-key-here"
```

### Q: 如何确认 API 端点？

A: 参考提供商的官方 API 文档，通常端点格式为：
- OpenAI 兼容：`/chat/completions`
- 自定义端点：根据文档确定

### Q: 模型 ID 从哪里获取？

A: 从提供商的 API 文档或模型列表接口获取，确保使用正确的模型 ID。

### Q: context_window 如何确定？

A: 参考提供商文档中的模型说明，通常会标注支持的最大上下文长度。

## 提交检查清单

- [ ] JSON 格式正确
- [ ] Schema 验证通过
- [ ] API Key 环境变量已配置
- [ ] 模型列表完整准确
- [ ] 功能支持标记正确
- [ ] 已测试 API 调用
