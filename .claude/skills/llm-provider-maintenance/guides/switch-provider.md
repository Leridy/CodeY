# 切换提供商指南

## 概述

本指南介绍如何切换当前活跃的 LLM 提供商。支持命令行、可视化界面和系统托盘三种方式。

## 方式一：命令行切换

### 查看当前提供商

```bash
sqlite3 ~/.config/codey/providers.db \
  "SELECT c.value as provider_id, p.name, p.base_url FROM config c JOIN providers p ON c.key = 'active_provider' AND p.id = c.value;"
```

### 切换提供商

```bash
sqlite3 ~/.config/codey/providers.db \
  "UPDATE config SET value = 'anthropic', updated_at = CURRENT_TIMESTAMP WHERE key = 'active_provider';"
```

### 验证切换结果

```bash
sqlite3 ~/.config/codey/providers.db \
  "SELECT c.value as active_provider, p.name, p.base_url FROM config c, providers p WHERE c.key = 'active_provider' AND p.id = c.value;"
```

## 方式二：可视化界面

### 启动桌面管理应用

```bash
codey-provider-manager
```

桌面应用功能：
- 查看所有提供商列表
- 一键切换当前提供商
- 查看提供商详情
- 管理 API Key
- 导入/导出预设

## 方式三：系统托盘快速切换

1. 在系统托盘找到 CodeY 图标
2. 右键点击，选择「切换提供商」
3. 从列表中选择目标提供商
4. 自动更新数据库配置

## 方式四：脚本切换

### 创建切换脚本

```bash
#!/bin/bash
# switch-provider.sh

PROVIDER_ID=$1

if [ -z "$PROVIDER_ID" ]; then
  echo "用法: $0 <provider_id>"
  echo "可用提供商:"
  sqlite3 ~/.config/codey/providers.db "SELECT id, name FROM providers ORDER BY name;"
  exit 1
fi

# 验证提供商是否存在
EXISTS=$(sqlite3 ~/.config/codey/providers.db \
  "SELECT COUNT(*) FROM providers WHERE id = '$PROVIDER_ID';")

if [ "$EXISTS" -eq 0 ]; then
  echo "错误: 提供商 '$PROVIDER_ID' 不存在"
  exit 1
fi

# 执行切换
sqlite3 ~/.config/codey/providers.db \
  "UPDATE config SET value = '$PROVIDER_ID', updated_at = CURRENT_TIMESTAMP WHERE key = 'active_provider';"

# 获取提供商名称
NAME=$(sqlite3 ~/.config/codey/providers.db \
  "SELECT name FROM providers WHERE id = '$PROVIDER_ID';")

echo "已切换到提供商: $NAME ($PROVIDER_ID)"
```

### 使用脚本

```bash
chmod +x switch-provider.sh
./switch-provider.sh anthropic
```

## 提供商切换的影响

切换提供商后：
- 所有新的 LLM 请求将使用新提供商
- 已有的会话不受影响
- API Key 需要对应新提供商的环境变量
- 模型列表会自动更新

## 常见问题

### Q: 切换后请求失败

检查：
1. 新提供商的 API Key 环境变量是否设置
2. 网络是否能访问新提供商的 API
3. 模型 ID 是否正确

```bash
# 检查提供商配置
sqlite3 ~/.config/codey/providers.db \
  "SELECT * FROM providers WHERE id = 'anthropic';"

# 检查环境变量
echo $ANTHROPIC_API_KEY
```

### Q: 如何回退到之前的提供商

手动回退：
```bash
sqlite3 ~/.config/codey/providers.db \
  "UPDATE config SET value = 'openai' WHERE key = 'active_provider';"
```

### Q: 如何查看所有可用提供商

```bash
sqlite3 ~/.config/codey/providers.db \
  "SELECT id, name, base_url FROM providers ORDER BY name;"
```

### Q: 如何查看提供商的模型列表

```bash
sqlite3 ~/.config/codey/providers.db \
  "SELECT m.id, m.name, m.context_window FROM models m WHERE m.provider_id = 'anthropic';"
```
