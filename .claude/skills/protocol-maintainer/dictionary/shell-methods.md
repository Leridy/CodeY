# Shell 方法定义

Shell 方法用于执行命令行操作。

---

## shell/execute

执行 Shell 命令。

| 方向 | 类型 | 说明 |
|------|------|------|
| Request | Request | 客户端/Agent -> 服务端 |

### Params

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| command | string | 是 | 要执行的命令 |
| working_dir | string | 否 | 工作目录 |
| env | object | 否 | 环境变量 |
| timeout | number | 否 | 超时时间（毫秒，默认 120000） |
| background | boolean | 否 | 是否后台执行（默认 false） |

### Result

| 字段 | 类型 | 说明 |
|------|------|------|
| process_id | string | 进程标识 |
| status | string | 状态：`running`（后台）或 `completed` |
| exit_code | number | 退出码（前台执行时） |
| stdout | string | 标准输出 |
| stderr | string | 标准错误 |

### 示例

```json
// Request
{ "jsonrpc": "2.0", "method": "shell/execute", "params": { "command": "cargo build", "working_dir": "/project" }, "id": "20" }
// Response
{ "jsonrpc": "2.0", "result": { "process_id": "proc-001", "status": "completed", "exit_code": 0, "stdout": "   Compiling project v0.1.0 (/project)\n    Finished dev [unoptimized + debuginfo] target(s) in 2.35s", "stderr": "" }, "id": "20" }
```

---

## shell/output

Shell 进程输出流（Notification，服务端 -> 客户端）。

| 方向 | 类型 | 说明 |
|------|------|------|
| Notification | Notification | 服务端 -> 客户端 |

### Params

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| process_id | string | 是 | 进程标识 |
| stream | string | 是 | 输出流：`stdout` 或 `stderr` |
| data | string | 是 | 输出内容 |

### 示例

```json
{ "jsonrpc": "2.0", "method": "shell/output", "params": { "process_id": "proc-001", "stream": "stdout", "data": "   Compiling project v0.1.0 (/project)\n" } }
```

---

## shell/exit

Shell 进程退出通知（Notification，服务端 -> 客户端）。

| 方向 | 类型 | 说明 |
|------|------|------|
| Notification | Notification | 服务端 -> 客户端 |

### Params

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| process_id | string | 是 | 进程标识 |
| exit_code | number | 是 | 退出码 |
| signal | string | 否 | 终止信号（如 `SIGTERM`） |

### 示例

```json
{ "jsonrpc": "2.0", "method": "shell/exit", "params": { "process_id": "proc-001", "exit_code": 0 } }
```

---

## shell/kill

终止 Shell 进程。

| 方向 | 类型 | 说明 |
|------|------|------|
| Request | Request | 客户端/Agent -> 服务端 |

### Params

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| process_id | string | 是 | 进程标识 |
| signal | string | 否 | 发送的信号（默认 `SIGTERM`） |

### Result

| 字段 | 类型 | 说明 |
|------|------|------|
| process_id | string | 进程标识 |
| killed | boolean | 是否成功终止 |

### 示例

```json
// Request
{ "jsonrpc": "2.0", "method": "shell/kill", "params": { "process_id": "proc-001", "signal": "SIGKILL" }, "id": "21" }
// Response
{ "jsonrpc": "2.0", "result": { "process_id": "proc-001", "killed": true }, "id": "21" }
```
