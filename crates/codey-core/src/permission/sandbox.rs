//! Sandbox manager for enforcing file system restrictions.

use anyhow::Result;
use std::path::{Component, Path, PathBuf};

/// Sandbox manager that enforces file system path restrictions.
///
/// Paths are checked against allowed/denied lists. Denied paths take
/// precedence over allowed paths. Paths under the working directory
/// are allowed by default.
pub struct SandboxManager {
    working_directory: PathBuf,
    allowed_paths: Vec<PathBuf>,
    denied_paths: Vec<PathBuf>,
}

impl SandboxManager {
    /// Create a new sandbox manager with the given working directory.
    pub fn new(working_directory: PathBuf) -> Self {
        Self {
            working_directory,
            allowed_paths: Vec::new(),
            denied_paths: Vec::new(),
        }
    }

    /// Add a path prefix that is always allowed.
    pub fn allow_path(&mut self, path: PathBuf) {
        self.allowed_paths.push(path);
    }

    /// Add a path prefix that is always denied (takes precedence over allowed).
    pub fn deny_path(&mut self, path: PathBuf) {
        self.denied_paths.push(path);
    }

    /// Check if a path is allowed by the sandbox.
    ///
    /// Logic:
    /// 1. Denied paths are checked first (deny wins)
    /// 2. Allowed paths are checked next
    /// 3. Default: path must be under working directory
    pub fn is_path_allowed(&self, path: &Path) -> bool {
        let normalized_path = normalize_path(path);

        // Check denied paths first (highest priority)
        for denied in &self.denied_paths {
            let normalized_denied = normalize_path(denied);
            if normalized_path.starts_with(&normalized_denied) {
                return false;
            }
        }

        // Check allowed paths
        for allowed in &self.allowed_paths {
            let normalized_allowed = normalize_path(allowed);
            if normalized_path.starts_with(&normalized_allowed) {
                return true;
            }
        }

        // Default: path must be under working directory
        let normalized_working = normalize_path(&self.working_directory);
        normalized_path.starts_with(&normalized_working)
    }

    /// Resolve a path string to an absolute PathBuf, checking sandbox permissions.
    ///
    /// Relative paths are resolved against the working directory.
    /// Returns an error if the resolved path is not allowed.
    pub fn resolve_path(&self, path: &str) -> Result<PathBuf> {
        let path = Path::new(path);

        let resolved = if path.is_absolute() {
            path.to_path_buf()
        } else {
            self.working_directory.join(path)
        };

        if self.is_path_allowed(&resolved) {
            Ok(resolved)
        } else {
            anyhow::bail!("Path not allowed: {}", resolved.display())
        }
    }
}

/// 规范化路径，移除 `.` 和 `..` 组件，防止路径遍历攻击。
///
/// 不依赖文件系统（不要求路径存在），仅处理路径组件。
fn normalize_path(path: &Path) -> PathBuf {
    let mut components = Vec::new();
    for component in path.components() {
        match component {
            Component::CurDir => {}       // 跳过 "."
            Component::ParentDir => {     // 处理 ".."
                // 仅在有可弹出的普通组件时弹出（保留根目录前缀）
                let last = components.last();
                match last {
                    Some(Component::Normal(_)) => {
                        components.pop();
                    }
                    _ => {} // 根目录或空时忽略 ".."
                }
            }
            other => components.push(other),
        }
    }
    components.iter().collect()
}
