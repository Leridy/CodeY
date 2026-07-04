# Phase 1 方法定义

> 版本：v1.0.0
> 日期：2026-07-05

本文档定义 Phase 1 所有协议方法的完整规范，作为开发和测试的权威参考。

---

## Agent 方法

Agent 方法用于管理 Agent 生命周期和通信。

### agent/start

启动 Agent 会话。

| 属性 | 值 |
|------|-----|
| 类型 | Request |
| 方向 | Client -> Server |
| 详见 | [agent-methods.md](./agent-methods.md#agentstart) |

**核心参数**：`model`（必填）、`system_prompt`、`tools`、`config`
**返回**：`agent_id`、`status: "running"`

---

### agent/stop

停止 Agent 会话。

| 属性 | 值 |
|------|-----|
| 类型 | Request |
| 方向 | Client -> Server |
| 详见 | [agent-methods.md](./agent-methods.md#agentstop) |

**核心参数**：`agent_id`（必填）、`reason`
**返回**：`agent_id`、`status: "stopped"`

---

### agent/send

发送用户消息。

| 属性 | 值 |
|------|-----|
| 类型 | Request |
| 方向 | Client -> Server |
| 详见 | [agent-methods.md](./agent-methods.md#agentsend) |

**核心参数**：`agent_id`（必填）、`message`（必填）、`context`
**返回**：`message_id`、`status: "accepted"`

---

### agent/response

Agent 响应（支持流式 chunk）。

| 属性 | 值 |
|------|-----|
| 类型 | Notification |
| 方向 | Server -> Client |
| 详见 | [agent-methods.md](./agent-methods.md#agentresponse) |

**核心参数**：`agent_id`、`message_id`、`content`、`is_chunk`、`done`

**流式状态**：
- `is_chunk=true, done=false`：流式分片
- `is_chunk=false, done=true`：最后一片
- `is_chunk=false, done=false`：完整消息

---

## 文件操作方法

文件操作方法用于文件系统交互。

### file/read

读取文件。

| 属性 | 值 |
|------|-----|
| 类型 | Request |
| 方向 | Client/Agent -> Server |
| 详见 | [file-methods.md](./file-methods.md#fileread) |

**核心参数**：`path`（必填）、`offset`、`limit`、`encoding`
**返回**：`content`、`total_lines`、`truncated`

---

### file/write

写入文件。

| 属性 | 值 |
|------|-----|
| 类型 | Request |
| 方向 | Client/Agent -> Server |
| 详见 | [file-methods.md](./file-methods.md#filewrite) |

**核心参数**：`path`（必填）、`content`（必填）、`create_dirs`、`encoding`
**返回**：`path`、`bytes_written`

---

### file/edit

编辑文件（增量替换）。

| 属性 | 值 |
|------|-----|
| 类型 | Request |
| 方向 | Client/Agent -> Server |
| 详见 | [file-methods.md](./file-methods.md#fileedit) |

**核心参数**：`path`（必填）、`old_string`（必填）、`new_string`（必填）、`replace_all`
**返回**：`path`、`replacements`

---

### file/search

搜索文件。

| 属性 | 值 |
|------|-----|
| 类型 | Request |
| 方向 | Client/Agent -> Server |
| 详见 | [file-methods.md](./file-methods.md#filesearch) |

**核心参数**：`pattern`（必填）、`path`、`file_pattern`、`max_results`
**返回**：`matches[]`、`total`

---

### file/list

列出目录。

| 属性 | 值 |
|------|-----|
| 类型 | Request |
| 方向 | Client/Agent -> Server |
| 详见 | [file-methods.md](./file-methods.md#filelist) |

**核心参数**：`path`（必填）、`recursive`、`pattern`、`ignore`
**返回**：`entries[]`、`total`

---

## Shell 执行方法

Shell 方法用于命令行操作。

### shell/execute

执行命令。

| 属性 | 值 |
|------|-----|
| 类型 | Request |
| 方向 | Client/Agent -> Server |
| 详见 | [shell-methods.md](./shell-methods.md#shellexecute) |

**核心参数**：`command`（必填）、`working_dir`、`env`、`timeout`、`background`
**返回**：`process_id`、`status`、`exit_code`、`stdout`、`stderr`

---

### shell/output

命令输出（流式）。

| 属性 | 值 |
|------|-----|
| 类型 | Notification |
| 方向 | Server -> Client |
| 详见 | [shell-methods.md](./shell-methods.md#shelloutput) |

**核心参数**：`process_id`、`stream`（`stdout`/`stderr`）、`data`

---

### shell/exit

命令退出。

| 属性 | 值 |
|------|-----|
| 类型 | Notification |
| 方向 | Server -> Client |
| 详见 | [shell-methods.md](./shell-methods.md#shellexit) |

**核心参数**：`process_id`、`exit_code`、`signal`

---

### shell/kill

终止进程。

| 属性 | 值 |
|------|-----|
| 类型 | Request |
| 方向 | Client/Agent -> Server |
| 详见 | [shell-methods.md](./shell-methods.md#shellkill) |

**核心参数**：`process_id`（必填）、`signal`
**返回**：`process_id`、`killed`

---

## 方法统计

| 分类 | 方法数 | Request | Notification |
|------|--------|---------|--------------|
| Agent | 10 | 4 | 6 |
| File | 5 | 5 | 0 |
| Shell | 4 | 2 | 2 |
| **合计** | **19** | **11** | **8** |

---

*Phase 1 方法定义 v1.0.0*
*创建日期：2026-07-05*
