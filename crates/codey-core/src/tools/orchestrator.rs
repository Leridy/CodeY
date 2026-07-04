use anyhow::Result;
use super::registry::ToolRegistry;

/// Orchestrates tool execution with permission checks
pub struct ToolOrchestrator {
    registry: ToolRegistry,
}

impl ToolOrchestrator {
    pub fn new(registry: ToolRegistry) -> Self {
        Self { registry }
    }

    /// Execute a tool with permission check
    pub async fn execute(&self, tool_name: &str, input: serde_json::Value) -> Result<serde_json::Value> {
        let tool = self.registry.get(tool_name)
            .ok_or_else(|| anyhow::anyhow!("Tool not found: {}", tool_name))?;

        // TODO: Check permissions
        // TODO: Execute in sandbox

        Ok(serde_json::json!({
            "success": true,
            "tool": tool.name,
            "input": input
        }))
    }
}
