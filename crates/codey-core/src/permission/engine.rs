//! Permission engine for checking tool access against a 7-level permission model.

use serde::{Deserialize, Serialize};
use std::str::FromStr;

/// Permission levels (7 levels, ordered from least to most privileged).
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Serialize, Deserialize)]
pub enum PermissionLevel {
    /// Read-only access (L1)
    ReadOnly = 1,
    /// File read access (L2)
    FileRead = 2,
    /// File read/write access (L3)
    FileWrite = 3,
    /// Shell read-only commands (L4)
    ShellRead = 4,
    /// Shell read/write commands (L5)
    ShellWrite = 5,
    /// Network access (L6)
    Network = 6,
    /// Full access including hardware (L7)
    FullAccess = 7,
}

/// 从字符串解析权限级别
///
/// 支持与枚举变体名称一致的字符串，例如 "ReadOnly"、"FileRead" 等
impl FromStr for PermissionLevel {
    type Err = String;

    fn from_str(s: &str) -> std::result::Result<Self, Self::Err> {
        match s {
            "ReadOnly" => Ok(PermissionLevel::ReadOnly),
            "FileRead" => Ok(PermissionLevel::FileRead),
            "FileWrite" => Ok(PermissionLevel::FileWrite),
            "ShellRead" => Ok(PermissionLevel::ShellRead),
            "ShellWrite" => Ok(PermissionLevel::ShellWrite),
            "Network" => Ok(PermissionLevel::Network),
            "FullAccess" => Ok(PermissionLevel::FullAccess),
            _ => Err(format!("未知的权限级别: '{}'", s)),
        }
    }
}

/// Result of a permission check.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub enum PermissionResult {
    /// Operation is allowed.
    Allowed,
    /// Operation is denied with a reason.
    Denied(String),
    /// Operation requires user approval.
    NeedApproval,
}

/// Action a rule takes when matched.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum RuleAction {
    Allow,
    Deny,
    RequireApproval,
}

/// A permission rule that matches tool names against a pattern.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PermissionRule {
    /// Pattern to match tool names against. Supports `*` wildcard.
    pub pattern: String,
    /// Action to take when the pattern matches.
    pub action: RuleAction,
    /// Permission level associated with this rule.
    pub level: PermissionLevel,
}

/// Permission engine that checks tool calls against user level and rules.
pub struct PermissionEngine {
    user_level: PermissionLevel,
    rules: Vec<PermissionRule>,
}

impl PermissionEngine {
    /// Create a new permission engine with the given user permission level.
    pub fn new(user_level: PermissionLevel) -> Self {
        Self {
            user_level,
            rules: Vec::new(),
        }
    }

    /// Add a rule to the engine. Rules are checked in insertion order (first match wins).
    pub fn add_rule(&mut self, rule: PermissionRule) {
        self.rules.push(rule);
    }

    /// Check permission for a tool call.
    ///
    /// The check flow is:
    /// 1. Verify user level >= required level (deny if insufficient)
    /// 2. Match rules in order (first match wins)
    /// 3. If no rules match, allow (level check already passed)
    pub fn check(&self, tool_name: &str, required_level: PermissionLevel) -> PermissionResult {
        // Step 1: Level check
        if self.user_level < required_level {
            return PermissionResult::Denied(format!(
                "Insufficient permission: required {:?}, user has {:?}",
                required_level, self.user_level
            ));
        }

        // Step 2: Rule matching (first match wins)
        for rule in &self.rules {
            if self.matches_pattern(tool_name, &rule.pattern) {
                return match rule.action {
                    RuleAction::Allow => PermissionResult::Allowed,
                    RuleAction::Deny => {
                        PermissionResult::Denied(format!("Rule denied: {}", rule.pattern))
                    }
                    RuleAction::RequireApproval => PermissionResult::NeedApproval,
                };
            }
        }

        // Step 3: No rules matched, level check passed -> allow
        PermissionResult::Allowed
    }

    /// Check if a tool name matches a pattern.
    ///
    /// Supports:
    /// - Exact match: `"file/read"` matches `"file/read"`
    /// - Wildcard all: `"*"` matches anything
    /// - Prefix wildcard: `"file/*"` matches `"file/read"`, `"file/write"`, etc.
    pub fn matches_pattern(&self, tool_name: &str, pattern: &str) -> bool {
        if pattern == "*" {
            return true;
        }

        if let Some(prefix) = pattern.strip_suffix('*') {
            return tool_name.starts_with(prefix);
        }

        tool_name == pattern
    }
}
