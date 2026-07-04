//! Rule engine that loads and parses permission rules from files.

use anyhow::Result;
use std::path::Path;

use super::engine::{PermissionLevel, PermissionRule, RuleAction};

/// Rule engine that loads and parses rules from `.rules` files.
///
/// Rule file format (one rule per line):
/// ```text
/// # comment
/// <pattern> <action>
/// ```
/// Where action is one of: `allow`, `deny`, `require_approval`
pub struct RuleEngine {
    rules: Vec<PermissionRule>,
}

impl RuleEngine {
    /// Create a new empty rule engine.
    pub fn new() -> Self {
        Self { rules: Vec::new() }
    }

    /// Load rules from a file.
    pub fn load_from_file(&mut self, path: &Path) -> Result<()> {
        let content = std::fs::read_to_string(path)?;
        self.parse_rules(&content)?;
        Ok(())
    }

    /// Parse rules from text content.
    ///
    /// Each non-empty, non-comment line is parsed as `<pattern> <action>`.
    pub fn parse_rules(&mut self, content: &str) -> Result<()> {
        for line in content.lines() {
            let line = line.trim();

            // Skip empty lines and comments
            if line.is_empty() || line.starts_with('#') {
                continue;
            }

            // Parse rule: <pattern> <action>
            let parts: Vec<&str> = line.split_whitespace().collect();
            if parts.len() >= 2 {
                let pattern = parts[0].to_string();
                let action = match parts[1] {
                    "allow" => RuleAction::Allow,
                    "deny" => RuleAction::Deny,
                    "require_approval" => RuleAction::RequireApproval,
                    _ => continue, // Skip unknown actions
                };

                self.rules.push(PermissionRule {
                    pattern,
                    action,
                    level: PermissionLevel::ReadOnly, // Default level
                });
            }
        }

        Ok(())
    }

    /// Get all loaded rules.
    pub fn rules(&self) -> &[PermissionRule] {
        &self.rules
    }
}
