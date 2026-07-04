//! 沙箱系统测试模块
//!
//! 包含配置解析、路径验证、网络策略和沙箱生命周期测试

#[cfg(test)]
mod tests {
    use super::super::*;
    use std::path::PathBuf;

    /// 创建测试用的沙箱配置
    fn create_test_config() -> SandboxConfig {
        SandboxConfig {
            working_dir: PathBuf::from("/tmp/test"),
            allowed_paths: vec![PathBuf::from("src"), PathBuf::from("tests")],
            denied_paths: vec![PathBuf::from(".env"), PathBuf::from("**/*secret*")],
            network: NetworkPolicy {
                allow_outbound: true,
                allowed_domains: vec!["api.openai.com".to_string()],
                blocked_ports: vec![22, 23],
            },
            limits: ResourceLimits {
                max_memory_mb: 512,
                max_cpu_cores: 1.0,
                max_processes: 100,
                timeout_secs: 300,
            },
        }
    }

    // ==================== 配置解析测试 ====================

    #[test]
    fn test_sandbox_config_serialization() {
        let config = create_test_config();
        let json = serde_json::to_string(&config).unwrap();
        let parsed: SandboxConfig = serde_json::from_str(&json).unwrap();
        assert_eq!(config.working_dir, parsed.working_dir);
        assert_eq!(config.allowed_paths, parsed.allowed_paths);
        assert_eq!(config.denied_paths, parsed.denied_paths);
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
        assert!(policy.blocked_ports.is_empty());
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

    // ==================== 路径验证测试 ====================

    #[test]
    fn test_path_allowed() {
        let config = create_test_config();
        let path = PathBuf::from("src/main.rs");
        assert!(config.is_path_allowed(&path));
    }

    #[test]
    fn test_path_denied() {
        let config = create_test_config();
        let path = PathBuf::from(".env");
        assert!(!config.is_path_allowed(&path));
    }

    #[test]
    fn test_path_outside_working_dir() {
        let config = create_test_config();
        let path = PathBuf::from("/etc/passwd");
        assert!(!config.is_path_allowed(&path));
    }

    #[test]
    fn test_path_traversal_attack() {
        let config = create_test_config();
        let path = PathBuf::from("src/../../../etc/passwd");
        assert!(!config.is_path_allowed(&path));
    }

    // ==================== 网络策略测试 ====================

    #[test]
    fn test_domain_allowed() {
        let policy = NetworkPolicy {
            allow_outbound: true,
            allowed_domains: vec!["api.openai.com".to_string()],
            blocked_ports: vec![],
        };
        assert!(policy.is_domain_allowed("api.openai.com"));
    }

    #[test]
    fn test_domain_blocked() {
        let policy = NetworkPolicy {
            allow_outbound: true,
            allowed_domains: vec!["api.openai.com".to_string()],
            blocked_ports: vec![],
        };
        assert!(!policy.is_domain_allowed("malicious.com"));
    }

    #[test]
    fn test_port_blocked() {
        let policy = NetworkPolicy {
            allow_outbound: true,
            allowed_domains: vec![],
            blocked_ports: vec![22, 23],
        };
        assert!(policy.is_port_blocked(22));
    }

    #[test]
    fn test_port_allowed() {
        let policy = NetworkPolicy {
            allow_outbound: true,
            allowed_domains: vec![],
            blocked_ports: vec![22, 23],
        };
        assert!(!policy.is_port_blocked(443));
    }

    // ==================== 沙箱生命周期测试 ====================

    #[tokio::test]
    async fn test_sandbox_instance_creation() {
        let config = create_test_config();
        let instance = SandboxInstance::new(config.clone());

        assert!(!instance.id.is_empty());
        assert_eq!(instance.config.working_dir, config.working_dir);
        assert!(matches!(instance.status, SandboxStatus::Running));
    }

    #[tokio::test]
    async fn test_sandbox_instance_status() {
        let config = create_test_config();
        let instance = SandboxInstance::new(config);

        assert!(matches!(instance.status(), SandboxStatus::Running));

        let mut instance = instance;
        instance.set_status(SandboxStatus::Stopped);
        assert!(matches!(instance.status(), SandboxStatus::Stopped));
    }

    #[tokio::test]
    async fn test_sandbox_output_creation() {
        let output = SandboxOutput {
            exit_code: 0,
            stdout: "hello".to_string(),
            stderr: String::new(),
            duration: std::time::Duration::from_millis(100),
        };

        assert_eq!(output.exit_code, 0);
        assert_eq!(output.stdout, "hello");
        assert!(output.stderr.is_empty());
    }

    // ==================== 错误类型测试 ====================

    #[test]
    fn test_sandbox_error_display() {
        let err = SandboxError::CreationFailed("test error".to_string());
        assert_eq!(err.to_string(), "沙箱创建失败: test error");

        let err = SandboxError::Timeout(300);
        assert_eq!(err.to_string(), "沙箱超时 (300秒)");
    }

    // ==================== 资源限制验证测试 ====================

    #[test]
    fn test_resource_limits_is_valid() {
        let limits = ResourceLimits {
            max_memory_mb: 512,
            max_cpu_cores: 1.0,
            max_processes: 100,
            timeout_secs: 300,
        };
        assert!(limits.is_valid());

        let invalid_limits = ResourceLimits {
            max_memory_mb: 0,
            max_cpu_cores: 1.0,
            max_processes: 100,
            timeout_secs: 300,
        };
        assert!(!invalid_limits.is_valid());
    }

    // ==================== 网络策略高级测试 ====================

    #[test]
    fn test_network_policy_outbound_disabled() {
        let policy = NetworkPolicy {
            allow_outbound: false,
            allowed_domains: vec!["api.openai.com".to_string()],
            blocked_ports: vec![],
        };
        // 当出站被禁用时，即使域名在允许列表中也应该被拒绝
        assert!(!policy.is_domain_allowed("api.openai.com"));
    }

    #[test]
    fn test_network_policy_empty_allowed_domains() {
        let policy = NetworkPolicy {
            allow_outbound: true,
            allowed_domains: vec![],
            blocked_ports: vec![],
        };
        // 当允许列表为空时，所有域名都应该被允许
        assert!(policy.is_domain_allowed("any-domain.com"));
    }

    // ==================== 路径验证高级测试 ====================

    #[test]
    fn test_path_exact_match() {
        let config = create_test_config();
        let path = PathBuf::from("src");
        assert!(config.is_path_allowed(&path));
    }

    #[test]
    fn test_path_subdirectory() {
        let config = create_test_config();
        let path = PathBuf::from("src/utils");
        assert!(config.is_path_allowed(&path));
    }

    #[test]
    fn test_path_denied_exact_match() {
        let config = create_test_config();
        let path = PathBuf::from(".env");
        assert!(!config.is_path_allowed(&path));
    }

    #[test]
    fn test_path_denied_pattern() {
        let config = create_test_config();
        let path = PathBuf::from(".env.local");
        assert!(!config.is_path_allowed(&path));
    }

    // ==================== 沙箱管理器工厂测试 ====================

    #[test]
    fn test_create_sandbox_manager_returns_manager() {
        let manager = create_sandbox_manager();
        // 验证管理器可以创建
        assert!(std::sync::Arc::strong_count(&manager) > 0);
    }

    #[test]
    fn test_create_sandbox_manager_for_platform_macos() {
        #[cfg(target_os = "macos")]
        {
            let manager = create_sandbox_manager_for_platform("macos").unwrap();
            assert!(std::sync::Arc::strong_count(&manager) > 0);
        }
    }

    #[test]
    fn test_create_sandbox_manager_for_platform_linux() {
        #[cfg(target_os = "linux")]
        {
            let manager = create_sandbox_manager_for_platform("linux").unwrap();
            assert!(std::sync::Arc::strong_count(&manager) > 0);
        }
    }

    // ==================== macOS Seatbelt 特定测试 ====================

    #[cfg(target_os = "macos")]
    mod macos_tests {
        use super::*;

        #[test]
        fn test_seatbelt_profile_generation() {
            let config = create_test_config();
            let profile = SeatbeltSandboxManager::generate_profile(&config);

            // 验证策略文件包含必要的指令
            assert!(profile.contains("(version 1)"));
            assert!(profile.contains("(deny default)"));
            assert!(profile.contains("file-read*"));
            assert!(profile.contains("file-write*"));
            assert!(profile.contains("process-exec"));
        }

        #[test]
        fn test_seatbelt_profile_network_rules() {
            let config = create_test_config();
            let profile = SeatbeltSandboxManager::generate_profile(&config);

            // 验证网络规则
            assert!(profile.contains("network-outbound"));
            assert!(profile.contains("api.openai.com"));
        }

        #[test]
        fn test_seatbelt_profile_denied_paths() {
            let config = create_test_config();
            let profile = SeatbeltSandboxManager::generate_profile(&config);

            // 验证禁止路径规则
            assert!(profile.contains(".env"));
        }
    }

    // ==================== Linux Bubblewrap 特定测试 ====================

    #[cfg(target_os = "linux")]
    mod linux_tests {
        use super::*;

        #[test]
        fn test_bwrap_command_generation() {
            let config = create_test_config();
            let cmd = BubblewrapSandboxManager::build_bwrap_command(&config, "echo", &["test".to_string()]);

            // 验证命令包含必要的参数
            let args: Vec<String> = cmd.get_args().map(|a| a.to_string_lossy().to_string()).collect();
            assert!(args.contains(&"--unshare-all".to_string()));
            assert!(args.contains(&"--die-with-parent".to_string()));
            assert!(args.contains(&"--proc".to_string()));
            assert!(args.contains(&"/proc".to_string()));
        }

        #[test]
        fn test_bwrap_command_with_network_disabled() {
            let mut config = create_test_config();
            config.network.allow_outbound = false;

            let cmd = BubblewrapSandboxManager::build_bwrap_command(&config, "echo", &["test".to_string()]);

            // 验证网络隔离参数
            let args: Vec<String> = cmd.get_args().map(|a| a.to_string_lossy().to_string()).collect();
            assert!(args.contains(&"--unshare-net".to_string()));
        }

        #[test]
        fn test_bwrap_command_working_directory() {
            let config = create_test_config();
            let cmd = BubblewrapSandboxManager::build_bwrap_command(&config, "echo", &["test".to_string()]);

            // 验证工作目录设置
            assert_eq!(cmd.get_current_dir(), Some(config.working_dir.as_path()));
        }
    }
}
