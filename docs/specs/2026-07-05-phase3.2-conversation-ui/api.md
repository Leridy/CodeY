# Phase 3.2 对话界面 API 文档

> 日期：2026-07-05
> 版本：v1.0.0
> 状态：draft

## 1. 类型定义

### 1.1 ChatMessage

```typescript
/** 消息角色 */
type MessageRole = 'user' | 'assistant' | 'system';

/** 消息状态 */
type MessageStatus = 'sending' | 'streaming' | 'completed' | 'error';

/** 聊天消息 */
interface ChatMessage {
  /** 消息唯一 ID (UUID v4) */
  id: string;
  /** 消息角色 */
  role: MessageRole;
  /** 消息内容（Markdown 格式） */
  content: string;
  /** 创建时间戳（Unix 毫秒） */
  timestamp: number;
  /** 工具调用列表 */
  toolCalls: ToolCallState[];
  /** 父消息 ID（用于分支，null 表示主干消息） */
  parentId: string | null;
  /** 分支索引（0 = 主干，1+ = 分支） */
  branchIndex: number;
  /** 消息状态 */
  status: MessageStatus;
  /** Token 使用量（仅 assistant 消息） */
  usage?: TokenUsage;
}

/** Token 使用量 */
interface TokenUsage {
  /** 输入 Token 数 */
  promptTokens: number;
  /** 输出 Token 数 */
  completionTokens: number;
  /** 总 Token 数 */
  totalTokens: number;
}
```

### 1.2 ToolCallState

```typescript
/** 工具调用执行状态 */
type ToolCallStatus = 'pending' | 'running' | 'completed' | 'error';

/** 工具调用状态 */
interface ToolCallState {
  /** 调用唯一 ID */
  id: string;
  /** 工具名称（如 "file/read", "shell/execute"） */
  name: string;
  /** 调用参数（JSON 字符串） */
  arguments: string;
  /** 执行状态 */
  status: ToolCallStatus;
  /** 执行结果 */
  result?: string;
  /** 错误信息 */
  error?: string;
  /** 开始时间（Unix 毫秒） */
  startTime?: number;
  /** 结束时间（Unix 毫秒） */
  endTime?: number;
}
```

### 1.3 ChatSession

```typescript
/** 对话会话 */
interface ChatSession {
  /** 会话唯一 ID (UUID v4) */
  id: string;
  /** 会话标题（自动生成或用户设置） */
  title: string;
  /** 消息列表 */
  messages: ChatMessage[];
  /** 创建时间（Unix 毫秒） */
  createdAt: number;
  /** 最后更新时间（Unix 毫秒） */
  updatedAt: number;
  /** 使用的模型名称 */
  model: string;
  /** 使用的提供商名称 */
  provider: string;
  /** 会话标签 */
  tags?: string[];
}
```

### 1.4 StreamChunk

```typescript
/** 流式数据块类型 */
type StreamChunkType = 'text' | 'tool_call' | 'tool_result' | 'error' | 'done';

/** 流式数据块（镜像后端 AgentStreamChunk） */
interface StreamChunk {
  /** 数据块类型 */
  type: StreamChunkType;
  /** 数据块 ID */
  id: string;
  /** 关联的消息 ID */
  messageId: string;
  /** 文本内容（type=text 时） */
  content?: string;
  /** 工具调用信息（type=tool_call 时） */
  toolCall?: Partial<ToolCallState>;
  /** 工具执行结果（type=tool_result 时） */
  toolResult?: {
    id: string;
    result?: string;
    error?: string;
  };
  /** 错误信息（type=error 时） */
  error?: string;
  /** 使用量（type=done 时） */
  usage?: TokenUsage;
}
```

---

## 2. Tauri 事件 API

### 2.1 事件名称约定

| 事件名称 | 方向 | 说明 |
|----------|------|------|
| `chat:stream:chunk` | Rust -> Frontend | 流式数据块 |
| `chat:stream:start` | Rust -> Frontend | 流式开始 |
| `chat:stream:end` | Rust -> Frontend | 流式结束 |
| `chat:stream:error` | Rust -> Frontend | 流式错误 |
| `chat:tool:progress` | Rust -> Frontend | 工具执行进度 |

### 2.2 chat:stream:chunk

流式响应的核心事件，传输文本片段和工具调用信息。

**Payload**：
```typescript
interface StreamChunkEvent {
  /** 数据块类型 */
  type: 'text' | 'tool_call' | 'tool_result';
  /** 数据块 ID */
  id: string;
  /** 关联的消息 ID */
  messageId: string;
  /** 文本内容（type=text） */
  content?: string;
  /** 工具调用（type=tool_call） */
  toolCall?: {
    id: string;
    name: string;
    arguments: string;
  };
  /** 工具结果（type=tool_result） */
  toolResult?: {
    id: string;
    result?: string;
    error?: string;
  };
}
```

**使用示例**：
```typescript
import { listen } from '@tauri-apps/api/event';

const unlisten = await listen<StreamChunkEvent>('chat:stream:chunk', (event) => {
  const { type, content, toolCall } = event.payload;

  if (type === 'text' && content) {
    chatStore.appendStreamContent(event.payload.messageId, content);
  } else if (type === 'tool_call' && toolCall) {
    chatStore.addToolCall(event.payload.messageId, toolCall);
  }
});
```

### 2.3 chat:stream:start

流式响应开始事件。

**Payload**：
```typescript
interface StreamStartEvent {
  /** 关联的消息 ID */
  messageId: string;
  /** 使用的模型 */
  model: string;
  /** 使用的提供商 */
  provider: string;
}
```

### 2.4 chat:stream:end

流式响应结束事件。

**Payload**：
```typescript
interface StreamEndEvent {
  /** 关联的消息 ID */
  messageId: string;
  /** Token 使用量 */
  usage: TokenUsage;
  /** 完成原因 */
  finishReason: 'stop' | 'length' | 'error';
}
```

### 2.5 chat:stream:error

流式响应错误事件。

**Payload**：
```typescript
interface StreamErrorEvent {
  /** 关联的消息 ID */
  messageId: string;
  /** 错误代码 */
  code: string;
  /** 错误消息 */
  message: string;
  /** 是否可重试 */
  retryable: boolean;
}
```

### 2.6 chat:tool:progress

工具执行进度更新事件。

**Payload**：
```typescript
interface ToolProgressEvent {
  /** 关联的消息 ID */
  messageId: string;
  /** 工具调用 ID */
  toolCallId: string;
  /** 工具名称 */
  name: string;
  /** 执行状态 */
  status: ToolCallStatus;
  /** 进度信息（可选） */
  progress?: {
    /** 当前步骤 */
    current: number;
    /** 总步骤数 */
    total: number;
    /** 步骤描述 */
    description?: string;
  };
}
```

---

## 3. Tauri 命令 API

### 3.1 chat:send_message

发送用户消息并启动 Agent 对话。

**请求**：
```typescript
interface SendMessageRequest {
  /** 会话 ID */
  sessionId: string;
  /** 消息内容 */
  content: string;
  /** 使用的模型（可选，默认使用会话模型） */
  model?: string;
  /** 使用的提供商（可选，默认使用会话提供商） */
  provider?: string;
}
```

**响应**：
```typescript
interface SendMessageResponse {
  /** 创建的用户消息 */
  userMessage: ChatMessage;
  /** 创建的助手消息（初始为空，通过流式填充） */
  assistantMessage: ChatMessage;
}
```

**错误码**：
| 错误代码 | 说明 |
|----------|------|
| `SESSION_NOT_FOUND` | 会话不存在 |
| `INVALID_CONTENT` | 消息内容为空 |
| `MODEL_NOT_AVAILABLE` | 指定模型不可用 |
| `AGENT_BUSY` | Agent 正在处理其他请求 |

**使用示例**：
```typescript
import { invoke } from '@tauri-apps/api/core';

const response = await invoke<SendMessageResponse>('chat:send_message', {
  sessionId: 'session-123',
  content: '请帮我分析这段代码',
});
```

### 3.2 chat:stop_generation

停止当前正在进行的流式生成。

**请求**：
```typescript
interface StopGenerationRequest {
  /** 消息 ID */
  messageId: string;
}
```

**响应**：
```typescript
interface StopGenerationResponse {
  /** 是否成功停止 */
  stopped: boolean;
  /** 已生成的内容 */
  partialContent: string;
}
```

**错误码**：
| 错误代码 | 说明 |
|----------|------|
| `MESSAGE_NOT_FOUND` | 消息不存在 |
| `NOT_STREAMING` | 消息不在流式状态 |

### 3.3 chat:create_session

创建新的对话会话。

**请求**：
```typescript
interface CreateSessionRequest {
  /** 会话标题（可选，默认自动生成） */
  title?: string;
  /** 使用的模型 */
  model?: string;
  /** 使用的提供商 */
  provider?: string;
  /** 初始系统提示（可选） */
  systemPrompt?: string;
}
```

**响应**：
```typescript
interface CreateSessionResponse {
  /** 创建的会话 */
  session: ChatSession;
}
```

### 3.4 chat:delete_session

删除对话会话。

**请求**：
```typescript
interface DeleteSessionRequest {
  /** 会话 ID */
  sessionId: string;
}
```

**响应**：
```typescript
interface DeleteSessionResponse {
  /** 是否成功删除 */
  deleted: boolean;
}
```

**错误码**：
| 错误代码 | 说明 |
|----------|------|
| `SESSION_NOT_FOUND` | 会话不存在 |

### 3.5 chat:rename_session

重命名对话会话。

**请求**：
```typescript
interface RenameSessionRequest {
  /** 会话 ID */
  sessionId: string;
  /** 新标题 */
  title: string;
}
```

**响应**：
```typescript
interface RenameSessionResponse {
  /** 更新后的会话 */
  session: ChatSession;
}
```

**错误码**：
| 错误代码 | 说明 |
|----------|------|
| `SESSION_NOT_FOUND` | 会话不存在 |
| `INVALID_TITLE` | 标题为空或过长 |

### 3.6 chat:create_branch

从指定消息创建分支。

**请求**：
```typescript
interface CreateBranchRequest {
  /** 会话 ID */
  sessionId: string;
  /** 分支起点消息 ID */
  messageId: string;
  /** 新消息内容 */
  content: string;
}
```

**响应**：
```typescript
interface CreateBranchResponse {
  /** 创建的用户消息（分支） */
  userMessage: ChatMessage;
  /** 创建的助手消息（分支，初始为空） */
  assistantMessage: ChatMessage;
}
```

**错误码**：
| 错误代码 | 说明 |
|----------|------|
| `SESSION_NOT_FOUND` | 会话不存在 |
| `MESSAGE_NOT_FOUND` | 消息不存在 |
| `MAX_BRANCHES_REACHED` | 达到最大分支数 |

---

## 4. Store API

### 4.1 ChatStore Actions

```typescript
interface ChatStore {
  // --- State ---
  /** 当前活跃会话 ID */
  activeSessionId: string | null;
  /** 是否正在流式输出 */
  isStreaming: boolean;
  /** 当前流式消息 ID */
  streamingMessageId: string | null;
  /** 流式内容缓冲区 */
  streamBuffer: string;

  // --- Message actions ---
  /** 添加用户消息 */
  addUserMessage: (sessionId: string, content: string) => ChatMessage;
  /** 添加助手消息（初始） */
  addAssistantMessage: (sessionId: string) => ChatMessage;
  /** 更新消息内容 */
  updateMessage: (sessionId: string, messageId: string, content: string) => void;
  /** 删除消息 */
  deleteMessage: (sessionId: string, messageId: string) => void;

  // --- Streaming actions ---
  /** 开始流式输出 */
  startStreaming: (messageId: string) => void;
  /** 追加流式内容 */
  appendStreamContent: (messageId: string, content: string) => void;
  /** 添加工具调用 */
  addToolCall: (messageId: string, toolCall: Partial<ToolCallState>) => void;
  /** 更新工具调用状态 */
  updateToolCall: (messageId: string, toolCallId: string, update: Partial<ToolCallState>) => void;
  /** 完成流式输出 */
  finalizeStreaming: (messageId: string, usage?: TokenUsage) => void;
  /** 流式错误 */
  streamError: (messageId: string, error: string) => void;

  // --- Branch actions ---
  /** 切换分支 */
  switchBranch: (sessionId: string, messageId: string, branchIndex: number) => void;
  /** 创建分支 */
  createBranch: (sessionId: string, messageId: string, content: string) => ChatMessage;

  // --- Session actions ---
  /** 设置活跃会话 */
  setActiveSession: (sessionId: string | null) => void;
  /** 获取当前消息列表（考虑分支） */
  getMessages: (sessionId: string) => ChatMessage[];
}
```

### 4.2 SessionStore Actions

```typescript
interface SessionStore {
  // --- State ---
  /** 所有会话 */
  sessions: Record<string, ChatSession>;
  /** 会话列表（按更新时间排序） */
  sessionList: ChatSession[];

  // --- CRUD actions ---
  /** 创建会话 */
  createSession: (options?: CreateSessionOptions) => ChatSession;
  /** 删除会话 */
  deleteSession: (sessionId: string) => void;
  /** 重命名会话 */
  renameSession: (sessionId: string, title: string) => void;
  /** 获取会话 */
  getSession: (sessionId: string) => ChatSession | undefined;

  // --- Persistence actions ---
  /** 保存到 localStorage */
  saveToStorage: () => void;
  /** 从 localStorage 加载 */
  loadFromStorage: () => void;
  /** 清除所有数据 */
  clearAll: () => void;
}

interface CreateSessionOptions {
  title?: string;
  model?: string;
  provider?: string;
  systemPrompt?: string;
}
```

---

## 5. Hooks API

### 5.1 useChat

核心对话 Hook，整合消息发送和流式监听。

```typescript
function useChat(options?: UseChatOptions): {
  /** 当前会话消息列表 */
  messages: ChatMessage[];
  /** 是否正在流式输出 */
  isStreaming: boolean;
  /** 发送消息 */
  send: (content: string) => Promise<void>;
  /** 停止生成 */
  stop: () => Promise<void>;
  /** 当前模型 */
  model: string;
  /** 切换模型 */
  setModel: (model: string) => void;
};

interface UseChatOptions {
  /** 会话 ID（可选，默认使用 activeSessionId） */
  sessionId?: string;
  /** 发送完成回调 */
  onSendComplete?: (message: ChatMessage) => void;
  /** 流式完成回调 */
  onStreamComplete?: (message: ChatMessage) => void;
  /** 错误回调 */
  onError?: (error: Error) => void;
}
```

### 5.2 useStreamListener

Tauri 事件监听 Hook，处理流式数据。

```typescript
function useStreamListener(options: {
  /** 是否启用监听 */
  enabled?: boolean;
  /** 文本块回调 */
  onText?: (messageId: string, content: string) => void;
  /** 工具调用回调 */
  onToolCall?: (messageId: string, toolCall: Partial<ToolCallState>) => void;
  /** 工具结果回调 */
  onToolResult?: (messageId: string, result: { id: string; result?: string; error?: string }) => void;
  /** 流式开始回调 */
  onStart?: (messageId: string) => void;
  /** 流式结束回调 */
  onEnd?: (messageId: string, usage?: TokenUsage) => void;
  /** 错误回调 */
  onError?: (messageId: string, error: string) => void;
}): void;
```

### 5.3 useSession

会话管理 Hook。

```typescript
function useSession(): {
  /** 当前活跃会话 */
  activeSession: ChatSession | null;
  /** 所有会话列表 */
  sessions: ChatSession[];
  /** 创建会话 */
  create: (options?: CreateSessionOptions) => ChatSession;
  /** 切换会话 */
  switchTo: (sessionId: string) => void;
  /** 删除会话 */
  remove: (sessionId: string) => void;
  /** 重命名会话 */
  rename: (sessionId: string, title: string) => void;
};
```

### 5.4 useAutoScroll

自动滚动 Hook，用于消息列表。

```typescript
function useAutoScroll(options?: {
  /** 是否启用自动滚动（默认: true） */
  enabled?: boolean;
  /** 滚动触发阈值（px, 默认: 100） */
  threshold?: number;
}): {
  /** 滚动容器 ref */
  scrollRef: React.RefObject<HTMLDivElement>;
  /** 是否已滚动到底部 */
  isAtBottom: boolean;
  /** 手动滚动到底部 */
  scrollToBottom: (behavior?: ScrollBehavior) => void;
  /** 禁用自动滚动（用户手动滚动时） */
  disableAutoScroll: () => void;
  /** 重新启用自动滚动 */
  enableAutoScroll: () => void;
};
```

---

## 6. localStorage 存储格式

### 6.1 存储 Keys

| Key | 说明 |
|-----|------|
| `codey-chat-sessions` | 会话数据 |
| `codey-chat-settings` | 对话设置 |

### 6.2 codey-chat-sessions

```typescript
interface ChatSessionsPersistData {
  /** 版本号，用于迁移 */
  version: number;
  /** 所有会话 */
  sessions: Record<string, ChatSession>;
  /** 活跃会话 ID */
  activeSessionId: string | null;
}
```

**示例数据**：
```json
{
  "version": 1,
  "sessions": {
    "session-001": {
      "id": "session-001",
      "title": "代码分析对话",
      "messages": [
        {
          "id": "msg-001",
          "role": "user",
          "content": "请帮我分析这段代码",
          "timestamp": 1720166400000,
          "toolCalls": [],
          "parentId": null,
          "branchIndex": 0,
          "status": "completed"
        }
      ],
      "createdAt": 1720166400000,
      "updatedAt": 1720166500000,
      "model": "claude-sonnet-4-20250514",
      "provider": "anthropic"
    }
  },
  "activeSessionId": "session-001"
}
```

### 6.3 codey-chat-settings

```typescript
interface ChatSettingsPersistData {
  /** 版本号 */
  version: number;
  /** 默认模型 */
  defaultModel: string;
  /** 默认提供商 */
  defaultProvider: string;
  /** 系统提示 */
  systemPrompt?: string;
  /** 发送快捷键 */
  sendShortcut: 'enter' | 'ctrl+enter';
  /** 代码主题 */
  codeTheme: string;
  /** 字体大小 */
  fontSize: number;
}
```

---

## 7. 错误码汇总

| 错误代码 | HTTP 等价 | 说明 | 可重试 |
|----------|-----------|------|--------|
| `SESSION_NOT_FOUND` | 404 | 会话不存在 | 否 |
| `MESSAGE_NOT_FOUND` | 404 | 消息不存在 | 否 |
| `INVALID_CONTENT` | 400 | 消息内容为空 | 否 |
| `INVALID_TITLE` | 400 | 标题无效 | 否 |
| `MODEL_NOT_AVAILABLE` | 503 | 模型不可用 | 是 |
| `AGENT_BUSY` | 429 | Agent 正忙 | 是 |
| `NOT_STREAMING` | 400 | 不在流式状态 | 否 |
| `MAX_BRANCHES_REACHED` | 400 | 达到最大分支数 | 否 |
| `STREAM_ERROR` | 500 | 流式传输错误 | 是 |
| `STORAGE_ERROR` | 500 | 存储错误 | 是 |
| `NETWORK_ERROR` | 503 | 网络错误 | 是 |

---

*API 文档版本: v1.0.0*
*最后更新: 2026-07-05*
