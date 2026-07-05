//! FileExecutor - 文件读写执行器，集成 PathValidator 进行路径校验。

use anyhow::Result;
use serde_json::{json, Value};
use std::sync::Arc;

use crate::permission::PathValidator;

/// 文件执行器，提供受沙箱保护的文件读写能力。
///
/// 所有路径操作都通过 `PathValidator` 进行校验，
/// 确保只能访问工作目录范围内的文件。
pub struct FileExecutor {
    path_validator: Arc<PathValidator>,
}

impl FileExecutor {
    /// 创建新的 FileExecutor 实例。
    pub fn new(path_validator: Arc<PathValidator>) -> Self {
        Self { path_validator }
    }

    /// 读取文件内容。
    ///
    /// # 参数
    /// - `path`: 文件路径（相对或绝对）
    ///
    /// # 返回
    /// JSON 对象包含文件内容和字节数：
    /// ```json
    /// { "content": "...", "bytes": 1234 }
    /// ```
    ///
    /// # 错误
    /// - 路径被 PathValidator 拒绝
    /// - 文件不存在或无法读取
    pub async fn read(&self, path: &str) -> Result<Value> {
        let resolved = self.path_validator.resolve_path(path)?;

        tracing::debug!(path = %resolved.display(), "FileExecutor: reading file");
        let content = tokio::fs::read_to_string(&resolved).await?;

        Ok(json!({
            "content": content,
            "bytes": content.len()
        }))
    }

    /// 写入文件内容（创建或覆盖）。
    ///
    /// # 参数
    /// - `path`: 目标文件路径（相对或绝对）
    /// - `content`: 要写入的内容
    ///
    /// # 返回
    /// JSON 对象表示写入成功：
    /// ```json
    /// { "success": true, "path": "..." }
    /// ```
    ///
    /// # 错误
    /// - 路径被 PathValidator 拒绝
    /// - 无法创建目录或写入文件
    pub async fn write(&self, path: &str, content: &str) -> Result<Value> {
        let resolved = self.path_validator.resolve_path(path)?;

        // 创建父目录（如果不存在）
        if let Some(parent) = resolved.parent() {
            tokio::fs::create_dir_all(parent).await?;
        }

        tracing::debug!(path = %resolved.display(), len = content.len(), "FileExecutor: writing file");
        tokio::fs::write(&resolved, content).await?;

        Ok(json!({
            "success": true,
            "path": path
        }))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    /// 创建测试用的 FileExecutor，工作目录为临时目录。
    fn setup() -> (FileExecutor, TempDir) {
        let tmp = TempDir::new().expect("failed to create temp dir");
        let validator = PathValidator::new(tmp.path().to_path_buf());
        let executor = FileExecutor::new(Arc::new(validator));
        (executor, tmp)
    }

    #[tokio::test]
    async fn test_file_executor_read_existing() {
        let (executor, tmp) = setup();

        // 先写入测试文件
        let file_path = tmp.path().join("test.txt");
        tokio::fs::write(&file_path, "hello world")
            .await
            .expect("failed to write test file");

        // 通过 executor 读取
        let result = executor
            .read("test.txt")
            .await
            .expect("read should succeed");

        assert_eq!(result["content"], "hello world");
        assert_eq!(result["bytes"], 11);
    }

    #[tokio::test]
    async fn test_file_executor_write_new_file() {
        let (executor, tmp) = setup();

        let result = executor
            .write("output.txt", "new content")
            .await
            .expect("write should succeed");

        assert_eq!(result["success"], true);
        assert_eq!(result["path"], "output.txt");

        // 验证文件实际被写入
        let actual = tokio::fs::read_to_string(tmp.path().join("output.txt"))
            .await
            .expect("file should exist");
        assert_eq!(actual, "new content");
    }

    #[tokio::test]
    async fn test_file_executor_read_path_denied() {
        let (executor, _tmp) = setup();

        // 尝试读取工作目录外的路径
        let result = executor.read("/etc/passwd").await;
        assert!(result.is_err(), "should reject path outside working directory");
    }

    #[tokio::test]
    async fn test_file_executor_write_creates_nested_dirs() {
        let (executor, tmp) = setup();

        let result = executor
            .write("a/b/c/deep.txt", "nested")
            .await
            .expect("write should succeed");

        assert_eq!(result["success"], true);

        // 验证嵌套目录和文件被创建
        let actual = tokio::fs::read_to_string(tmp.path().join("a/b/c/deep.txt"))
            .await
            .expect("nested file should exist");
        assert_eq!(actual, "nested");
    }

    #[tokio::test]
    async fn test_file_executor_write_overwrites_existing() {
        let (executor, tmp) = setup();

        // 写入初始内容
        let file_path = tmp.path().join("overwrite.txt");
        tokio::fs::write(&file_path, "old")
            .await
            .expect("failed to write initial content");

        // 覆盖写入
        executor
            .write("overwrite.txt", "new")
            .await
            .expect("overwrite should succeed");

        let actual = tokio::fs::read_to_string(&file_path)
            .await
            .expect("file should exist");
        assert_eq!(actual, "new");
    }

    #[tokio::test]
    async fn test_file_executor_read_nonexistent() {
        let (executor, _tmp) = setup();

        let result = executor.read("no_such_file.txt").await;
        assert!(result.is_err(), "should error on nonexistent file");
    }
}
