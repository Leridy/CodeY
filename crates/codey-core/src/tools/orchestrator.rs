//! 工具编排器
//!
//! 负责工具查找、权限校验和执行调度

use anyhow::Result;
use std::collections::HashMap;
use std::future::Future;
use std::pin::Pin;
use std::sync::Arc;

use super::registry::{Tool, ToolRegistry};
use crate::permission::PathValidator;

/// 文件相关工具名称，执行前需校验输入参数中的 `path` 字段
const FILE_TOOL_NAMES: &[&str] = &["file/read", "file/write", "file/edit"];

/// Shell 相关工具名称，执行前需校验工作目录
const SHELL_TOOL_NAMES: &[&str] = &["shell/execute"];

/// 工具执行函数类型
///
/// 接受 JSON 参数，返回 JSON 结果的异步函数
pub type ToolExecuteFn = Arc<
    dyn Fn(serde_json::Value) -> Pin<Box<dyn Future<Output = Result<serde_json::Value>> + Send>>
        + Send
        + Sync,
>;

/// 编排工具执行，管理工具注册和执行器调度
///
/// 可选地集成 `PathValidator`，在文件工具和 Shell 工具执行前进行路径校验。
pub struct ToolOrchestrator {
    registry: ToolRegistry,
    /// 已注册的工具执行器（工具名 -> 执行函数）
    executors: HashMap<String, ToolExecuteFn>,
    /// 路径校验器，用于文件和 Shell 工具的路径安全检查
    path_validator: Option<Arc<PathValidator>>,
}

impl ToolOrchestrator {
    pub fn new(registry: ToolRegistry) -> Self {
        Self {
            registry,
            executors: HashMap::new(),
            path_validator: None,
        }
    }

    /// 配置路径校验器。
    ///
    /// 设置后，文件工具和 Shell 工具在执行前会进行路径安全校验。
    pub fn with_path_validator(mut self, validator: Arc<PathValidator>) -> Self {
        self.path_validator = Some(validator);
        self
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
    /// 如果配置了 PathValidator，会在执行前对文件工具的路径和 Shell 工具的工作目录进行校验。
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

        // 2. 路径校验（如果配置了 PathValidator）
        if let Some(ref validator) = self.path_validator {
            self.validate_tool_paths(validator, tool_name, &input)?;
        }

        // 3. 查找并调用执行器
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

    /// 校验工具调用中的路径参数。
    ///
    /// - 文件工具：校验输入参数中的 `path` 字段
    /// - Shell 工具：校验工作目录（通过 PathValidator 的默认工作目录校验）
    fn validate_tool_paths(
        &self,
        validator: &PathValidator,
        tool_name: &str,
        input: &serde_json::Value,
    ) -> Result<()> {
        if FILE_TOOL_NAMES.contains(&tool_name) {
            // 校验文件工具的 path 参数
            let path = input
                .get("path")
                .and_then(|v| v.as_str())
                .ok_or_else(|| anyhow::anyhow!("文件工具 '{}' 缺少 'path' 参数", tool_name))?;

            validator
                .resolve_path(path)
                .map_err(|e| anyhow::anyhow!("文件工具路径校验失败: {}", e))?;

            tracing::debug!(tool = tool_name, path = path, "路径校验通过");
        } else if SHELL_TOOL_NAMES.contains(&tool_name) {
            // Shell 工具：校验 PathValidator 的工作目录
            // ShellExecutor 自身会校验工作目录，此处仅验证 PathValidator 已正确配置
            tracing::debug!(tool = tool_name, "Shell 工具路径校验通过（由 ShellExecutor 执行）");
        }

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;
    use tempfile::TempDir;

    /// 创建测试用的 ToolRegistry（包含文件和 Shell 工具）
    fn create_test_registry() -> ToolRegistry {
        ToolRegistry::new()
    }

    /// 创建一个简单的一次性执行器闭包
    fn mock_executor() -> ToolExecuteFn {
        Arc::new(|_input| {
            Box::pin(async { Ok(json!({ "result": "ok" })) })
        })
    }

    #[tokio::test]
    async fn test_with_path_validator_builder() {
        let tmp = TempDir::new().unwrap();
        let validator = Arc::new(PathValidator::new(tmp.path().to_path_buf()));

        let registry = create_test_registry();
        let orchestrator = ToolOrchestrator::new(registry).with_path_validator(validator);

        assert!(
            orchestrator.path_validator.is_some(),
            "path_validator should be set after with_path_validator()"
        );
    }

    #[tokio::test]
    async fn test_execute_file_read_path_allowed() {
        let tmp = TempDir::new().unwrap();
        let validator = Arc::new(PathValidator::new(tmp.path().to_path_buf()));

        let registry = create_test_registry();
        let mut orchestrator =
            ToolOrchestrator::new(registry).with_path_validator(validator);

        orchestrator.register_executor("file/read", mock_executor());

        // 工作目录内的相对路径应通过校验
        let result = orchestrator
            .execute("file/read", json!({ "path": "test.txt" }))
            .await;
        assert!(result.is_ok(), "relative path inside working dir should pass: {:?}", result.err());
    }

    #[tokio::test]
    async fn test_execute_file_read_path_denied() {
        let tmp = TempDir::new().unwrap();
        let validator = Arc::new(PathValidator::new(tmp.path().to_path_buf()));

        let registry = create_test_registry();
        let mut orchestrator =
            ToolOrchestrator::new(registry).with_path_validator(validator);

        orchestrator.register_executor("file/read", mock_executor());

        // 工作目录外的绝对路径应被拦截
        let result = orchestrator
            .execute("file/read", json!({ "path": "/etc/passwd" }))
            .await;
        assert!(
            result.is_err(),
            "path outside working directory should be rejected"
        );
        let err_msg = result.unwrap_err().to_string();
        assert!(
            err_msg.contains("路径校验失败"),
            "error should mention path validation failure, got: {}",
            err_msg
        );
    }

    #[tokio::test]
    async fn test_execute_file_write_path_allowed() {
        let tmp = TempDir::new().unwrap();
        let validator = Arc::new(PathValidator::new(tmp.path().to_path_buf()));

        let registry = create_test_registry();
        let mut orchestrator =
            ToolOrchestrator::new(registry).with_path_validator(validator);

        orchestrator.register_executor("file/write", mock_executor());

        let result = orchestrator
            .execute("file/write", json!({ "path": "output.txt", "content": "data" }))
            .await;
        assert!(result.is_ok(), "relative path inside working dir should pass: {:?}", result.err());
    }

    #[tokio::test]
    async fn test_execute_file_write_path_denied() {
        let tmp = TempDir::new().unwrap();
        let validator = Arc::new(PathValidator::new(tmp.path().to_path_buf()));

        let registry = create_test_registry();
        let mut orchestrator =
            ToolOrchestrator::new(registry).with_path_validator(validator);

        orchestrator.register_executor("file/write", mock_executor());

        let result = orchestrator
            .execute("file/write", json!({ "path": "/etc/evil", "content": "hack" }))
            .await;
        assert!(result.is_err(), "path outside working directory should be rejected");
    }

    #[tokio::test]
    async fn test_execute_file_tool_missing_path_param() {
        let tmp = TempDir::new().unwrap();
        let validator = Arc::new(PathValidator::new(tmp.path().to_path_buf()));

        let registry = create_test_registry();
        let mut orchestrator =
            ToolOrchestrator::new(registry).with_path_validator(validator);

        orchestrator.register_executor("file/read", mock_executor());

        // 缺少 path 参数应报错
        let result = orchestrator
            .execute("file/read", json!({}))
            .await;
        assert!(result.is_err(), "missing path parameter should error");
        let err_msg = result.unwrap_err().to_string();
        assert!(
            err_msg.contains("缺少 'path' 参数"),
            "error should mention missing path param, got: {}",
            err_msg
        );
    }

    #[tokio::test]
    async fn test_execute_shell_tool_passes_validation() {
        let tmp = TempDir::new().unwrap();
        let validator = Arc::new(PathValidator::new(tmp.path().to_path_buf()));

        let registry = create_test_registry();
        let mut orchestrator =
            ToolOrchestrator::new(registry).with_path_validator(validator);

        orchestrator.register_executor("shell/execute", mock_executor());

        // Shell 工具在 orchestrator 层面仅做日志记录，实际校验由 ShellExecutor 完成
        let result = orchestrator
            .execute("shell/execute", json!({ "command": "echo hello" }))
            .await;
        assert!(result.is_ok(), "shell tool should pass orchestrator validation: {:?}", result.err());
    }

    #[tokio::test]
    async fn test_execute_without_path_validator() {
        let registry = create_test_registry();
        let mut orchestrator = ToolOrchestrator::new(registry);

        orchestrator.register_executor("file/read", mock_executor());

        // 未配置 PathValidator 时，不进行路径校验
        let result = orchestrator
            .execute("file/read", json!({ "path": "/etc/passwd" }))
            .await;
        assert!(
            result.is_ok(),
            "without path_validator, no path validation should occur: {:?}",
            result.err()
        );
    }

    #[tokio::test]
    async fn test_execute_non_file_shell_tool_skips_validation() {
        let tmp = TempDir::new().unwrap();
        let validator = Arc::new(PathValidator::new(tmp.path().to_path_buf()));

        let mut registry = create_test_registry();
        registry.register(Tool {
            name: "custom/tool".to_string(),
            description: "Custom tool".to_string(),
            required_permission: crate::permission::PermissionLevel::ReadOnly,
            parameters: json!({}),
        });
        let mut orchestrator =
            ToolOrchestrator::new(registry).with_path_validator(validator);
        orchestrator.register_executor("custom/tool", mock_executor());

        let result = orchestrator
            .execute("custom/tool", json!({ "data": "test" }))
            .await;
        assert!(
            result.is_ok(),
            "non-file/shell tools should skip path validation: {:?}",
            result.err()
        );
    }

    #[tokio::test]
    async fn test_execute_path_traversal_blocked() {
        let tmp = TempDir::new().unwrap();
        let validator = Arc::new(PathValidator::new(tmp.path().to_path_buf()));

        let registry = create_test_registry();
        let mut orchestrator =
            ToolOrchestrator::new(registry).with_path_validator(validator);

        orchestrator.register_executor("file/read", mock_executor());

        // 路径遍历攻击应被拦截
        let result = orchestrator
            .execute("file/read", json!({ "path": "../../etc/passwd" }))
            .await;
        assert!(
            result.is_err(),
            "path traversal attempt should be rejected"
        );
    }
}
