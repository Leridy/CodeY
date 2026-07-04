use anyhow::Result;
use crate::tools::ToolRegistry;
use crate::permission::PermissionEngine;

/// Main agent loop that orchestrates LLM calls and tool execution
#[allow(dead_code)]
pub struct AgentLoop {
    tool_registry: ToolRegistry,
    permission_engine: PermissionEngine,
}

impl AgentLoop {
    pub fn new() -> Self {
        Self {
            tool_registry: ToolRegistry::new(),
            permission_engine: PermissionEngine::new(),
        }
    }

    /// Process a user message and return a response
    pub async fn process_message(&self, message: &str) -> Result<String> {
        // TODO: Implement agent loop
        // 1. Send message to LLM
        // 2. Process tool calls
        // 3. Return response
        Ok(format!("Processed: {}", message))
    }
}
