//! Tests for Permission System - written FIRST (TDD)

use super::engine::{PermissionEngine, PermissionLevel, PermissionResult, PermissionRule, RuleAction};
use super::rules::RuleEngine;
use super::sandbox::PathValidator;
use std::path::PathBuf;
use tempfile::TempDir;

// ============================================================
// PermissionLevel tests
// ============================================================

#[test]
fn permission_level_ordering() {
    assert!(PermissionLevel::ReadOnly < PermissionLevel::FileRead);
    assert!(PermissionLevel::FileRead < PermissionLevel::FileWrite);
    assert!(PermissionLevel::FileWrite < PermissionLevel::ShellRead);
    assert!(PermissionLevel::ShellRead < PermissionLevel::ShellWrite);
    assert!(PermissionLevel::ShellWrite < PermissionLevel::Network);
    assert!(PermissionLevel::Network < PermissionLevel::FullAccess);
}

#[test]
fn permission_level_full_chain() {
    let levels = [
        PermissionLevel::ReadOnly,
        PermissionLevel::FileRead,
        PermissionLevel::FileWrite,
        PermissionLevel::ShellRead,
        PermissionLevel::ShellWrite,
        PermissionLevel::Network,
        PermissionLevel::FullAccess,
    ];

    for i in 0..levels.len() {
        for j in (i + 1)..levels.len() {
            assert!(
                levels[i] < levels[j],
                "levels[{}] ({:?}) should be < levels[{}] ({:?})",
                i, levels[i], j, levels[j]
            );
        }
    }
}

#[test]
fn permission_level_equality() {
    assert_eq!(PermissionLevel::ReadOnly, PermissionLevel::ReadOnly);
    assert_eq!(PermissionLevel::FullAccess, PermissionLevel::FullAccess);
    assert_ne!(PermissionLevel::ReadOnly, PermissionLevel::FullAccess);
}

// ============================================================
// PermissionEngine tests
// ============================================================

#[test]
fn engine_allows_when_level_sufficient() {
    let engine = PermissionEngine::new(PermissionLevel::FileWrite);
    let result = engine.check("file/read", PermissionLevel::FileRead);
    assert!(matches!(result, PermissionResult::Allowed));
}

#[test]
fn engine_denies_when_level_insufficient() {
    let engine = PermissionEngine::new(PermissionLevel::ReadOnly);
    let result = engine.check("file/write", PermissionLevel::FileWrite);
    assert!(matches!(result, PermissionResult::Denied(_)));
}

#[test]
fn engine_denies_message_includes_levels() {
    let engine = PermissionEngine::new(PermissionLevel::ReadOnly);
    let result = engine.check("file/write", PermissionLevel::FileWrite);
    match result {
        PermissionResult::Denied(msg) => {
            assert!(msg.contains("ReadOnly"), "msg should mention user level: {}", msg);
            assert!(msg.contains("FileWrite"), "msg should mention required level: {}", msg);
        }
        _ => panic!("Expected Denied result"),
    }
}

#[test]
fn engine_allows_exact_level_match() {
    let engine = PermissionEngine::new(PermissionLevel::ShellRead);
    let result = engine.check("shell/read", PermissionLevel::ShellRead);
    assert!(matches!(result, PermissionResult::Allowed));
}

#[test]
fn engine_rule_deny_overrides_allow() {
    let mut engine = PermissionEngine::new(PermissionLevel::FullAccess);
    engine.add_rule(PermissionRule {
        pattern: "dangerous_tool".to_string(),
        action: RuleAction::Deny,
        level: PermissionLevel::FullAccess,
    });

    let result = engine.check("dangerous_tool", PermissionLevel::ReadOnly);
    assert!(matches!(result, PermissionResult::Denied(_)));
}

#[test]
fn engine_rule_require_approval() {
    let mut engine = PermissionEngine::new(PermissionLevel::FullAccess);
    engine.add_rule(PermissionRule {
        pattern: "sensitive_tool".to_string(),
        action: RuleAction::RequireApproval,
        level: PermissionLevel::FullAccess,
    });

    let result = engine.check("sensitive_tool", PermissionLevel::ReadOnly);
    assert!(matches!(result, PermissionResult::NeedApproval));
}

#[test]
fn engine_rule_allow_pattern_wildcard() {
    let mut engine = PermissionEngine::new(PermissionLevel::FullAccess);
    engine.add_rule(PermissionRule {
        pattern: "file_*".to_string(),
        action: RuleAction::Allow,
        level: PermissionLevel::FullAccess,
    });

    let result = engine.check("file_read", PermissionLevel::ReadOnly);
    assert!(matches!(result, PermissionResult::Allowed));
}

#[test]
fn engine_rule_deny_wildcard_all() {
    let mut engine = PermissionEngine::new(PermissionLevel::FullAccess);
    engine.add_rule(PermissionRule {
        pattern: "*".to_string(),
        action: RuleAction::Deny,
        level: PermissionLevel::FullAccess,
    });

    let result = engine.check("anything", PermissionLevel::ReadOnly);
    assert!(matches!(result, PermissionResult::Denied(_)));
}

#[test]
fn engine_rule_first_match_wins() {
    let mut engine = PermissionEngine::new(PermissionLevel::FullAccess);
    engine.add_rule(PermissionRule {
        pattern: "tool_*".to_string(),
        action: RuleAction::Allow,
        level: PermissionLevel::FullAccess,
    });
    engine.add_rule(PermissionRule {
        pattern: "tool_*".to_string(),
        action: RuleAction::Deny,
        level: PermissionLevel::FullAccess,
    });

    // First rule wins
    let result = engine.check("tool_x", PermissionLevel::ReadOnly);
    assert!(matches!(result, PermissionResult::Allowed));
}

#[test]
fn engine_insufficient_level_even_with_allow_rule() {
    let mut engine = PermissionEngine::new(PermissionLevel::ReadOnly);
    engine.add_rule(PermissionRule {
        pattern: "write_tool".to_string(),
        action: RuleAction::Allow,
        level: PermissionLevel::FullAccess,
    });

    // Level check happens before rule check
    let result = engine.check("write_tool", PermissionLevel::FileWrite);
    assert!(matches!(result, PermissionResult::Denied(_)));
}

// ============================================================
// Pattern matching tests
// ============================================================

#[test]
fn pattern_exact_match() {
    let engine = PermissionEngine::new(PermissionLevel::FullAccess);
    assert!(engine.matches_pattern("file/read", "file/read"));
    assert!(!engine.matches_pattern("file/read", "file/write"));
}

#[test]
fn pattern_wildcard_all() {
    let engine = PermissionEngine::new(PermissionLevel::FullAccess);
    assert!(engine.matches_pattern("anything", "*"));
    assert!(engine.matches_pattern("", "*"));
}

#[test]
fn pattern_prefix_wildcard() {
    let engine = PermissionEngine::new(PermissionLevel::FullAccess);
    assert!(engine.matches_pattern("file/read", "file/*"));
    assert!(engine.matches_pattern("file/write", "file/*"));
    assert!(!engine.matches_pattern("shell/exec", "file/*"));
}

#[test]
fn pattern_no_match_different_prefix() {
    let engine = PermissionEngine::new(PermissionLevel::FullAccess);
    assert!(!engine.matches_pattern("network/http", "file/*"));
}

// ============================================================
// RuleEngine tests
// ============================================================

#[test]
fn rule_engine_parse_allow_rules() {
    let mut rule_engine = RuleEngine::new();
    rule_engine.parse_rules("file/* allow").unwrap();

    let rules = rule_engine.rules();
    assert_eq!(rules.len(), 1);
    assert_eq!(rules[0].pattern, "file/*");
    assert!(matches!(rules[0].action, RuleAction::Allow));
}

#[test]
fn rule_engine_parse_deny_rules() {
    let mut rule_engine = RuleEngine::new();
    rule_engine.parse_rules("dangerous deny").unwrap();

    let rules = rule_engine.rules();
    assert_eq!(rules.len(), 1);
    assert_eq!(rules[0].pattern, "dangerous");
    assert!(matches!(rules[0].action, RuleAction::Deny));
}

#[test]
fn rule_engine_parse_require_approval() {
    let mut rule_engine = RuleEngine::new();
    rule_engine.parse_rules("sensitive require_approval").unwrap();

    let rules = rule_engine.rules();
    assert_eq!(rules.len(), 1);
    assert!(matches!(rules[0].action, RuleAction::RequireApproval));
}

#[test]
fn rule_engine_skips_comments() {
    let mut rule_engine = RuleEngine::new();
    rule_engine.parse_rules("# this is a comment\nfile/* allow").unwrap();

    let rules = rule_engine.rules();
    assert_eq!(rules.len(), 1);
}

#[test]
fn rule_engine_skips_empty_lines() {
    let mut rule_engine = RuleEngine::new();
    rule_engine.parse_rules("\n\nfile/* allow\n\n").unwrap();

    let rules = rule_engine.rules();
    assert_eq!(rules.len(), 1);
}

#[test]
fn rule_engine_multiple_rules() {
    let mut rule_engine = RuleEngine::new();
    rule_engine
        .parse_rules("file/* allow\nshell/* deny\nnet/* require_approval")
        .unwrap();

    let rules = rule_engine.rules();
    assert_eq!(rules.len(), 3);
}

#[test]
fn rule_engine_skips_unknown_actions() {
    let mut rule_engine = RuleEngine::new();
    rule_engine
        .parse_rules("file/* unknown_action\nshell/* allow")
        .unwrap();

    let rules = rule_engine.rules();
    assert_eq!(rules.len(), 1);
    assert_eq!(rules[0].pattern, "shell/*");
}

#[test]
fn rule_engine_load_from_file() {
    let tmp = TempDir::new().unwrap();
    let rules_file = tmp.path().join("test.rules");
    std::fs::write(&rules_file, "# test rules\nfile/* allow\nshell/* deny\n").unwrap();

    let mut rule_engine = RuleEngine::new();
    rule_engine.load_from_file(&rules_file).unwrap();

    let rules = rule_engine.rules();
    assert_eq!(rules.len(), 2);
}

#[test]
fn rule_engine_load_nonexistent_file() {
    let mut rule_engine = RuleEngine::new();
    let result = rule_engine.load_from_file(PathBuf::from("/nonexistent/path.rules").as_path());
    assert!(result.is_err());
}

// ============================================================
// PathValidator tests
// ============================================================

#[test]
fn sandbox_path_under_working_dir_is_allowed() {
    let tmp = TempDir::new().unwrap();
    let sandbox = PathValidator::new(tmp.path().to_path_buf());

    let path = tmp.path().join("src/main.rs");
    assert!(sandbox.is_path_allowed(&path));
}

#[test]
fn sandbox_path_outside_working_dir_is_denied() {
    let tmp = TempDir::new().unwrap();
    let sandbox = PathValidator::new(tmp.path().to_path_buf());

    assert!(!sandbox.is_path_allowed(PathBuf::from("/etc/passwd").as_path()));
}

#[test]
fn sandbox_allowed_path_override() {
    let tmp = TempDir::new().unwrap();
    let mut sandbox = PathValidator::new(tmp.path().to_path_buf());
    sandbox.allow_path(PathBuf::from("/tmp/shared"));

    assert!(sandbox.is_path_allowed(PathBuf::from("/tmp/shared/data.txt").as_path()));
}

#[test]
fn sandbox_denied_path_override() {
    let tmp = TempDir::new().unwrap();
    let mut sandbox = PathValidator::new(tmp.path().to_path_buf());
    sandbox.deny_path(tmp.path().join("secrets"));

    assert!(!sandbox.is_path_allowed(tmp.path().join("secrets/key.pem").as_path()));
}

#[test]
fn sandbox_denied_takes_precedence_over_allowed() {
    let tmp = TempDir::new().unwrap();
    let mut sandbox = PathValidator::new(tmp.path().to_path_buf());
    let sensitive = tmp.path().join("sensitive");
    sandbox.allow_path(tmp.path().to_path_buf());
    sandbox.deny_path(sensitive.clone());

    assert!(!sandbox.is_path_allowed(sensitive.join("data.txt").as_path()));
}

#[test]
fn sandbox_resolve_relative_path() {
    let tmp = TempDir::new().unwrap();
    let sandbox = PathValidator::new(tmp.path().to_path_buf());

    let resolved = sandbox.resolve_path("src/main.rs").unwrap();
    assert_eq!(resolved, tmp.path().join("src/main.rs"));
}

#[test]
fn sandbox_resolve_absolute_path_allowed() {
    let tmp = TempDir::new().unwrap();
    let sandbox = PathValidator::new(tmp.path().to_path_buf());

    let target = tmp.path().join("src/main.rs");
    let resolved = sandbox.resolve_path(target.to_str().unwrap()).unwrap();
    assert_eq!(resolved, target);
}

#[test]
fn sandbox_resolve_absolute_path_denied() {
    let tmp = TempDir::new().unwrap();
    let sandbox = PathValidator::new(tmp.path().to_path_buf());

    let result = sandbox.resolve_path("/etc/passwd");
    assert!(result.is_err());
}

#[test]
fn sandbox_resolve_relative_path_outside_denied() {
    let tmp = TempDir::new().unwrap();
    let sandbox = PathValidator::new(tmp.path().to_path_buf());

    let result = sandbox.resolve_path("/etc/shadow");
    assert!(result.is_err());
}
