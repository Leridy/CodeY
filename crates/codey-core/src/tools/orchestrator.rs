use anyhow::Result;

use super::registry::{Tool, ToolRegistry};

/// Orchestrates tool execution with permission checks
pub struct ToolOrchestrator {
    registry: ToolRegistry,
}

impl ToolOrchestrator {
    pub fn new(registry: ToolRegistry) -> Self {
        Self { registry }
    }

    /// 获取工具定义的引用
    pub fn get(&self, name: &str) -> Option<&Tool> {
        self.registry.get(name)
    }

    /// 获取所有工具的列表
    pub fn list_all(&self) -> Vec<&Tool> {
        self.registry.list_all()
    }

    /// 执行工具调用
    ///
    /// 当前实现返回"未实现"错误。后续将集成沙箱执行。
    pub async fn execute(&self, tool_name: &str, _input: serde_json::Value) -> Result<serde_json::Value> {
        let tool = self.registry.get(tool_name)
            .ok_or_else(|| anyhow::anyhow!("工具不存在: {}", tool_name))?;

        // TODO: 通过沙箱执行工具
        anyhow::bail!(
            "工具 '{}' 的执行尚未实现（需要集成沙箱系统）",
            tool.name
        )
    }
}
