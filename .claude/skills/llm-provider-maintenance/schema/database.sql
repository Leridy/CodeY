-- LLM 提供商数据库 Schema
-- SQLite 3.x

-- 启用外键约束
PRAGMA foreign_keys = ON;

-- 提供商表
CREATE TABLE IF NOT EXISTS providers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  base_url TEXT NOT NULL,
  api_key_env TEXT,
  models_endpoint TEXT,
  chat_endpoint TEXT NOT NULL,
  default_model TEXT,
  supports_streaming BOOLEAN DEFAULT TRUE,
  supports_function_calling BOOLEAN DEFAULT TRUE,
  headers TEXT,  -- JSON 格式存储自定义请求头
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 模型表
CREATE TABLE IF NOT EXISTS models (
  id TEXT PRIMARY KEY,
  provider_id TEXT NOT NULL,
  name TEXT NOT NULL,
  context_window INTEGER,
  max_output_tokens INTEGER,
  FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE CASCADE
);

-- 配置表
CREATE TABLE IF NOT EXISTS config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_models_provider_id ON models(provider_id);
CREATE INDEX IF NOT EXISTS idx_config_key ON config(key);

-- 触发器：自动更新 updated_at
CREATE TRIGGER IF NOT EXISTS update_providers_timestamp
AFTER UPDATE ON providers
BEGIN
  UPDATE providers SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_config_timestamp
AFTER UPDATE ON config
BEGIN
  UPDATE config SET updated_at = CURRENT_TIMESTAMP WHERE key = NEW.key;
END;

-- 初始化默认配置
INSERT OR IGNORE INTO config (key, value) VALUES ('active_provider', 'openai');
INSERT OR IGNORE INTO config (key, value) VALUES ('db_version', '1.0.0');
