# Phase 2.5 集成测试计划

> 日期：2026-07-05

## 测试目标

- PathValidator 重命名后功能不变
- FileExecutor 文件读写正确性和安全性
- ShellExecutor 命令执行正确性和安全性
- AnthropicProvider Tool Use 格式转换
- AgentLoop 流式/非流式双模式

## 单元测试

### PathValidator
- test_path_validator_allows_working_dir
- test_path_validator_denies_outside
- test_path_validator_resolve_traversal

### FileExecutor
- test_file_executor_read_existing
- test_file_executor_write_new_file
- test_file_executor_read_path_denied

### ShellExecutor
- test_shell_executor_simple_command
- test_shell_executor_blocked_rm_rf
- test_shell_executor_timeout

### Anthropic Tool Use
- test_anthropic_parse_tool_use_response
- test_anthropic_supports_function_calling

## 集成测试

- test_agent_loop_file_read_integration
- test_agent_loop_shell_execute_integration
- test_agent_loop_anthropic_tool_use_flow
- test_agent_loop_streaming_mode
