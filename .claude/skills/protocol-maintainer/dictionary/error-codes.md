# 错误码参考

## 标准 JSON-RPC 2.0 错误码

| 错误码 | 名称 | 说明 | 典型触发场景 |
|--------|------|------|--------------|
| -32700 | Parse Error | JSON 解析失败，请求格式无效 | 发送了无效的 JSON 字符串 |
| -32600 | Invalid Request | 请求不符合 JSON-RPC 2.0 规范 | 缺少 `jsonrpc` 字段或 `method` 字段 |
| -32601 | Method Not Found | 请求的方法不存在 | 调用了未定义的方法，如 `file/delete` |
| -32602 | Invalid Params | 参数无效或缺少必填参数 | 缺少 `agent_id` 或参数类型错误 |
| -32603 | Internal Error | 服务端内部错误 | 服务器未捕获的异常 |

---

## CodeY 扩展错误码

| 错误码 | 名称 | 说明 | 典型触发场景 |
|--------|------|------|--------------|
| -32000 | Agent Error | Agent 运行时错误 | Agent 状态异常、资源不足、模型调用失败 |
| -32001 | Permission Denied | 权限不足，操作被拒绝 | 尝试执行未授权的工具或访问受限资源 |
| -32002 | Tool Error | 工具执行失败 | 文件不存在、命令超时、权限不足 |
| -32003 | LLM Error | LLM 调用失败 | API 超时、token 耗尽、模型不可用 |
| -32004 | Timeout | 操作超时 | 命令执行超时、网络请求超时 |

---

## 错误响应格式

```json
{
  "jsonrpc": "2.0",
  "error": {
    "code": -32001,
    "message": "Permission Denied",
    "data": {
      "tool": "shell/execute",
      "reason": "不允许执行 rm -rf 命令"
    }
  },
  "id": "req-001"
}
```

### 错误字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| code | number | 错误码 |
| message | string | 错误名称 |
| data | object | 附加错误数据（可选） |

---

## 错误处理最佳实践

### 客户端错误处理

```javascript
async function sendRequest(method, params) {
  const response = await sendJsonRpc(method, params);

  if (response.error) {
    switch (response.error.code) {
      case -32001: // Permission Denied
        // 请求用户授权
        return await requestPermission(response.error.data);
      case -32002: // Tool Error
        // 重试或报告错误
        return await handleToolError(response.error.data);
      case -32003: // LLM Error
        // 切换模型或等待重试
        return await handleLLMError(response.error.data);
      default:
        // 其他错误
        throw new Error(`RPC Error ${response.error.code}: ${response.error.message}`);
    }
  }

  return response.result;
}
```

### 服务端错误响应

```javascript
function createErrorResponse(id, code, message, data = null) {
  return {
    jsonrpc: "2.0",
    error: {
      code,
      message,
      data
    },
    id
  };
}

// 使用示例
return createErrorResponse(
  request.id,
  -32001,
  "Permission Denied",
  { tool: "shell/execute", reason: "需要用户授权" }
);
```

---

## 自定义错误码扩展

### 错误码范围分配

| 范围 | 用途 |
|------|------|
| -32700 到 -32600 | JSON-RPC 2.0 标准错误码 |
| -32000 到 -32099 | CodeY 扩展错误码 |
| -32100 到 -32199 | 第三方扩展错误码 |
| -32200 到 -32299 | 内部实验性错误码 |

### 新增错误码流程

1. 确定错误码范围（-32000 到 -32099 保留给 CodeY 扩展）
2. 命名规范：大写下划线分隔（如 `AGENT_CRASHED`）
3. 在错误码参考中添加条目
4. 递增 PATCH 版本号
5. 更新 CHANGELOG

### 示例：新增错误码

```markdown
| -32005 | Rate Limit Exceeded | 请求频率超过限制 | 短时间内发送大量请求 |
```
