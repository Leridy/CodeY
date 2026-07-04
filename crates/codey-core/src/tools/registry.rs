use std::collections::HashMap;

use serde_json::Value;

use crate::permission::PermissionLevel;

/// Registry of available tools
pub struct ToolRegistry {
    tools: HashMap<String, Tool>,
}

#[derive(Debug, Clone)]
pub struct Tool {
    pub name: String,
    pub description: String,
    /// 工具执行所需的最低权限级别
    pub required_permission: PermissionLevel,
    /// 工具参数的 JSON Schema 定义
    pub parameters: Value,
}

impl ToolRegistry {
    pub fn new() -> Self {
        let mut registry = Self {
            tools: HashMap::new(),
        };
        registry.register_defaults();
        registry
    }

    fn register_defaults(&mut self) {
        // File operations
        self.register(Tool {
            name: "file/read".to_string(),
            description: "Read file contents".to_string(),
            required_permission: PermissionLevel::FileRead,
            parameters: serde_json::json!({
                "type": "object",
                "properties": {
                    "path": {
                        "type": "string",
                        "description": "要读取的文件路径"
                    }
                },
                "required": ["path"]
            }),
        });
        self.register(Tool {
            name: "file/write".to_string(),
            description: "Write file contents".to_string(),
            required_permission: PermissionLevel::FileWrite,
            parameters: serde_json::json!({
                "type": "object",
                "properties": {
                    "path": {
                        "type": "string",
                        "description": "要写入的文件路径"
                    },
                    "content": {
                        "type": "string",
                        "description": "要写入的内容"
                    }
                },
                "required": ["path", "content"]
            }),
        });
        // Shell operations
        self.register(Tool {
            name: "shell/execute".to_string(),
            description: "Execute shell command".to_string(),
            required_permission: PermissionLevel::ShellRead,
            parameters: serde_json::json!({
                "type": "object",
                "properties": {
                    "command": {
                        "type": "string",
                        "description": "要执行的 shell 命令"
                    }
                },
                "required": ["command"]
            }),
        });
    }

    pub fn register(&mut self, tool: Tool) {
        self.tools.insert(tool.name.clone(), tool);
    }

    pub fn get(&self, name: &str) -> Option<&Tool> {
        self.tools.get(name)
    }

    /// 获取所有工具的列表
    ///
    /// # Returns
    /// 所有注册工具的引用列表
    pub fn list_all(&self) -> Vec<&Tool> {
        self.tools.values().collect()
    }

    /// 获取工具数量
    pub fn count(&self) -> usize {
        self.tools.len()
    }
}
