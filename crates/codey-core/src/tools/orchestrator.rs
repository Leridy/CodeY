//! 工具编排器
//!
//! 负责工具查找、权限校验和执行调度

use anyhow::Result;
use std::collections::HashMap;
use std::future::Future;
use std::pin::Pin;
use std::sync::Arc;

use super::registry::{Tool, ToolRegistry};

/// 工具执行函数类型
///
/// 接受 JSON 参数，返回 JSON 结果的异步函数
pub type ToolExecuteFn = Arc<
    dyn Fn(serde_json::Value) -> Pin<Box<dyn Future<Output = Result<serde_json::Value>> + Send>>
        + Send
        + Sync,
>;

/// 编排工具执行，管理工具注册和执行器调度
pub struct ToolOrchestrator {
    registry: ToolRegistry,
    /// 已注册的工具执行器（工具名 -> 执行函数）
    executors: HashMap<String, ToolExecuteFn>,
}

impl ToolOrchestrator {
    pub fn new(registry: ToolRegistry) -> Self {
        Self {
            registry,
            executors: HashMap::new(),
        }
    }

    /// 注册工具执行器
    ///
    /// # Arguments
    /// * `tool_name` - 工具名称（需与注册表中的工具名一致）
    /// * `executor` - 工具执行函数
    pub fn register_executor(&mut self, tool_name: &str, executor: ToolExecuteFn) {
        self.executors.insert(tool_name.to_string(), executor);
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
    /// 通过 ToolRegistry 查找工具定义，再通过已注册的执行器执行实际逻辑。
    /// 如果工具存在但未注册执行器，返回明确的"执行器未配置"错误。
    pub async fn execute(
        &self,
        tool_name: &str,
        input: serde_json::Value,
    ) -> Result<serde_json::Value> {
        // 1. 查找工具定义
        let tool = self
            .registry
            .get(tool_name)
            .ok_or_else(|| anyhow::anyhow!("工具不存在: {}", tool_name))?;

        // 2. 查找并调用执行器
        match self.executors.get(tool_name) {
            Some(executor) => {
                tracing::debug!("执行工具: {}", tool_name);
                executor(input).await
            }
            None => {
                // 工具已注册但执行器未配置，返回明确错误
                anyhow::bail!(
                    "工具 '{}' 的执行器未配置，需要通过 register_executor() 注册",
                    tool.name
                )
            }
        }
    }
}
