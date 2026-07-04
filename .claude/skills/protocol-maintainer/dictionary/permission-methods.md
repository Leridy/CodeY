# Permission 方法定义

Permission 方法用于权限管理。

---

## permission/check

检查某操作是否有权限执行。

| 方向 | 类型 | 说明 |
|------|------|------|
| Request | Request | 客户端/Agent -> 服务端 |

### Params

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| tool | string | 是 | 工具名称 |
| arguments | object | 是 | 工具参数 |

### Result

| 字段 | 类型 | 说明 |
|------|------|------|
| allowed | boolean | 是否允许 |
| reason | string | 否 | 拒绝原因 |
| requires_approval | boolean | 否 | 是否需要用户审批（默认 false） |

### 示例

```json
// Request
{ "jsonrpc": "2.0", "method": "permission/check", "params": { "tool": "shell/execute", "arguments": { "command": "rm -rf /tmp/cache" } }, "id": "30" }
// Response
{ "jsonrpc": "2.0", "result": { "allowed": false, "reason": "不允许执行危险命令", "requires_approval": true }, "id": "30" }
```

---

## permission/request

请求用户授权（Notification，服务端 -> 客户端）。

| 方向 | 类型 | 说明 |
|------|------|------|
| Notification | Notification | 服务端 -> 客户端 |

### Params

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| permission_id | string | 是 | 权限请求标识 |
| tool | string | 是 | 需要授权的工具 |
| arguments | object | 是 | 工具参数 |
| description | string | 否 | 操作描述 |

### 示例

```json
{ "jsonrpc": "2.0", "method": "permission/request", "params": { "permission_id": "perm-001", "tool": "shell/execute", "arguments": { "command": "rm -rf /tmp/cache" }, "description": "将删除临时缓存目录" } }
```

---

## permission/grant

授予权限（Notification，客户端 -> 服务端）。

| 方向 | 类型 | 说明 |
|------|------|------|
| Notification | Notification | 客户端 -> 服务端 |

### Params

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| permission_id | string | 是 | 权限请求标识 |
| granted | boolean | 是 | 是否授予 |
| scope | string | 否 | 授权范围：`once`（单次）、`session`（会话）、`always`（永久） |

### 示例

```json
{ "jsonrpc": "2.0", "method": "permission/grant", "params": { "permission_id": "perm-001", "granted": true, "scope": "once" } }
```

---

## permission/revoke

撤销权限（Notification，客户端 -> 服务端）。

| 方向 | 类型 | 说明 |
|------|------|------|
| Notification | Notification | 客户端 -> 服务端 |

### Params

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| permission_id | string | 是 | 权限标识 |
| reason | string | 否 | 撤销原因 |

### 示例

```json
{ "jsonrpc": "2.0", "method": "permission/revoke", "params": { "permission_id": "perm-001", "reason": "安全策略变更" } }
```
