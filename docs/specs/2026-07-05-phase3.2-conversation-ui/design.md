# Phase 3.2 对话界面 设计文档

> 日期：2026-07-05
> 版本：v1.0.0
> 状态：draft
> 阶段：Phase 3.2 - 对话界面

## 1. 概述

### 1.1 功能描述

Phase 3.2 是 Phase 3 前端 UI 的第二个子阶段，目标是实现完整的对话界面系统。包括消息列表展示、流式响应渲染、工具调用可视化、会话管理和分支线程功能。该阶段将构建 CodeY 的核心交互界面，让用户能够与 AI Agent 进行流畅的对话。

### 1.2 设计目标

| 目标 | 说明 |
|------|------|
| 流畅对话体验 | 支持流式消息渲染，实时显示 AI 响应 |
| Markdown 渲染 | 完整支持 GFM 语法、代码高亮、表格等 |
| 工具调用可视化 | 清晰展示 Agent 工具调用过程和结果 |
| 会话管理 | 支持多会话切换、历史记录保存 |
| 分支线程 | 支持从任意消息创建分支，探索不同对话路径 |
| 高性能渲染 | 虚拟化列表，支持大量消息流畅滚动 |

### 1.3 头脑风暴决策

| 问题 | 决策 | 说明 |
|------|------|------|
| 消息列表方案 | react-virtuoso | 虚拟化列表，性能优异，支持动态高度 |
| 流式响应模式 | Tauri Events | 通过 Tauri 事件系统接收流式数据 |
| Markdown 渲染 | react-markdown + remark-gfm | 生态成熟，扩展性强 |
| 代码高亮 | react-syntax-highlighter | 支持多主题，行号显示 |
| 会话存储 | 渐进式（先 localStorage） | 快速实现，后续可迁移到 SQLite |
| 状态管理 | Zustand | 与现有架构一致，轻量高效 |

---

## 2. 架构设计

### 2.1 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                    Phase 3.2 对话界面架构                      │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                 ChatPanel (对话面板)                  │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │    │
│  │  │ SessionSide │  │ MessageList │  │ ChatInput   │ │    │
│  │  │ bar         │  │ (消息列表)   │  │ (输入框)    │ │    │
│  │  │ (会话侧边栏) │  │             │  │             │ │    │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘ │    │
│  └─────────┼────────────────┼────────────────┼─────────┘    │
│            │                │                │              │
│  ┌─────────▼────────────────▼────────────────▼─────────┐    │
│  │              ChatStore (对话状态管理)                 │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │    │
│  │  │ SessionMgr  │  │ MessageMgr  │  │ StreamMgr   │ │    │
│  │  │ (会话管理)   │  │ (消息管理)   │  │ (流式管理)   │ │    │
│  │  └─────────────┘  └─────────────┘  └─────────────┘ │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              Tauri Bridge (桥接层)                   │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │    │
│  │  │ EventListen │  │ AgentCall   │  │ StreamChun  │ │    │
│  │  │ er          │  │ (Agent调用)  │  │ k           │ │    │
│  │  │ (事件监听)   │  │             │  │ (流式数据块) │ │    │
│  │  └─────────────┘  └─────────────┘  └─────────────┘ │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 组件层次结构

```
ChatPanel (对话面板主组件)
├── SessionSidebar (会话侧边栏 - 可折叠)
│   ├── SessionList (会话列表)
│   │   └── SessionItem (会话项) x N
│   └── NewSessionButton (新建会话按钮)
├── ChatMain (对话主区域)
│   ├── MessageList (消息列表 - 虚拟化)
│   │   └── MessageBubble (消息气泡) x N
│   │       ├── MessageContent (消息内容 - Markdown渲染)
│   │       │   ├── CodeBlock (代码块)
│   │       │   └── CopyButton (复制按钮)
│   │       ├── ToolCallCard (工具调用卡片) x N
│   │       └── BranchNavigator (分支导航器)
│   ├── StreamIndicator (流式指示器)
│   ├── EmptyState (空状态)
│   └── ChatInput (输入区域)
│       ├── TextArea (文本输入)
│       ├── ModelSelector (模型选择器)
│       └── SendButton (发送按钮)
```

### 2.3 数据流

```
用户输入消息
      │
      ▼
ChatInput.handleSubmit()
      │
      ▼
ChatStore.addMessage(userMessage)
      │
      ▼
TauriBridge.invokeAgent(message)
      │
      ▼
Tauri Events: "agent:stream:chunk"
      │
      ▼
useStreamListener() 接收流式数据
      │
      ▼
ChatStore.updateStreamingContent(chunk)
      │
      ▼
MessageList 虚拟化重新渲染
      │
      ▼
MessageContent Markdown 实时渲染
      │
      ▼
流式完成 -> ChatStore.finalizeMessage()
      │
      ▼
SessionStore 保存到 localStorage
```

---

## 3. 模块详细设计

### 3.1 ChatPanel（对话面板）

对话界面的顶层容器组件，整合会话侧边栏、消息列表和输入框。

**职责**：
- 管理对话面板的整体布局
- 协调会话侧边栏的显示/隐藏
- 处理面板与 GridContainer 的集成

**Props**：
```typescript
interface ChatPanelProps {
  /** 面板 ID（用于 GridContainer 集成） */
  panelId?: string;
  /** 默认显示会话侧边栏 */
  showSidebar?: boolean;
  /** 自定义类名 */
  className?: string;
}
```

### 3.2 MessageList（消息列表）

基于 react-virtuoso 的虚拟化消息列表，支持大量消息的高性能渲染。

**职责**：
- 虚拟化渲染消息列表
- 自动滚动到最新消息
- 支持滚动到历史消息
- 处理动态高度消息

**Props**：
```typescript
interface MessageListProps {
  /** 消息列表 */
  messages: ChatMessage[];
  /** 是否正在流式输出 */
  isStreaming?: boolean;
  /** 消息渲染组件 */
  renderMessage?: (message: ChatMessage) => React.ReactNode;
  /** 滚动到底部回调 */
  onScrollToBottom?: () => void;
  /** 自定义类名 */
  className?: string;
}
```

### 3.3 MessageBubble（消息气泡）

单条消息的容器组件，根据消息角色应用不同样式。

**职责**：
- 根据 role 应用不同样式（user/assistant/system）
- 渲染消息头像和时间戳
- 集成 MessageContent 和 ToolCallCard
- 支持分支导航

**Props**：
```typescript
interface MessageBubbleProps {
  /** 消息数据 */
  message: ChatMessage;
  /** 是否显示头像 */
  showAvatar?: boolean;
  /** 是否显示时间戳 */
  showTimestamp?: boolean;
  /** 分支选择回调 */
  onBranchSelect?: (branchIndex: number) => void;
  /** 自定义类名 */
  className?: string;
}
```

### 3.4 MessageContent（消息内容）

Markdown 渲染组件，支持 GFM 语法和代码高亮。

**职责**：
- 解析并渲染 Markdown 内容
- 代码块语法高亮
- 代码块复制功能
- 支持表格、列表、链接等 GFM 语法

**Props**：
```typescript
interface MessageContentProps {
  /** Markdown 内容 */
  content: string;
  /** 是否正在流式输出（影响渲染优化） */
  isStreaming?: boolean;
  /** 自定义类名 */
  className?: string;
}
```

### 3.5 ToolCallCard（工具调用卡片）

展示 Agent 工具调用过程和结果的卡片组件。

**职责**：
- 显示工具名称和参数
- 展示工具执行状态（pending/running/completed/error）
- 折叠/展开详细信息
- 显示工具执行结果或错误

**Props**：
```typescript
interface ToolCallCardProps {
  /** 工具调用状态 */
  toolCall: ToolCallState;
  /** 默认是否展开 */
  defaultExpanded?: boolean;
  /** 自定义类名 */
  className?: string;
}
```

### 3.6 ChatInput（对话输入框）

用户输入消息的区域组件。

**职责**：
- 多行文本输入
- 发送消息（Enter 发送，Shift+Enter 换行）
- 模型选择器
- 发送按钮状态管理
- 输入历史（上下键）

**Props**：
```typescript
interface ChatInputProps {
  /** 是否禁用 */
  disabled?: boolean;
  /** 占位文本 */
  placeholder?: string;
  /** 发送回调 */
  onSend: (message: string) => void;
  /** 自定义类名 */
  className?: string;
}
```

### 3.7 StreamIndicator（流式指示器）

显示 AI 正在生成响应的动画指示器。

**职责**：
- 显示流式输出动画
- 显示当前模型信息
- 支持停止生成操作

**Props**：
```typescript
interface StreamIndicatorProps {
  /** 是否正在流式输出 */
  isStreaming: boolean;
  /** 当前模型名称 */
  model?: string;
  /** 停止生成回调 */
  onStop?: () => void;
  /** 自定义类名 */
  className?: string;
}
```

### 3.8 BranchNavigator（分支导航器）

支持从任意消息创建和切换分支的导航组件。

**职责**：
- 显示当前分支索引
- 切换到不同分支
- 创建新分支
- 显示分支总数

**Props**：
```typescript
interface BranchNavigatorProps {
  /** 当前分支索引 */
  currentIndex: number;
  /** 分支总数 */
  totalBranches: number;
  /** 切换分支回调 */
  onSwitch: (index: number) => void;
  /** 创建新分支回调 */
  onCreateBranch?: () => void;
  /** 自定义类名 */
  className?: string;
}
```

### 3.9 SessionSidebar（会话侧边栏）

会话管理的侧边栏组件。

**职责**：
- 显示会话列表
- 新建会话
- 切换会话
- 删除会话
- 会话搜索

**Props**：
```typescript
interface SessionSidebarProps {
  /** 是否显示 */
  visible: boolean;
  /** 当前会话 ID */
  activeSessionId: string | null;
  /** 会话列表 */
  sessions: ChatSession[];
  /** 选择会话回调 */
  onSelect: (sessionId: string) => void;
  /** 新建会话回调 */
  onNewSession: () => void;
  /** 删除会话回调 */
  onDelete: (sessionId: string) => void;
  /** 关闭侧边栏回调 */
  onClose: () => void;
  /** 自定义类名 */
  className?: string;
}
```

### 3.10 EmptyState（空状态）

无消息时显示的空状态组件。

**职责**：
- 显示欢迎信息
- 提供快捷操作入口
- 引导用户开始对话

**Props**：
```typescript
interface EmptyStateProps {
  /** 快捷操作列表 */
  suggestions?: Array<{
    icon: React.ReactNode;
    title: string;
    description: string;
    onClick: () => void;
  }>;
  /** 自定义类名 */
  className?: string;
}
```

---

## 4. 数据模型

### 4.1 ChatMessage（聊天消息）

```typescript
/** 消息角色 */
type MessageRole = 'user' | 'assistant' | 'system';

/** 消息状态 */
type MessageStatus = 'sending' | 'streaming' | 'completed' | 'error';

/** 聊天消息 */
interface ChatMessage {
  /** 消息唯一 ID */
  id: string;
  /** 消息角色 */
  role: MessageRole;
  /** 消息内容（Markdown 格式） */
  content: string;
  /** 创建时间戳（Unix 毫秒） */
  timestamp: number;
  /** 工具调用列表 */
  toolCalls: ToolCallState[];
  /** 父消息 ID（用于分支） */
  parentId: string | null;
  /** 分支索引 */
  branchIndex: number;
  /** 消息状态 */
  status: MessageStatus;
  /** Token 使用量 */
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

### 4.2 ToolCallState（工具调用状态）

```typescript
/** 工具调用状态 */
type ToolCallStatus = 'pending' | 'running' | 'completed' | 'error';

/** 工具调用状态 */
interface ToolCallState {
  /** 调用唯一 ID */
  id: string;
  /** 工具名称 */
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

### 4.3 ChatSession（对话会话）

```typescript
/** 对话会话 */
interface ChatSession {
  /** 会话唯一 ID */
  id: string;
  /** 会话标题（自动生成或用户设置） */
  title: string;
  /** 消息列表 */
  messages: ChatMessage[];
  /** 创建时间（Unix 毫秒） */
  createdAt: number;
  /** 最后更新时间（Unix 毫秒） */
  updatedAt: number;
  /** 使用的模型 */
  model: string;
  /** 使用的提供商 */
  provider: string;
  /** 会话标签 */
  tags?: string[];
}
```

### 4.4 StreamChunk（流式数据块）

```typescript
/** 流式数据块类型 */
type StreamChunkType = 'text' | 'tool_call' | 'tool_result' | 'error' | 'done';

/** 流式数据块 */
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

## 5. 技术选型

### 5.1 技术栈

| 技术 | 用途 | 说明 |
|------|------|------|
| react-virtuoso | 虚拟化列表 | 高性能消息列表渲染 |
| react-markdown | Markdown 渲染 | GFM 支持，扩展性强 |
| remark-gfm | GFM 插件 | 表格、任务列表、删除线等 |
| react-syntax-highlighter | 代码高亮 | 支持多语言、多主题 |
| Zustand | 状态管理 | 与现有架构一致 |
| Tauri Events | 流式通信 | 原生事件系统，低延迟 |
| Tailwind CSS | 样式 | 工具类样式 |
| Framer Motion | 动画 | 消息入场动画、过渡效果 |

### 5.2 方案对比

#### 消息列表方案对比

| 方案 | 优势 | 劣势 | 决策 |
|------|------|------|------|
| react-window | 轻量 | 动态高度支持差 | 不采用 |
| react-virtuoso | 动态高度、自动滚动 | 包体稍大 | **采用** |
| 原生滚动 | 无依赖 | 大量消息性能差 | 不采用 |

#### 流式响应方案对比

| 方案 | 优势 | 劣势 | 决策 |
|------|------|------|------|
| WebSocket | 双向通信 | 需额外服务 | 不采用 |
| SSE | 标准协议 | 单向、需 HTTP | 不采用 |
| Tauri Events | 原生集成、低延迟 | Tauri 专属 | **采用** |

#### Markdown 渲染方案对比

| 方案 | 优势 | 劣势 | 决策 |
|------|------|------|------|
| marked | 性能好 | 扩展性一般 | 不采用 |
| react-markdown | React 集成、扩展性强 | 性能稍差 | **采用** |
| 自定义解析 | 完全可控 | 开发成本高 | 不采用 |

---

## 6. 与现有代码的集成

### 6.1 布局集成

ChatPanel 将作为 PanelSlot 的内容集成到 GridContainer 布局系统中。

```tsx
// 集成示例
<GridContainer gridConfig={layoutStore.gridConfig}>
  <PanelSlot panelId="chat" title="聊天" icon={<ChatIcon />}>
    <ChatPanel />
  </PanelSlot>
  {/* 其他面板 */}
</GridContainer>
```

### 6.2 Store 集成

ChatStore 和 SessionStore 与现有 LayoutStore 并行管理，不修改现有 Store 结构。

```
stores/
├── layoutStore.ts    # 现有布局 Store（不修改）
├── chatStore.ts      # 新增对话 Store
└── sessionStore.ts   # 新增会话 Store
```

### 6.3 类型集成

新增类型定义在 `src/types/chat.ts`，与现有 `layout.ts` 和 `grid.ts` 并行。

```
types/
├── layout.ts         # 现有布局类型（不修改）
├── grid.ts           # 现有网格类型（不修改）
└── chat.ts           # 新增对话类型
```

### 6.4 Hook 集成

新增 Hook 在 `src/hooks/` 目录下，与现有 Hook 并行。

```
hooks/
├── useGridLayout.ts      # 现有（不修改）
├── usePanelDrag.ts       # 现有（不修改）
├── useStreaming.ts       # 现有（不修改，可复用）
├── useChat.ts            # 新增
├── useStreamListener.ts  # 新增
├── useSession.ts         # 新增
└── useAutoScroll.ts      # 新增
```

---

## 7. 实现顺序

```
Phase 3.2.1: 基础对话
  │  - ChatPanel 骨架
  │  - MessageList + MessageBubble
  │  - ChatInput
  │  - useChat Hook
  │  - Tauri 流式桥接
  │
  ▼
Phase 3.2.2: 工具调用展示
  │  - ToolCallCard 组件
  │  - 工具调用状态管理
  │  - 工具调用动画
  │
  ▼
Phase 3.2.3: 会话管理
  │  - SessionSidebar 组件
  │  - 会话 CRUD 操作
  │  - localStorage 持久化
  │
  ▼
Phase 3.2.4: 分支线程
     - BranchNavigator 组件
     - 消息分支数据结构
     - 分支切换逻辑
```

---

## 8. 响应式适配

### 8.1 断点策略

```
┌─────────────────────────────────────────────────────────────┐
│                    响应式断点策略                             │
│                                                             │
│  Mobile (<768px)                                            │
│  ┌─────────────────┐                                       │
│  │   全屏对话       │  会话侧边栏为抽屉式                     │
│  │   无侧边栏       │  输入框固定底部                         │
│  └─────────────────┘                                       │
│                                                             │
│  Tablet (768px - 1280px)                                    │
│  ┌────┬────────────┐                                       │
│  │侧边 │   消息列表  │  侧边栏可折叠                         │
│  │ 栏  │            │  输入框固定底部                         │
│  └────┴────────────┘                                       │
│                                                             │
│  Desktop (>1280px)                                          │
│  ┌────┬────────────┐                                       │
│  │侧边 │   消息列表  │  侧边栏常驻显示                       │
│  │ 栏  │            │  输入框固定底部                         │
│  └────┴────────────┘                                       │
└─────────────────────────────────────────────────────────────┘
```

### 8.2 组件可见性矩阵

| 组件 | Desktop | Tablet | Mobile |
|------|---------|--------|--------|
| SessionSidebar | 常驻 | 可折叠 | 抽屉 |
| MessageList | 主区域 | 主区域 | 全屏 |
| ChatInput | 底部固定 | 底部固定 | 底部固定 |
| ModelSelector | 显示 | 显示 | 折叠菜单 |

---

## 9. 成功标准

- [ ] 消息列表流畅渲染 1000+ 条消息
- [ ] 流式响应实时显示，延迟 < 100ms
- [ ] Markdown 完整渲染（代码块、表格、列表等）
- [ ] 代码块语法高亮和复制功能
- [ ] 工具调用过程可视化
- [ ] 会话创建、切换、删除功能
- [ ] 会话数据持久化到 localStorage
- [ ] 分支线程创建和切换
- [ ] 响应式适配 desktop/tablet/mobile
- [ ] 单元测试覆盖率 >= 80%

---

*文档版本: v1.0.0*
*最后更新: 2026-07-05*
