# Phase 1 API 规范

> 日期：2026-07-05
> 版本：v1.0.0
> 协议：JSON-RPC 2.0

## 1. 概述

本文档定义 Phase 1 所有 API 方法的完整规范，包括请求/响应格式、参数定义、错误码和流式传输规范。

### 1.1 基础格式

所有 API 方法遵循 JSON-RPC 2.0 规范：

- **Request**：包含 `id` 字段，期望 Response
- **Notification**：无 `id` 字段，不期望 Response
- **Response**：包含 `id` 字段，匹配 Request

---

## 2. Agent 方法

### 2.1 agent/start

启动一个新的 Agent 实例。

**类型**：Request
**方向**：Client -> Server

#### Params

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| model | string | 是 | LLM 模型标识 |
| system_prompt | string | 否 | 系统提示词 |
| tools | string[] | 否 | 可用工具列表 |
| config | object | 否 | Agent 配置参数 |

**model 可选值**：
- `sonnet-4.6` - Sonnet 4.6（最佳编码）
- `haiku-4.5` - Haiku 4.5（轻量快速）
- `opus-4.5` - Opus 4.5（深度推理）

#### Result

| 字段 | 类型 | 说明 |
|------|------|------|
| agent_id | string | 唯一 Agent 标识 |
| status | string | 状态，固定为 `running` |

#### 示例

```json
// Request
{
  "jsonrpc": "2.0",
  "method": "agent/start",
  "params": {
    "model": "sonnet-4.6",
    "system_prompt": "你是一个编程助手",
    "tools": ["file/read", "file/write", "shell/execute"]
  },
  "id": "1"
}

// Response
{
  "jsonrpc": "2.0",
  "result": {
    "agent_id": "agent-abc123",
    "status": "running"
  },
  "id": "1"
}
```

#### 错误码

| 错误码 | 场景 |
|--------|------|
| -32602 | 缺少 model 参数 |
| -32000 | Agent 启动失败 |
| -32003 | LLM 不可用 |

---

### 2.2 agent/stop

停止一个运行中的 Agent 实例。

**类型**：Request
**方向**：Client -> Server

#### Params

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| agent_id | string | 是 | Agent 标识 |
| reason | string | 否 | 停止原因 |

#### Result

| 字段 | 类型 | 说明 |
|------|------|------|
| agent_id | string | Agent 标识 |
| status | string | 状态，固定为 `stopped` |

#### 示例

```json
// Request
{
  "jsonrpc": "2.0",
  "method": "agent/stop",
  "params": {
    "agent_id": "agent-abc123",
    "reason": "任务完成"
  },
  "id": "2"
}

// Response
{
  "jsonrpc": "2.0",
  "result": {
    "agent_id": "agent-abc123",
    "status": "stopped"
  },
  "id": "2"
}
```

---

### 2.3 agent/send

向 Agent 发送用户消息。

**类型**：Request
**方向**：Client -> Server

#### Params

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| agent_id | string | 是 | Agent 标识 |
| message | string | 是 | 用户消息内容 |
| context | object[] | 否 | 附加上下文 |

#### Result

| 字段 | 类型 | 说明 |
|------|------|------|
| message_id | string | 消息标识 |
| status | string | 状态，固定为 `accepted` |

#### 示例

```json
// Request
{
  "jsonrpc": "2.0",
  "method": "agent/send",
  "params": {
    "agent_id": "agent-abc123",
    "message": "读取 src/main.rs 并解释其功能"
  },
  "id": "3"
}

// Response
{
  "jsonrpc": "2.0",
  "result": {
    "message_id": "msg-001",
    "status": "accepted"
  },
  "id": "3"
}
```

---

### 2.4 agent/cancel

取消 Agent 当前正在执行的操作。

**类型**：Request
**方向**：Client -> Server

#### Params

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| agent_id | string | 是 | Agent 标识 |
| message_id | string | 否 | 要取消的特定消息 ID |

#### Result

| 字段 | 类型 | 说明 |
|------|------|------|
| agent_id | string | Agent 标识 |
| cancelled | boolean | 是否成功取消 |

---

### 2.5 agent/response

Agent 回复消息（支持流式 chunk）。

**类型**：Notification
**方向**：Server -> Client

#### Params

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| agent_id | string | 是 | Agent 标识 |
| message_id | string | 是 | 关联的消息 ID |
| content | string | 是 | 回复内容 |
| is_chunk | boolean | 否 | 是否为流式分片（默认 false） |
| done | boolean | 否 | 是否为最后一片（默认 false） |

#### 流式状态组合

| is_chunk | done | 说明 |
|----------|------|------|
| true | false | 流式分片，还有更多内容 |
| false | true | 最后一片，流式传输结束 |
| false | false | 完整消息（非流式） |

#### 示例

```json
// 流式分片
{
  "jsonrpc": "2.0",
  "method": "agent/response",
  "params": {
    "agent_id": "agent-abc123",
    "message_id": "msg-001",
    "content": "Rust 的所有权系统",
    "is_chunk": true,
    "done": false
  }
}

// 最后一片
{
  "jsonrpc": "2.0",
  "method": "agent/response",
  "params": {
    "agent_id": "agent-abc123",
    "message_id": "msg-001",
    "content": "是内存安全的核心。",
    "is_chunk": false,
    "done": true
  }
}
```

---

### 2.6 agent/tool_call

Agent 请求调用工具。

**类型**：Notification
**方向**：Server -> Client

#### Params

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| agent_id | string | 是 | Agent 标识 |
| call_id | string | 是 | 工具调用标识 |
| tool | string | 是 | 工具名称 |
| arguments | object | 是 | 工具参数 |

#### 示例

```json
{
  "jsonrpc": "2.0",
  "method": "agent/tool_call",
  "params": {
    "agent_id": "agent-abc123",
    "call_id": "call-001",
    "tool": "file/read",
    "arguments": {
      "path": "/src/main.rs"
    }
  }
}
```

---

### 2.7 agent/tool_result

工具执行结果返回给 Agent。

**类型**：Notification
**方向**：Client -> Server

#### Params

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| agent_id | string | 是 | Agent 标识 |
| call_id | string | 是 | 关联的工具调用 ID |
| result | any | 是 | 工具执行结果 |
| error | string | 否 | 错误信息（失败时） |

---

### 2.8 agent/error

Agent 错误通知。

**类型**：Notification
**方向**：Server -> Client

#### Params

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| agent_id | string | 是 | Agent 标识 |
| code | number | 是 | 错误码 |
| message | string | 是 | 错误描述 |
| data | object | 否 | 附加错误数据 |

---

### 2.9 agent/approval

Agent 请求用户审批。

**类型**：Notification
**方向**：Server -> Client

#### Params

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| agent_id | string | 是 | Agent 标识 |
| approval_id | string | 是 | 审批请求标识 |
| tool | string | 是 | 需要审批的工具 |
| arguments | object | 是 | 工具参数 |
| reason | string | 否 | 需要审批的原因 |

---

### 2.10 agent/approval_response

客户端对审批请求的响应。

**类型**：Notification
**方向**：Client -> Server

#### Params

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| agent_id | string | 是 | Agent 标识 |
| approval_id | string | 是 | 审批请求标识 |
| approved | boolean | 是 | 是否批准 |
| reason | string | 否 | 拒绝原因（approved=false 时） |

---

## 3. File 方法

### 3.1 file/read

读取文件内容。

**类型**：Request
**方向**：Client/Agent -> Server

#### Params

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| path | string | 是 | 文件绝对路径 |
| offset | number | 否 | 起始行号（0-based） |
| limit | number | 否 | 读取行数 |
| encoding | string | 否 | 编码格式（默认 `utf-8`） |

#### Result

| 字段 | 类型 | 说明 |
|------|------|------|
| content | string | 文件内容 |
| total_lines | number | 文件总行数 |
| truncated | boolean | 是否被截断 |

#### 示例

```json
// Request
{
  "jsonrpc": "2.0",
  "method": "file/read",
  "params": {
    "path": "/src/main.rs",
    "offset": 0,
    "limit": 50
  },
  "id": "10"
}

// Response
{
  "jsonrpc": "2.0",
  "result": {
    "content": "fn main() {\n    println!(\"Hello, world!\");\n}",
    "total_lines": 3,
    "truncated": false
  },
  "id": "10"
}
```

#### 错误码

| 错误码 | 场景 |
|--------|------|
| -32602 | 缺少 path 参数 |
| -32002 | 文件不存在 |
| -32001 | 权限不足 |
| -32008 | 路径验证失败 |

---

### 3.2 file/write

写入文件（创建或覆盖）。

**类型**：Request
**方向**：Client/Agent -> Server

#### Params

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| path | string | 是 | 文件绝对路径 |
| content | string | 是 | 文件内容 |
| create_dirs | boolean | 否 | 是否自动创建父目录（默认 false） |
| encoding | string | 否 | 编码格式（默认 `utf-8`） |

#### Result

| 字段 | 类型 | 说明 |
|------|------|------|
| path | string | 写入的文件路径 |
| bytes_written | number | 写入字节数 |

#### 示例

```json
// Request
{
  "jsonrpc": "2.0",
  "method": "file/write",
  "params": {
    "path": "/src/config.json",
    "content": "{\"debug\": true}",
    "create_dirs": true
  },
  "id": "11"
}

// Response
{
  "jsonrpc": "2.0",
  "result": {
    "path": "/src/config.json",
    "bytes_written": 15
  },
  "id": "11"
}
```

---

### 3.3 file/edit

编辑文件（增量替换）。

**类型**：Request
**方向**：Client/Agent -> Server

#### Params

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| path | string | 是 | 文件绝对路径 |
| old_string | string | 是 | 要替换的原始文本 |
| new_string | string | 是 | 替换后的文本 |
| replace_all | boolean | 否 | 是否替换所有匹配项（默认 false） |

#### Result

| 字段 | 类型 | 说明 |
|------|------|------|
| path | string | 编辑的文件路径 |
| replacements | number | 替换次数 |

#### 示例

```json
// Request
{
  "jsonrpc": "2.0",
  "method": "file/edit",
  "params": {
    "path": "/src/main.rs",
    "old_string": "println!(\"Hello\")",
    "new_string": "println!(\"Hello, world!\")"
  },
  "id": "12"
}

// Response
{
  "jsonrpc": "2.0",
  "result": {
    "path": "/src/main.rs",
    "replacements": 1
  },
  "id": "12"
}
```

#### 错误码

| 错误码 | 场景 |
|--------|------|
| -32002 | old_string 未找到 |
| -32008 | old_string 匹配多个且未指定 replace_all |

---

### 3.4 file/search

搜索文件内容。

**类型**：Request
**方向**：Client/Agent -> Server

#### Params

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| pattern | string | 是 | 搜索模式（正则表达式） |
| path | string | 否 | 搜索目录（默认当前目录） |
| file_pattern | string | 否 | 文件名过滤（如 `*.rs`） |
| max_results | number | 否 | 最大结果数（默认 100） |

#### Result

| 字段 | 类型 | 说明 |
|------|------|------|
| matches | object[] | 匹配结果列表 |
| total | number | 总匹配数 |

**matches 元素结构**：

| 字段 | 类型 | 说明 |
|------|------|------|
| file | string | 文件路径 |
| line | number | 行号 |
| column | number | 列号 |
| text | string | 匹配文本 |

#### 示例

```json
// Request
{
  "jsonrpc": "2.0",
  "method": "file/search",
  "params": {
    "pattern": "fn\\s+main",
    "path": "/src",
    "file_pattern": "*.rs"
  },
  "id": "13"
}

// Response
{
  "jsonrpc": "2.0",
  "result": {
    "matches": [
      {
        "file": "/src/main.rs",
        "line": 1,
        "column": 0,
        "text": "fn main() {"
      }
    ],
    "total": 1
  },
  "id": "13"
}
```

---

### 3.5 file/list

列出目录内容。

**类型**：Request
**方向**：Client/Agent -> Server

#### Params

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| path | string | 是 | 目录路径 |
| recursive | boolean | 否 | 是否递归（默认 false） |
| pattern | string | 否 | 文件名过滤模式 |
| ignore | string[] | 否 | 忽略的目录/文件模式 |

#### Result

| 字段 | 类型 | 说明 |
|------|------|------|
| entries | object[] | 目录项列表 |
| total | number | 总数 |

**entries 元素结构**：

| 字段 | 类型 | 说明 |
|------|------|------|
| name | string | 文件/目录名 |
| path | string | 完整路径 |
| type | string | 类型：`file` 或 `dir` |
| size | number | 文件大小（字节） |

---

## 4. Shell 方法

### 4.1 shell/execute

执行 Shell 命令。

**类型**：Request
**方向**：Client/Agent -> Server

#### Params

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| command | string | 是 | 要执行的命令 |
| working_dir | string | 否 | 工作目录 |
| env | object | 否 | 环境变量 |
| timeout | number | 否 | 超时时间（毫秒，默认 120000） |
| background | boolean | 否 | 是否后台执行（默认 false） |

#### Result

| 字段 | 类型 | 说明 |
|------|------|------|
| process_id | string | 进程标识 |
| status | string | 状态：`running` 或 `completed` |
| exit_code | number | 退出码（前台执行时） |
| stdout | string | 标准输出 |
| stderr | string | 标准错误 |

#### 示例

```json
// Request
{
  "jsonrpc": "2.0",
  "method": "shell/execute",
  "params": {
    "command": "cargo build",
    "working_dir": "/project"
  },
  "id": "20"
}

// Response
{
  "jsonrpc": "2.0",
  "result": {
    "process_id": "proc-001",
    "status": "completed",
    "exit_code": 0,
    "stdout": "   Compiling project v0.1.0\n    Finished dev [unoptimized + debuginfo]",
    "stderr": ""
  },
  "id": "20"
}
```

#### 错误码

| 错误码 | 场景 |
|--------|------|
| -32602 | 缺少 command 参数 |
| -32004 | 命令执行超时 |
| -32001 | 权限不足（危险命令） |
| -32002 | 命令执行失败 |

---

### 4.2 shell/output

Shell 进程输出流。

**类型**：Notification
**方向**：Server -> Client

#### Params

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| process_id | string | 是 | 进程标识 |
| stream | string | 是 | 输出流：`stdout` 或 `stderr` |
| data | string | 是 | 输出内容 |

#### 示例

```json
{
  "jsonrpc": "2.0",
  "method": "shell/output",
  "params": {
    "process_id": "proc-001",
    "stream": "stdout",
    "data": "   Compiling project v0.1.0 (/project)\n"
  }
}
```

---

### 4.3 shell/exit

Shell 进程退出通知。

**类型**：Notification
**方向**：Server -> Client

#### Params

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| process_id | string | 是 | 进程标识 |
| exit_code | number | 是 | 退出码 |
| signal | string | 否 | 终止信号（如 `SIGTERM`） |

#### 示例

```json
{
  "jsonrpc": "2.0",
  "method": "shell/exit",
  "params": {
    "process_id": "proc-001",
    "exit_code": 0
  }
}
```

---

### 4.4 shell/kill

终止 Shell 进程。

**类型**：Request
**方向**：Client/Agent -> Server

#### Params

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| process_id | string | 是 | 进程标识 |
| signal | string | 否 | 发送的信号（默认 `SIGTERM`） |

#### Result

| 字段 | 类型 | 说明 |
|------|------|------|
| process_id | string | 进程标识 |
| killed | boolean | 是否成功终止 |

---

## 5. 错误码定义

### 5.1 标准 JSON-RPC 2.0 错误码

| 错误码 | 名称 | 说明 |
|--------|------|------|
| -32700 | Parse Error | JSON 解析失败 |
| -32600 | Invalid Request | 请求格式无效 |
| -32601 | Method Not Found | 方法不存在 |
| -32602 | Invalid Params | 参数无效 |
| -32603 | Internal Error | 内部错误 |

### 5.2 CodeY 扩展错误码

| 错误码 | 名称 | 说明 | retryable |
|--------|------|------|-----------|
| -32000 | Agent Error | Agent 运行时错误 | false |
| -32001 | Permission Denied | 权限不足 | false |
| -32002 | Tool Error | 工具执行失败 | 视情况 |
| -32003 | LLM Error | LLM 调用失败 | true |
| -32004 | Timeout | 操作超时 | true |
| -32005 | Rate Limit Exceeded | 请求频率超限 | true |
| -32006 | Resource Exhausted | 资源耗尽 | false |
| -32007 | State Conflict | 状态冲突 | false |
| -32008 | Validation Error | 数据验证失败 | false |
| -32009 | Transport Error | 传输层错误 | true |

### 5.3 错误响应格式

```json
{
  "jsonrpc": "2.0",
  "error": {
    "code": -32002,
    "message": "Tool Error",
    "data": {
      "tool": "file/read",
      "reason": "文件不存在: /path/to/file",
      "retryable": false,
      "suggestion": "请检查文件路径是否正确"
    }
  },
  "id": "req-001"
}
```

---

## 6. 流式传输规范

### 6.1 流式消息标识

| 参数 | 类型 | 说明 |
|------|------|------|
| is_chunk | boolean | `true` 表示流式分片 |
| done | boolean | `true` 表示最后一片 |

### 6.2 流式场景

#### Agent 响应流

```
Client: agent/send
Server: agent/response (is_chunk=true, done=false)  -- 片段 1
Server: agent/response (is_chunk=true, done=false)  -- 片段 2
Server: agent/response (is_chunk=true, done=false)  -- 片段 3
Server: agent/response (is_chunk=false, done=true)   -- 最后一片
```

#### Shell 输出流

```
Client: shell/execute (background=true)
Server: shell/output (stream=stdout)  -- 输出 1
Server: shell/output (stream=stdout)  -- 输出 2
Server: shell/output (stream=stderr)  -- 错误输出
Server: shell/exit (exit_code=0)      -- 进程退出
```

### 6.3 流式中断处理

```
中断场景：
1. 客户端发送 agent/cancel
2. 服务端停止生成
3. 服务端发送 agent/response (is_chunk=false, done=true) 带中断标记
4. 客户端清理已收集的分片

重连场景：
1. 检测连接断开
2. 重新建立连接
3. 发送 agent/send 带 context（包含之前的消息）
4. Agent 从断点继续
```

---

## 7. 协议版本

当前版本：**v1.0.0**

版本号遵循 Semantic Versioning：
- MAJOR：不兼容变更
- MINOR：新增方法（向后兼容）
- PATCH：文档修正

---

*Phase 1 API 规范 v1.0.0*
*创建日期：2026-07-05*
