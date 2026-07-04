//! File handler - implements file/read, file/write, file/edit, file/search, file/list.

#[cfg(test)]
pub mod tests;

use anyhow::Result;
use serde_json::{json, Value};
use std::path::{Path, PathBuf};

use crate::protocol::{ErrorObject, Response, TEXT_NOT_FOUND};

/// File handler implementation for JSON-RPC file methods.
pub struct FileHandler {
    working_directory: PathBuf,
}

impl FileHandler {
    /// Create a new FileHandler rooted at the given working directory.
    pub fn new(working_directory: PathBuf) -> Self {
        Self { working_directory }
    }

    /// Resolve a path relative to the working directory and validate it stays within bounds.
    ///
    /// - Rejects absolute paths that resolve outside the working directory.
    /// - Canonicalizes the path and verifies the result is under the working directory.
    /// - Blocks symlink traversal escapes.
    fn resolve_path(&self, path: &str) -> Result<PathBuf> {
        let path = Path::new(path);

        // Reject absolute paths that try to escape working directory
        if path.is_absolute() {
            let canonical_wd = self
                .working_directory
                .canonicalize()
                .unwrap_or_else(|_| self.working_directory.clone());

            let canonical_path = path.canonicalize().unwrap_or_else(|_| path.to_path_buf());

            if !canonical_path.starts_with(&canonical_wd) {
                anyhow::bail!(
                    "Absolute path '{}' resolves outside working directory. Access denied.",
                    path.display()
                );
            }
            return Ok(canonical_path);
        }

        // For relative paths, join with working directory
        let candidate = self.working_directory.join(path);

        // Normalize the path (resolve `.` and `..`) without requiring the file to exist.
        let normalized = normalize_path(&candidate);

        // If the file exists, canonicalize it to resolve symlinks.
        if normalized.exists() {
            let canonical = normalized.canonicalize().map_err(|e| {
                anyhow::anyhow!("Failed to resolve path '{}': {}", path.display(), e)
            })?;

            // Verify the resolved path is under the working directory.
            let canonical_wd = self
                .working_directory
                .canonicalize()
                .unwrap_or_else(|_| self.working_directory.clone());

            if !canonical.starts_with(&canonical_wd) {
                anyhow::bail!(
                    "Path '{}' resolves outside working directory. Access denied.",
                    path.display()
                );
            }

            return Ok(canonical);
        }

        // For new files, use the normalized path directly.
        // The path is already relative to working directory, so it's safe.
        Ok(normalized)
    }

    /// Build a successful JSON-RPC response with the given result value.
    fn success_response(id: Value, result: Value) -> Response {
        Response {
            jsonrpc: "2.0".to_string(),
            id,
            result: Some(result),
            error: None,
        }
    }

    /// Build an error JSON-RPC response with the given error object.
    fn error_response(id: Value, error: ErrorObject) -> Response {
        Response {
            jsonrpc: "2.0".to_string(),
            id,
            result: None,
            error: Some(error),
        }
    }

    // ---------------------------------------------------------------
    // file/read - Read file contents (supports offset/limit pagination)
    // ---------------------------------------------------------------
    pub async fn read(&self, id: Value, params: Value) -> Result<Response> {
        let path = params
            .get("path")
            .and_then(|v| v.as_str())
            .ok_or_else(|| anyhow::anyhow!("Missing path parameter"))?;

        let resolved = self.resolve_path(path)?;
        tracing::debug!(path = %resolved.display(), "Reading file");
        let content = tokio::fs::read_to_string(&resolved).await?;

        let offset = params
            .get("offset")
            .and_then(|v| v.as_u64())
            .unwrap_or(0);
        let limit = params.get("limit").and_then(|v| v.as_u64());

        let lines: Vec<&str> = content.lines().collect();
        let start = offset as usize;

        // H1 fix: bounds check to prevent panic when offset exceeds file length.
        if start >= lines.len() {
            return Ok(Self::success_response(
                id,
                json!({
                    "content": "",
                    "total_lines": lines.len(),
                    "offset": start,
                    "limit": 0
                }),
            ));
        }

        let end = limit
            .map(|l| (start + l as usize).min(lines.len()))
            .unwrap_or(lines.len());

        let slice = &lines[start..end];

        Ok(Self::success_response(
            id,
            json!({
                "content": slice.join("\n"),
                "total_lines": lines.len(),
                "offset": start,
                "limit": end - start
            }),
        ))
    }

    // ---------------------------------------------------------------
    // file/write - Write file contents (create or overwrite)
    // ---------------------------------------------------------------
    pub async fn write(&self, id: Value, params: Value) -> Result<Response> {
        let path = params
            .get("path")
            .and_then(|v| v.as_str())
            .ok_or_else(|| anyhow::anyhow!("Missing path parameter"))?;

        let content = params
            .get("content")
            .and_then(|v| v.as_str())
            .ok_or_else(|| anyhow::anyhow!("Missing content parameter"))?;

        let resolved = self.resolve_path(path)?;

        // Create parent directories if needed
        if let Some(parent) = resolved.parent() {
            tokio::fs::create_dir_all(parent).await?;
        }

        tracing::debug!(path = %resolved.display(), len = content.len(), "Writing file");
        tokio::fs::write(&resolved, content).await?;

        Ok(Self::success_response(
            id,
            json!({
                "success": true,
                "path": path
            }),
        ))
    }

    // ---------------------------------------------------------------
    // file/edit - Incremental edit (local replacement)
    // ---------------------------------------------------------------
    pub async fn edit(&self, id: Value, params: Value) -> Result<Response> {
        let path = params
            .get("path")
            .and_then(|v| v.as_str())
            .ok_or_else(|| anyhow::anyhow!("Missing path parameter"))?;

        let old_text = params
            .get("old_text")
            .and_then(|v| v.as_str())
            .ok_or_else(|| anyhow::anyhow!("Missing old_text parameter"))?;

        let new_text = params
            .get("new_text")
            .and_then(|v| v.as_str())
            .ok_or_else(|| anyhow::anyhow!("Missing new_text parameter"))?;

        // M2: Optional max_replacements parameter (default: replace all).
        let max_replacements = params
            .get("max_replacements")
            .and_then(|v| v.as_u64())
            .map(|n| n as usize);

        let resolved = self.resolve_path(path)?;
        tracing::debug!(path = %resolved.display(), "Editing file");
        let content = tokio::fs::read_to_string(&resolved).await?;

        if !content.contains(old_text) {
            return Ok(Self::error_response(
                id,
                ErrorObject {
                    code: TEXT_NOT_FOUND,
                    message: "old_text not found in file".to_string(),
                    data: None,
                },
            ));
        }

        let total_count = content.matches(old_text).count();

        let new_content = match max_replacements {
            Some(max) if max < total_count => {
                // Replace only the first `max` occurrences.
                let mut result = String::with_capacity(content.len());
                let mut remaining = content.as_str();
                let mut replaced = 0;
                while replaced < max {
                    if let Some(pos) = remaining.find(old_text) {
                        result.push_str(&remaining[..pos]);
                        result.push_str(new_text);
                        remaining = &remaining[pos + old_text.len()..];
                        replaced += 1;
                    } else {
                        break;
                    }
                }
                result.push_str(remaining);
                result
            }
            _ => content.replace(old_text, new_text),
        };

        let replacements = match max_replacements {
            Some(max) => max.min(total_count),
            None => total_count,
        };

        tokio::fs::write(&resolved, &new_content).await?;

        Ok(Self::success_response(
            id,
            json!({
                "success": true,
                "path": path,
                "replacements": replacements
            }),
        ))
    }

    // ---------------------------------------------------------------
    // file/search - Search file contents for a query string
    // ---------------------------------------------------------------
    pub async fn search(&self, id: Value, params: Value) -> Result<Response> {
        let query = params
            .get("query")
            .and_then(|v| v.as_str())
            .ok_or_else(|| anyhow::anyhow!("Missing query parameter"))?;

        // M1: Make path required instead of defaulting to "." (a directory).
        let path = params
            .get("path")
            .and_then(|v| v.as_str())
            .ok_or_else(|| anyhow::anyhow!("Missing required parameter: path"))?;

        let resolved = self.resolve_path(path)?;
        tracing::debug!(path = %resolved.display(), query = query, "Searching file");
        let content = tokio::fs::read_to_string(&resolved).await?;

        let matches: Vec<Value> = content
            .lines()
            .enumerate()
            .filter(|(_, line)| line.contains(query))
            .map(|(i, line)| {
                json!({
                    "line": i + 1,
                    "content": line
                })
            })
            .collect();

        Ok(Self::success_response(
            id,
            json!({
                "matches": matches,
                "total": matches.len()
            }),
        ))
    }

    // ---------------------------------------------------------------
    // file/list - List directory contents
    // ---------------------------------------------------------------
    pub async fn list(&self, id: Value, params: Value) -> Result<Response> {
        let path = params.get("path").and_then(|v| v.as_str()).unwrap_or(".");

        let resolved = self.resolve_path(path)?;
        tracing::debug!(path = %resolved.display(), "Listing directory");
        let mut entries = Vec::new();

        let mut dir = tokio::fs::read_dir(&resolved).await?;
        while let Some(entry) = dir.next_entry().await? {
            let metadata = entry.metadata().await?;
            entries.push(json!({
                "name": entry.file_name().to_string_lossy(),
                "type": if metadata.is_dir() { "directory" } else { "file" },
                "size": metadata.len()
            }));
        }

        Ok(Self::success_response(
            id,
            json!({
                "entries": entries,
                "path": path
            }),
        ))
    }
}

/// Normalize a path by resolving `.` and `..` components without touching the filesystem.
fn normalize_path(path: &Path) -> PathBuf {
    let mut components = Vec::new();
    for component in path.components() {
        match component {
            std::path::Component::ParentDir => {
                components.pop();
            }
            std::path::Component::CurDir => { /* skip */ }
            other => components.push(other),
        }
    }
    components.iter().collect()
}

/// Walk up the directory tree from `path` to find the nearest existing ancestor,
/// canonicalize it, then append the remaining non-existent components.
fn find_canonical_base(path: &Path) -> Option<PathBuf> {
    let mut current = path.to_path_buf();
    let mut tail = Vec::new();

    loop {
        if current.exists() {
            let canonical = current.canonicalize().ok()?;
            if tail.is_empty() {
                return Some(canonical);
            }
            let mut result = canonical;
            for component in tail.into_iter().rev() {
                result = result.join(component);
            }
            return Some(result);
        }

        let file_name = current.file_name()?.to_os_string();
        tail.push(file_name);
        current = current.parent()?.to_path_buf();
    }
}
