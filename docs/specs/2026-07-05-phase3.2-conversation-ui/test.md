# Phase 3.2 对话界面 测试计划

> 日期：2026-07-05
> 版本：v1.0.0
> 状态：draft

## 1. 测试目标

| 目标 | 说明 |
|------|------|
| ChatPanel | 对话面板整体布局和交互 |
| MessageList | 虚拟化消息列表渲染性能 |
| MessageBubble | 消息气泡样式和内容展示 |
| MessageContent | Markdown 渲染正确性 |
| ToolCallCard | 工具调用状态展示 |
| ChatInput | 输入框交互和发送逻辑 |
| StreamIndicator | 流式指示器动画 |
| BranchNavigator | 分支导航和切换 |
| SessionSidebar | 会话管理功能 |
| ChatStore | 对话状态管理 |
| SessionStore | 会话持久化 |
| useChat | 核心对话 Hook |
| useStreamListener | 流式事件监听 |
| useAutoScroll | 自动滚动逻辑 |

---

## 2. 单元测试

### 2.1 ChatMessage 类型

| 测试场景 | 输入 | 预期结果 | 测试类型 |
|----------|------|----------|----------|
| 创建用户消息 | role='user', content='hello' | 消息对象正确创建 | 单元测试 |
| 创建助手消息 | role='assistant', content='...' | 消息对象正确创建 | 单元测试 |
| 消息状态流转 | sending -> streaming -> completed | 状态正确更新 | 单元测试 |
| 分支索引默认值 | 不指定 branchIndex | branchIndex=0 | 单元测试 |
| 父消息 ID | parentId='msg-001' | parentId 正确设置 | 单元测试 |
| Token 使用量 | usage={promptTokens:10, ...} | usage 正确关联 | 单元测试 |

### 2.2 ToolCallState

| 测试场景 | 输入 | 预期结果 | 测试类型 |
|----------|------|----------|----------|
| 创建工具调用 | name='file/read' | 工具调用对象正确创建 | 单元测试 |
| 状态流转 | pending -> running -> completed | 状态正确更新 | 单元测试 |
| 错误状态 | status='error', error='...' | 错误信息正确记录 | 单元测试 |
| 时间记录 | startTime, endTime | 时间戳正确记录 | 单元测试 |
| 参数序列化 | arguments JSON 字符串 | 参数正确序列化 | 单元测试 |

### 2.3 ChatStore

| 测试场景 | 输入 | 预期结果 | 测试类型 |
|----------|------|----------|----------|
| 添加用户消息 | addUserMessage(sessionId, content) | 消息添加到会话 | 单元测试 |
| 添加助手消息 | addAssistantMessage(sessionId) | 空助手消息创建 | 单元测试 |
| 更新消息内容 | updateMessage(sessionId, msgId, content) | 消息内容更新 | 单元测试 |
| 删除消息 | deleteMessage(sessionId, msgId) | 消息从会话移除 | 单元测试 |
| 开始流式 | startStreaming(msgId) | isStreaming=true | 单元测试 |
| 追加流式内容 | appendStreamContent(msgId, chunk) | 内容追加到消息 | 单元测试 |
| 添加工具调用 | addToolCall(msgId, toolCall) | 工具调用添加到消息 | 单元测试 |
| 更新工具调用 | updateToolCall(msgId, tcId, update) | 工具调用状态更新 | 单元测试 |
| 完成流式 | finalizeStreaming(msgId, usage) | isStreaming=false | 单元测试 |
| 流式错误 | streamError(msgId, error) | 消息状态为 error | 单元测试 |
| 切换分支 | switchBranch(sessionId, msgId, 1) | 消息列表切换到分支 | 单元测试 |
| 创建分支 | createBranch(sessionId, msgId, content) | 新分支消息创建 | 单元测试 |
| 设置活跃会话 | setActiveSession(sessionId) | activeSessionId 更新 | 单元测试 |
| 获取消息列表 | getMessages(sessionId) | 返回正确分支的消息 | 单元测试 |

### 2.4 SessionStore

| 测试场景 | 输入 | 预期结果 | 测试类型 |
|----------|------|----------|----------|
| 创建会话 | createSession({title: 'test'}) | 会话创建成功 | 单元测试 |
| 删除会话 | deleteSession(sessionId) | 会话从列表移除 | 单元测试 |
| 重命名会话 | renameSession(sessionId, 'new') | 会话标题更新 | 单元测试 |
| 获取会话 | getSession(sessionId) | 返回正确会话 | 单元测试 |
| 会话列表排序 | 多个会话 | 按 updatedAt 降序 | 单元测试 |
| 保存到 localStorage | saveToStorage() | localStorage 数据更新 | 单元测试 |
| 从 localStorage 加载 | loadFromStorage() | 会话数据正确恢复 | 单元测试 |
| 清除所有数据 | clearAll() | 所有会话清空 | 单元测试 |
| 版本迁移 | 旧版本数据 | 自动迁移到新版本 | 单元测试 |

### 2.5 useChat Hook

| 测试场景 | 输入 | 预期结果 | 测试类型 |
|----------|------|----------|----------|
| 初始化 | 组件挂载 | messages 为空数组 | 单元测试 |
| 发送消息 | send('hello') | 用户消息添加，Agent 调用触发 | 单元测试 |
| 流式接收 | 流式事件 | messages 实时更新 | 单元测试 |
| 停止生成 | stop() | 流式停止，部分内容保留 | 单元测试 |
| 切换模型 | setModel('gpt-4') | model 更新 | 单元测试 |
| 错误处理 | Agent 调用失败 | 错误状态正确设置 | 单元测试 |
| 回调触发 | 流式完成 | onStreamComplete 被调用 | 单元测试 |

### 2.6 useStreamListener Hook

| 测试场景 | 输入 | 预期结果 | 测试类型 |
|----------|------|----------|----------|
| 监听文本块 | chat:stream:chunk (text) | onText 被调用 | 单元测试 |
| 监听工具调用 | chat:stream:chunk (tool_call) | onToolCall 被调用 | 单元测试 |
| 监听工具结果 | chat:stream:chunk (tool_result) | onToolResult 被调用 | 单元测试 |
| 监听开始 | chat:stream:start | onStart 被调用 | 单元测试 |
| 监听结束 | chat:stream:end | onEnd 被调用 | 单元测试 |
| 监听错误 | chat:stream:error | onError 被调用 | 单元测试 |
| 禁用监听 | enabled=false | 事件不触发回调 | 单元测试 |
| 清理监听 | 组件卸载 | 事件监听移除 | 单元测试 |

### 2.7 useAutoScroll Hook

| 测试场景 | 输入 | 预期结果 | 测试类型 |
|----------|------|----------|----------|
| 初始状态 | 组件挂载 | isAtBottom=true | 单元测试 |
| 新消息自动滚动 | 消息列表更新 | 自动滚动到底部 | 单元测试 |
| 用户滚动 | 手动滚动到中间 | isAtBottom=false，自动滚动禁用 | 单元测试 |
| 回到底部 | scrollToBottom() | isAtBottom=true，自动滚动启用 | 单元测试 |
| 阈值检测 | 滚动距离 < threshold | isAtBottom=true | 单元测试 |
| 禁用自动滚动 | enabled=false | 不自动滚动 | 单元测试 |

### 2.8 MessageContent 组件

| 测试场景 | 输入 | 预期结果 | 测试类型 |
|----------|------|----------|----------|
| 纯文本渲染 | content='hello' | 文本正确显示 | 单元测试 |
| 标题渲染 | content='# Title' | h1 标签渲染 | 单元测试 |
| 列表渲染 | content='- item' | ul/li 标签渲染 | 单元测试 |
| 代码块渲染 | content='```js\n...\n```' | 代码块高亮 | 单元测试 |
| 表格渲染 | content='\| a \| b \|' | table 标签渲染 | 单元测试 |
| 链接渲染 | content='[text](url)' | a 标签渲染 | 单元测试 |
| 图片渲染 | content='![alt](url)' | img 标签渲染 | 单元测试 |
| 代码复制 | 点击复制按钮 | 内容复制到剪贴板 | 单元测试 |
| 流式渲染 | isStreaming=true | 内容实时更新 | 单元测试 |

### 2.9 ToolCallCard 组件

| 测试场景 | 输入 | 预期结果 | 测试类型 |
|----------|------|----------|----------|
| 渲染工具名称 | toolCall.name='file/read' | 名称正确显示 | 单元测试 |
| 渲染参数 | toolCall.arguments='{...}' | 参数显示（默认折叠） | 单元测试 |
| 状态指示 | status='running' | 运行中动画显示 | 单元测试 |
| 完成状态 | status='completed' | 完成图标显示 | 单元测试 |
| 错误状态 | status='error' | 错误图标和信息显示 | 单元测试 |
| 展开/折叠 | 点击展开按钮 | 详细信息显示/隐藏 | 单元测试 |
| 执行时间 | startTime, endTime | 执行时长显示 | 单元测试 |

### 2.10 ChatInput 组件

| 测试场景 | 输入 | 预期结果 | 测试类型 |
|----------|------|----------|----------|
| 文本输入 | 输入 'hello' | 输入框内容更新 | 单元测试 |
| Enter 发送 | 按 Enter | onSend('hello') 被调用 | 单元测试 |
| Shift+Enter 换行 | 按 Shift+Enter | 输入框换行，不发送 | 单元测试 |
| 空消息不发送 | 输入 ''，按 Enter | onSend 不被调用 | 单元测试 |
| 禁用状态 | disabled=true | 输入框不可编辑 | 单元测试 |
| 占位文本 | placeholder='...' | 占位文本显示 | 单元测试 |
| 发送按钮 | 点击发送按钮 | onSend 被调用 | 单元测试 |
| 发送按钮禁用 | 输入为空 | 发送按钮禁用 | 单元测试 |

### 2.11 MessageBubble 组件

| 测试场景 | 输入 | 预期结果 | 测试类型 |
|----------|------|----------|----------|
| 用户消息样式 | role='user' | 右对齐，用户样式 | 单元测试 |
| 助手消息样式 | role='assistant' | 左对齐，助手样式 | 单元测试 |
| 系统消息样式 | role='system' | 居中，系统样式 | 单元测试 |
| 显示头像 | showAvatar=true | 头像显示 | 单元测试 |
| 隐藏头像 | showAvatar=false | 头像隐藏 | 单元测试 |
| 显示时间戳 | showTimestamp=true | 时间戳显示 | 单元测试 |
| 工具调用渲染 | message.toolCalls=[...] | ToolCallCard 渲染 | 单元测试 |
| 分支导航 | 有多个分支 | BranchNavigator 渲染 | 单元测试 |

### 2.12 BranchNavigator 组件

| 测试场景 | 输入 | 预期结果 | 测试类型 |
|----------|------|----------|----------|
| 显示分支信息 | currentIndex=0, total=3 | "1/3" 显示 | 单元测试 |
| 切换到下一个 | 点击下一页 | onSwitch(1) 被调用 | 单元测试 |
| 切换到上一个 | 点击上一页 | onSwitch(0) 被调用 | 单元测试 |
| 创建分支 | 点击创建按钮 | onCreateBranch 被调用 | 单元测试 |
| 边界值 | currentIndex=0 | 上一页按钮禁用 | 单元测试 |
| 边界值 | currentIndex=total-1 | 下一页按钮禁用 | 单元测试 |

### 2.13 StreamIndicator 组件

| 测试场景 | 输入 | 预期结果 | 测试类型 |
|----------|------|----------|----------|
| 显示动画 | isStreaming=true | 动画显示 | 单元测试 |
| 隐藏 | isStreaming=false | 组件隐藏 | 单元测试 |
| 显示模型 | model='claude-sonnet' | 模型名称显示 | 单元测试 |
| 停止按钮 | 点击停止 | onStop 被调用 | 单元测试 |

### 2.14 SessionSidebar 组件

| 测试场景 | 输入 | 预期结果 | 测试类型 |
|----------|------|----------|----------|
| 显示会话列表 | sessions=[...] | 会话列表渲染 | 单元测试 |
| 选中状态 | activeSessionId='s1' | 当前会话高亮 | 单元测试 |
| 新建会话 | 点击新建按钮 | onNewSession 被调用 | 单元测试 |
| 切换会话 | 点击会话项 | onSelect(sessionId) 被调用 | 单元测试 |
| 删除会话 | 右键删除 | onDelete(sessionId) 被调用 | 单元测试 |
| 关闭侧边栏 | 点击关闭 | onClose 被调用 | 单元测试 |
| 隐藏状态 | visible=false | 组件隐藏 | 单元测试 |

### 2.15 EmptyState 组件

| 测试场景 | 输入 | 预期结果 | 测试类型 |
|----------|------|----------|----------|
| 渲染欢迎信息 | 默认 props | 欢迎文本显示 | 单元测试 |
| 渲染快捷操作 | suggestions=[...] | 操作卡片渲染 | 单元测试 |
| 点击快捷操作 | 点击操作卡片 | onClick 被调用 | 单元测试 |

---

## 3. 集成测试

### 3.1 完整对话流程

| 测试场景 | 操作步骤 | 预期结果 | 测试类型 |
|----------|----------|----------|----------|
| 发送并接收消息 | 输入消息 -> 发送 -> 流式接收 | 消息列表正确更新 | 集成测试 |
| 流式渲染 | 发送消息 -> 流式事件 | 内容实时显示 | 集成测试 |
| 工具调用流程 | Agent 调用工具 | ToolCallCard 正确显示 | 集成测试 |
| 停止生成 | 流式中 -> 点击停止 | 流式停止，内容保留 | 集成测试 |
| 错误恢复 | 流式错误 -> 重发 | 错误状态清除，重新发送 | 集成测试 |

### 3.2 会话管理流程

| 测试场景 | 操作步骤 | 预期结果 | 测试类型 |
|----------|----------|----------|----------|
| 创建会话 | 点击新建 -> 输入标题 | 会话创建，自动切换 | 集成测试 |
| 切换会话 | 点击另一个会话 | 消息列表切换 | 集成测试 |
| 删除会话 | 右键删除当前会话 | 切换到最近会话 | 集成测试 |
| 会话持久化 | 创建会话 -> 刷新页面 | 会话数据保留 | 集成测试 |
| 会话标题自动生成 | 发送第一条消息 | 标题自动生成 | 集成测试 |

### 3.3 分支线程流程

| 测试场景 | 操作步骤 | 预期结果 | 测试类型 |
|----------|----------|----------|----------|
| 创建分支 | 选择历史消息 -> 发送新消息 | 分支创建，消息列表切换 | 集成测试 |
| 切换分支 | 点击分支导航 | 消息列表切换到分支 | 集成测试 |
| 分支持久化 | 创建分支 -> 刷新页面 | 分支数据保留 | 集成测试 |
| 多级分支 | 从分支创建子分支 | 分支树正确构建 | 集成测试 |

### 3.4 Store 与组件联动

| 测试场景 | 操作步骤 | 预期结果 | 测试类型 |
|----------|----------|----------|----------|
| Store 状态驱动渲染 | 修改 chatStore | 组件正确响应 | 集成测试 |
| 组件操作更新 Store | 发送消息 | Store 状态正确更新 | 集成测试 |
| localStorage 同步 | 消息变更 | localStorage 内容同步 | 集成测试 |
| 流式状态同步 | 流式事件 | Store 和组件同步更新 | 集成测试 |

### 3.5 布局集成

| 测试场景 | 操作步骤 | 预期结果 | 测试类型 |
|----------|----------|----------|----------|
| ChatPanel 嵌入 GridContainer | 布局渲染 | ChatPanel 正确显示 | 集成测试 |
| 面板折叠 | 折叠聊天面板 | 内容正确隐藏 | 集成测试 |
| 面板调整大小 | 拖拽调整 | 内容区域自适应 | 集成测试 |
| 响应式切换 | 调整窗口大小 | 布局正确适配 | 集成测试 |

---

## 4. E2E 测试

### 4.1 关键用户流程

| 测试场景 | 操作步骤 | 预期结果 | 测试工具 |
|----------|----------|----------|----------|
| 首次对话 | 打开应用 -> 输入消息 -> 发送 | 收到 AI 回复 | Playwright |
| 连续对话 | 发送多条消息 | 消息列表正确滚动 | Playwright |
| 代码块交互 | 收到代码回复 -> 复制 | 代码复制到剪贴板 | Playwright |
| 工具调用查看 | Agent 调用工具 -> 展开详情 | 工具详情正确显示 | Playwright |
| 会话管理 | 新建 -> 对话 -> 切换 -> 删除 | 会话操作正常 | Playwright |
| 分支对话 | 对话 -> 创建分支 -> 切换 | 分支功能正常 | Playwright |
| 流式体验 | 发送长回复消息 | 流式渲染流畅 | Playwright |
| 页面刷新恢复 | 对话 -> 刷新页面 | 对话历史保留 | Playwright |

### 4.2 性能测试

| 测试场景 | 操作步骤 | 预期结果 | 测试工具 |
|----------|----------|----------|----------|
| 大量消息渲染 | 加载 1000+ 消息 | 滚动流畅，无卡顿 | Playwright |
| 长消息渲染 | 单条消息 10000+ 字符 | 渲染正常 | Playwright |
| 快速滚动 | 快速滚动消息列表 | 无白屏，无闪烁 | Playwright |
| 流式性能 | 长时间流式输出 | 内存稳定，无泄漏 | Playwright |
| 并发会话 | 多会话快速切换 | 切换流畅 | Playwright |

### 4.3 边界情况

| 测试场景 | 操作步骤 | 预期结果 | 测试工具 |
|----------|----------|----------|----------|
| 空消息发送 | 输入空格 -> 发送 | 不发送，提示错误 | Playwright |
| 超长消息 | 输入 10000+ 字符 | 正确发送或截断 | Playwright |
| 网络断开 | 断开网络 -> 发送 | 错误提示，可重试 | Playwright |
| 存储满 | localStorage 满 | 优雅降级 | Playwright |
| 快速操作 | 快速点击发送 | 防抖处理，不重复发送 | Playwright |

---

## 5. 测试工具

| 工具 | 用途 | 版本 |
|------|------|------|
| Vitest | 单元测试和集成测试 | 4.x |
| @testing-library/react | 组件测试 | 16.x |
| @testing-library/user-event | 用户交互模拟 | 14.x |
| Playwright | E2E 测试 | 1.x |
| jsdom | DOM 环境模拟 | latest |
| MSW | API Mock | 2.x |

---

## 6. 测试数据

### 6.1 Mock 数据

| 数据类型 | 说明 |
|----------|------|
| MOCK_USER_MESSAGE | 用户消息样本 |
| MOCK_ASSISTANT_MESSAGE | 助手消息样本（含 Markdown） |
| MOCK_TOOL_CALL_MESSAGE | 含工具调用的消息样本 |
| MOCK_SESSION | 会话样本 |
| MOCK_STREAM_CHUNK | 流式数据块样本 |
| MOCK_LOCALSTORAGE_DATA | localStorage 模拟数据 |

### 6.2 测试环境

| 配置 | 值 |
|------|------|
| 浏览器 | Chromium (Playwright) |
| 视口尺寸 | 1920x1080 (Desktop), 1024x768 (Tablet), 375x667 (Mobile) |
| localStorage | 测试前清空，测试后清理 |
| Tauri Events | Mock 事件系统 |

### 6.3 Mock 策略

```typescript
// Tauri Events Mock
vi.mock('@tauri-apps/api/event', () => ({
  listen: vi.fn((event, handler) => {
    // 存储 handler 用于测试触发
    mockListeners.set(event, handler);
    return Promise.resolve(() => mockListeners.delete(event));
  }),
  emit: vi.fn(),
}));

// Tauri Invoke Mock
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn((cmd, args) => {
    return mockCommands.get(cmd)?.(args);
  }),
}));
```

---

## 7. 覆盖率目标

| 模块 | 目标覆盖率 | 说明 |
|------|-----------|------|
| ChatStore | >= 90% | 核心状态管理 |
| SessionStore | >= 90% | 会话持久化 |
| useChat | >= 85% | 核心对话逻辑 |
| useStreamListener | >= 85% | 流式事件处理 |
| useAutoScroll | >= 80% | 滚动逻辑 |
| MessageContent | >= 85% | Markdown 渲染 |
| ToolCallCard | >= 80% | 工具调用展示 |
| ChatInput | >= 80% | 输入交互 |
| MessageBubble | >= 75% | 样式展示 |
| SessionSidebar | >= 80% | 会话管理 |
| BranchNavigator | >= 80% | 分支导航 |
| **整体** | **>= 85%** | 加权平均 |

---

## 8. 测试执行计划

```
Phase 3.2.1: 基础对话
  └── 单元测试:
      - ChatStore 消息操作 14 个
      - useChat Hook 7 个
      - useStreamListener Hook 8 个
      - useAutoScroll Hook 6 个
      - ChatInput 组件 8 个
      - MessageContent 组件 9 个
      - MessageBubble 组件 8 个
      - StreamIndicator 组件 4 个
      - EmptyState 组件 3 个
  └── 集成测试:
      - 完整对话流程 5 个
      - Store 与组件联动 4 个
      - 布局集成 4 个

Phase 3.2.2: 工具调用展示
  └── 单元测试:
      - ToolCallState 类型 5 个
      - ToolCallCard 组件 7 个
  └── 集成测试:
      - 工具调用流程 1 个

Phase 3.2.3: 会话管理
  └── 单元测试:
      - SessionStore CRUD 9 个
      - SessionSidebar 组件 7 个
  └── 集成测试:
      - 会话管理流程 5 个
      - 会话持久化 1 个

Phase 3.2.4: 分支线程
  └── 单元测试:
      - ChatStore 分支操作 2 个
      - BranchNavigator 组件 6 个
  └── 集成测试:
      - 分支线程流程 4 个

最终: E2E 测试
  └── E2E 测试:
      - 关键用户流程 8 个
      - 性能测试 5 个
      - 边界情况 5 个
```

---

*测试计划版本: v1.0.0*
*最后更新: 2026-07-05*
