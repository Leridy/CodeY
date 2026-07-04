use std::collections::HashMap;

/// Registry of available tools
pub struct ToolRegistry {
    tools: HashMap<String, Tool>,
}

#[derive(Debug, Clone)]
pub struct Tool {
    pub name: String,
    pub description: String,
    pub required_permission: String,
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
            required_permission: "FileRead".to_string(),
        });
        self.register(Tool {
            name: "file/write".to_string(),
            description: "Write file contents".to_string(),
            required_permission: "FileWrite".to_string(),
        });
        // Shell operations
        self.register(Tool {
            name: "shell/execute".to_string(),
            description: "Execute shell command".to_string(),
            required_permission: "ShellRead".to_string(),
        });
    }

    pub fn register(&mut self, tool: Tool) {
        self.tools.insert(tool.name.clone(), tool);
    }

    pub fn get(&self, name: &str) -> Option<&Tool> {
        self.tools.get(name)
    }
}
