# Phase 2.3 沙箱系统测试计划

> 日期：2026-07-05
> 版本：v1.0.0

## 1. 测试策略

### 1.1 测试目标

- 验证沙箱系统的核心功能
- 验证平台特定实现的正确性
- 验证安全隔离的有效性
- 验证性能要求 (< 500ms 创建时间)

### 1.2 测试类型

| 类型 | 说明 | 工具 |
|------|------|------|
| 单元测试 | 测试单个函数/模块 | cargo test |
| 集成测试 | 测试模块间交互 | cargo test --test |
| 安全测试 | 测试沙箱逃逸防护 | 手动测试 |
| 性能测试 | 测试创建/执行时间 | cargo bench |

---

## 2. 单元测试

### 2.1 配置解析测试

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_sandbox_config_serialization() {
        let config = SandboxConfig {
            working_dir: PathBuf::from("/tmp/test"),
            allowed_paths: vec![PathBuf::from("src")],
            denied_paths: vec![PathBuf::from(".env")],
            network: NetworkPolicy {
                allow_outbound: true,
                allowed_domains: vec!["api.openai.com".to_string()],
                blocked_ports: vec![22],
            },
            limits: ResourceLimits {
                max_memory_mb: 512,
                max_cpu_cores: 1.0,
                max_processes: 100,
                timeout_secs: 300,
            },
        };

        let json = serde_json::to_string(&config).unwrap();
        let parsed: SandboxConfig = serde_json::from_str(&json).unwrap();
        assert_eq!(config.working_dir, parsed.working_dir);
    }

    #[test]
    fn test_network_policy_default() {
        let policy = NetworkPolicy {
            allow_outbound: true,
            allowed_domains: vec![],
            blocked_ports: vec![],
        };
        assert!(policy.allow_outbound);
        assert!(policy.allowed_domains.is_empty());
    }

    #[test]
    fn test_resource_limits_validation() {
        let limits = ResourceLimits {
            max_memory_mb: 512,
            max_cpu_cores: 1.0,
            max_processes: 100,
            timeout_secs: 300,
        };
        assert!(limits.max_memory_mb > 0);
        assert!(limits.max_cpu_cores > 0.0);
        assert!(limits.max_processes > 0);
        assert!(limits.timeout_secs > 0);
    }
}
```

### 2.2 路径验证测试

```rust
#[cfg(test)]
mod path_tests {
    use super::*;

    #[test]
    fn test_path_allowed() {
        let config = create_test_config();
        let path = PathBuf::from("src/main.rs");
        assert!(is_path_allowed(&config, &path));
    }

    #[test]
    fn test_path_denied() {
        let config = create_test_config();
        let path = PathBuf::from(".env");
        assert!(!is_path_allowed(&config, &path));
    }

    #[test]
    fn test_path_outside_working_dir() {
        let config = create_test_config();
        let path = PathBuf::from("/etc/passwd");
        assert!(!is_path_allowed(&config, &path));
    }

    #[test]
    fn test_path_traversal_attack() {
        let config = create_test_config();
        let path = PathBuf::from("src/../../../etc/passwd");
        assert!(!is_path_allowed(&config, &path));
    }
}
```

### 2.3 网络策略测试

```rust
#[cfg(test)]
mod network_tests {
    use super::*;

    #[test]
    fn test_domain_allowed() {
        let policy = create_test_network_policy();
        assert!(is_domain_allowed(&policy, "api.openai.com"));
    }

    #[test]
    fn test_domain_blocked() {
        let policy = create_test_network_policy();
        assert!(!is_domain_allowed(&policy, "malicious.com"));
    }

    #[test]
    fn test_port_blocked() {
        let policy = create_test_network_policy();
        assert!(is_port_blocked(&policy, 22));
    }

    #[test]
    fn test_port_allowed() {
        let policy = create_test_network_policy();
        assert!(!is_port_blocked(&policy, 443));
    }
}
```

---

## 3. 集成测试

### 3.1 沙箱生命周期测试

```rust
#[cfg(test)]
mod lifecycle_tests {
    use super::*;

    #[tokio::test]
    async fn test_sandbox_create_and_destroy() {
        let manager = create_sandbox_manager();
        let config = create_test_config();

        let sandbox = manager.create(&config).await.unwrap();
        assert_eq!(sandbox.status(), SandboxStatus::Running);

        manager.destroy(&sandbox).await.unwrap();
        assert_eq!(sandbox.status(), SandboxStatus::Stopped);
    }

    #[tokio::test]
    async fn test_sandbox_execute_command() {
        let manager = create_sandbox_manager();
        let config = create_test_config();

        let sandbox = manager.create(&config).await.unwrap();
        let output = manager.execute(&sandbox, "echo", &["hello".to_string()]).await.unwrap();

        assert_eq!(output.exit_code, 0);
        assert_eq!(output.stdout.trim(), "hello");

        manager.destroy(&sandbox).await.unwrap();
    }

    #[tokio::test]
    async fn test_sandbox_timeout() {
        let manager = create_sandbox_manager();
        let config = SandboxConfig {
            limits: ResourceLimits {
                timeout_secs: 1,
                ..create_test_config().limits
            },
            ..create_test_config()
        };

        let sandbox = manager.create(&config).await.unwrap();
        let result = manager.execute(&sandbox, "sleep", &["10".to_string()]).await;

        assert!(matches!(result, Err(SandboxError::Timeout(1))));

        manager.destroy(&sandbox).await.unwrap();
    }
}
```

### 3.2 安全隔离测试

```rust
#[cfg(test)]
mod security_tests {
    use super::*;

    #[tokio::test]
    async fn test_file_access_restricted() {
        let manager = create_sandbox_manager();
        let config = create_test_config();

        let sandbox = manager.create(&config).await.unwrap();

        // 尝试访问禁止的文件
        let result = manager.execute(&sandbox, "cat", &[".env".to_string()]).await;
        assert!(result.is_err());

        manager.destroy(&sandbox).await.unwrap();
    }

    #[tokio::test]
    async fn test_network_access_restricted() {
        let manager = create_sandbox_manager();
        let config = SandboxConfig {
            network: NetworkPolicy {
                allow_outbound: false,
                ..create_test_config().network
            },
            ..create_test_config()
        };

        let sandbox = manager.create(&config).await.unwrap();

        // 尝试网络访问
        let result = manager.execute(&sandbox, "curl", &["https://example.com".to_string()]).await;
        assert!(result.is_err());

        manager.destroy(&sandbox).await.unwrap();
    }

    #[tokio::test]
    async fn test_process_limit() {
        let manager = create_sandbox_manager();
        let config = SandboxConfig {
            limits: ResourceLimits {
                max_processes: 2,
                ..create_test_config().limits
            },
            ..create_test_config()
        };

        let sandbox = manager.create(&config).await.unwrap();

        // 尝试创建超过限制的进程
        let result = manager.execute(&sandbox, "bash", &[
            "-c".to_string(),
            "for i in $(seq 1 10); do sleep 1 & done".to_string(),
        ]).await;

        assert!(result.is_err());

        manager.destroy(&sandbox).await.unwrap();
    }
}
```

---

## 4. 平台特定测试

### 4.1 macOS Seatbelt 测试

```rust
#[cfg(target_os = "macos")]
mod macos_tests {
    use super::*;

    #[test]
    fn test_seatbelt_profile_generation() {
        let config = create_test_config();
        let profile = SeatbeltSandboxManager::generate_profile(&config);

        assert!(profile.contains("(version 1)"));
        assert!(profile.contains("(deny default)"));
        assert!(profile.contains("file-read*"));
    }

    #[tokio::test]
    async fn test_seatbelt_sandbox_execution() {
        let manager = SeatbeltSandboxManager::new();
        let config = create_test_config();

        let sandbox = manager.create(&config).await.unwrap();
        let output = manager.execute(&sandbox, "echo", &["test".to_string()]).await.unwrap();

        assert_eq!(output.exit_code, 0);
        assert_eq!(output.stdout.trim(), "test");

        manager.destroy(&sandbox).await.unwrap();
    }
}
```

### 4.2 Linux bubblewrap 测试

```rust
#[cfg(target_os = "linux")]
mod linux_tests {
    use super::*;

    #[test]
    fn test_bwrap_command_generation() {
        let config = create_test_config();
        let cmd = BubblewrapSandboxManager::build_bwrap_command(&config, "echo", &["test".to_string()]);

        assert!(cmd.get_args().any(|a| a == "--unshare-all"));
        assert!(cmd.get_args().any(|a| a == "--die-with-parent"));
    }

    #[tokio::test]
    async fn test_bubblewrap_sandbox_execution() {
        let manager = BubblewrapSandboxManager::new();
        let config = create_test_config();

        let sandbox = manager.create(&config).await.unwrap();
        let output = manager.execute(&sandbox, "echo", &["test".to_string()]).await.unwrap();

        assert_eq!(output.exit_code, 0);
        assert_eq!(output.stdout.trim(), "test");

        manager.destroy(&sandbox).await.unwrap();
    }
}
```

---

## 5. 性能测试

```rust
#[cfg(test)]
mod performance_tests {
    use super::*;
    use std::time::Instant;

    #[tokio::test]
    async fn test_sandbox_creation_time() {
        let manager = create_sandbox_manager();
        let config = create_test_config();

        let start = Instant::now();
        let sandbox = manager.create(&config).await.unwrap();
        let duration = start.elapsed();

        assert!(duration.as_millis() < 500, "沙箱创建时间超过 500ms: {:?}", duration);

        manager.destroy(&sandbox).await.unwrap();
    }

    #[tokio::test]
    async fn test_sandbox_execute_time() {
        let manager = create_sandbox_manager();
        let config = create_test_config();

        let sandbox = manager.create(&config).await.unwrap();

        let start = Instant::now();
        let output = manager.execute(&sandbox, "echo", &["test".to_string()]).await.unwrap();
        let duration = start.elapsed();

        assert!(duration.as_millis() < 100, "命令执行时间超过 100ms: {:?}", duration);
        assert_eq!(output.exit_code, 0);

        manager.destroy(&sandbox).await.unwrap();
    }
}
```

---

## 6. 测试覆盖率目标

| 模块 | 目标覆盖率 | 说明 |
|------|-----------|------|
| SandboxConfig | 95% | 配置解析和验证 |
| NetworkPolicy | 90% | 网络策略判断 |
| ResourceLimits | 90% | 资源限制验证 |
| SandboxManager | 85% | 核心管理逻辑 |
| 平台实现 | 80% | Seatbelt/Bubblewrap |

---

## 7. 测试执行命令

```bash
# 运行所有测试
cargo test -p codey-core --lib

# 运行沙箱相关测试
cargo test -p codey-core --lib sandbox

# 运行集成测试
cargo test -p codey-core --test sandbox_integration

# 运行性能测试
cargo test -p codey-core --lib performance --release
```

---

*测试计划版本: v1.0.0*
*最后更新: 2026-07-05*
