# CodeY Component Styles -- 组件样式指南

本文档定义 CodeY 各 UI 组件的视觉规范，确保跨组件的一致性。

所有组件使用 **Tailwind CSS + CSS 变量** 实现，确保动态主题切换和一致的设计语言。

---

## Button 按钮

按钮是最高频的交互元素。CodeY 定义四种 Button variant，覆盖所有交互场景。

### Variant 定义

| Variant | 用途 | 背景色 | 文字色 | 边框 |
|---------|------|--------|--------|------|
| **Primary** | 主操作（Send、Submit） | `bg-primary` | `text-text-inverse` | 无 |
| **Secondary** | 次要操作（Cancel、Back） | `bg-background` | `text-text` | `border border-border` |
| **Danger** | 危险操作（Delete、Reject） | `bg-error` | `text-text-inverse` | 无 |
| **Ghost** | 无背景操作（Toggle、Icon） | `bg-transparent` | `text-text-secondary` | 无 |

### 尺寸规格

| Size | Padding | Font Size | Border Radius | Min Height |
|------|---------|-----------|---------------|------------|
| **sm** | `px-2 py-1` | `text-xs` (0.75rem) | `rounded-md` | 28px |
| **md** | `px-3 py-2` | `text-sm` (0.875rem) | `rounded-lg` | 36px |
| **lg** | `px-4 py-2.5` | `text-base` (1rem) | `rounded-lg` | 44px |

### 状态样式

| State | 样式变化 |
|-------|---------|
| Default | 基础样式 |
| Hover | `opacity-90` + `shadow-sm` |
| Active | `opacity-80` + `scale-[0.98]` |
| Focus | `shadow-glow-primary` + `outline-none` |
| Disabled | `opacity-50` + `cursor-not-allowed` |
| Loading | 显示 spinner + `pointer-events-none` |

### 代码示例

```tsx
// Primary Button (Send 按钮)
<button
  className="bg-primary text-text-inverse px-3 py-2 rounded-lg text-sm font-medium
             hover:opacity-90 hover:shadow-sm
             active:opacity-80 active:scale-[0.98]
             focus:outline-none focus:shadow-glow-primary
             disabled:opacity-50 disabled:cursor-not-allowed
             transition-all duration-normal"
>
  Send
</button>

// Danger Button (Reject 按钮)
<button
  className="bg-error text-text-inverse px-4 py-2 rounded-lg text-sm font-medium
             hover:opacity-90 hover:shadow-sm
             active:opacity-80 active:scale-[0.98]
             transition-all duration-normal"
>
  Reject
</button>

// Ghost Button (Toggle)
<button
  className="bg-transparent text-text-secondary px-2 py-1 rounded-md text-xs
             hover:opacity-80 transition-opacity duration-normal"
>
  Collapse
</button>
```

---

## Input 输入框

输入框用于文本输入、搜索、命令执行等场景。

### 默认样式

```tsx
<input
  className="bg-surface text-text border border-border rounded-lg
             px-3 py-2 text-sm
             hover:border-border-hover
             focus:border-border-focus focus:shadow-glow-accent focus:outline-none
             disabled:opacity-50 disabled:cursor-not-allowed
             transition-colors duration-normal"
  placeholder="Enter text..."
/>
```

### 状态变体

| State | Border | Box Shadow | 说明 |
|-------|--------|------------|------|
| **Default** | `border-border` | 无 | 默认状态 |
| **Hover** | `border-border-hover` | 无 | 鼠标悬停 |
| **Focus** | `border-border-focus` | `shadow-glow-accent` | 聚焦状态，accent 色发光 |
| **Error** | `border-error` | `shadow-glow-error` | 验证失败 |
| **Disabled** | `border-border` | 无 | `opacity-50` + `cursor-not-allowed` |

### Textarea 特殊处理

ChatWindow 的输入框使用 textarea：

```tsx
<textarea
  className="flex-1 resize-none rounded-lg px-3 py-2 text-sm
             bg-surface text-text border border-border
             focus:outline-none focus:border-border-focus focus:shadow-glow-accent
             placeholder:text-text-disabled
             transition-all duration-normal"
  rows={1}
  placeholder="Type a message..."
/>
```

### 代码编辑器输入

EditorPanel 使用等宽字体的 textarea：

```tsx
<textarea
  className="flex-1 w-full resize-none p-4 font-mono text-sm
             bg-background text-text
             focus:outline-none
             placeholder:text-text-disabled"
  spellCheck={false}
/>
```

---

## Card 卡片

卡片用于包裹独立的信息块，如 Tool 卡片、消息气泡、面板区域。

### 基础卡片

```tsx
<div
  className="bg-surface border border-border rounded-lg
             overflow-hidden
             transition-colors duration-normal"
>
  {/* Content */}
</div>
```

### 状态变体

| State | 样式变化 | 使用场景 |
|-------|---------|---------|
| **Default** | 基础样式 | 静态展示 |
| **Hover** | `border-border-hover` + `shadow-sm` | 可交互卡片 |
| **Active/Selected** | `border-accent` + `shadow-glow-accent` | 选中状态 |
| **Focused** | `shadow-glow-accent` | 键盘焦点 |

### 面板卡片（IDELayout 面板）

IDELayout 的各面板使用 surface 背景 + 边框分隔：

```tsx
// Explorer 侧栏
<aside
  className="flex-shrink-0 border-r border-border overflow-y-auto
             bg-surface"
  style={{ width: config.explorerWidth.default }}
>
  {explorer}
</aside>

// Details 面板
<aside
  className="flex-shrink-0 border-l border-border overflow-y-auto
             bg-surface"
  style={{ width: config.detailsWidth.default }}
>
  {details}
</aside>
```

---

## ToolCallCard Tool 调用卡片

ToolCallCard 是 CodeY 最具特色的组件，展示 AI 工具调用的完整生命周期。

### 结构规范

```
┌─────────────────────────────────────────────┐
│ [StatusBadge] ToolName { input preview... } │  ← Header (clickable)
├─────────────────────────────────────────────┤  ← 展开时显示
│ Input: { full JSON }                        │
│ Output: { result }                          │
└─────────────────────────────────────────────┘
```

### Header 样式

```tsx
<button
  className="flex items-center gap-2 w-full px-3 py-1.5 text-xs font-mono
             hover:opacity-80 transition-opacity duration-normal"
>
  <StatusBadge status={toolCall.status} />
  <span className="font-semibold text-tool-bash">
    {toolCall.name}
  </span>
  <span className="truncate text-text-secondary">
    {JSON.stringify(toolCall.input).slice(0, 60)}
  </span>
</button>
```

### StatusBadge 状态指示灯

8px 圆形指示灯，颜色映射到 Tool 状态：

| Status | Color | 说明 |
|--------|-------|------|
| `pending` | `text-text-secondary` | 等待执行 |
| `running` | `text-info` | 正在运行（可加 pulse 动画） |
| `completed` | `text-success` | 执行成功 |
| `failed` | `text-error` | 执行失败 |
| `awaiting_approval` | `text-warning` | 等待用户审批 |

```tsx
function StatusBadge({ status }: { status: ToolCall['status'] }) {
  const colorMap: Record<ToolCall['status'], string> = {
    pending: 'text-text-secondary',
    running: 'text-info',
    completed: 'text-success',
    failed: 'text-error',
    awaiting_approval: 'text-warning',
  }

  return (
    <span
      className={`inline-block w-2 h-2 rounded-full ${colorMap[status]}`}
      title={status}
    />
  )
}
```

### Tool 名称颜色映射

每种 Tool 类型使用独立的语义色，便于快速识别：

```tsx
// 颜色来自 CSS 变量
// bash:   text-tool-bash (green)
// edit:   text-tool-edit (blue)
// git:    text-tool-git (orange)
// file:   text-tool-file (purple)
// search: text-tool-search (cyan)

<span className={`text-tool-${toolCall.type}`}>
  {toolCall.name}
</span>
```

### 展开动画

使用 Framer Motion 的 height auto-animate：

```tsx
<AnimatePresence>
  {expanded && (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="overflow-hidden"
    >
      {/* Detail content */}
    </motion.div>
  )}
</AnimatePresence>
```

---

## Status Indicator 状态指示器

状态指示器用于全局状态反馈，包括终端行类型、消息状态、操作结果等。

### TerminalLine 类型颜色

```tsx
const colorMap: Record<TerminalLine['type'], string> = {
  input:  'text-text',           // 用户输入
  output: 'text-text-secondary', // 命令输出
  error:  'text-error',          // 错误输出
  system: 'text-info',           // 系统消息
}
```

### Message 角色样式

| Role | 背景 | 文字 | 对齐 | 特殊样式 |
|------|------|------|------|---------|
| `user` | `bg-primary` | `text-text-inverse` | 右对齐 | 无边框 |
| `assistant` | `bg-surface` | `text-text` | 左对齐 | `border border-border` |
| `system` | `bg-transparent` | `text-text-secondary` | 左对齐 | `opacity-60` + `italic` |

### Streaming 光标

流式输出时显示闪烁光标：

```tsx
<span className="animate-cursor-blink text-accent">|</span>
```

### 编辑器状态栏

EditorPanel 底部的状态指示：

```tsx
<div
  className="flex items-center justify-between px-3 py-1 text-xs
             border-t border-border bg-surface text-text-secondary"
>
  <span>{language ?? 'Plain Text'}</span>
  <span>UTF-8</span>
</div>
```

---

## ApprovalDialog 审批弹窗

用于危险 Tool 操作的二次确认。

### 结构规范

```
┌──────────────────────────────────────┐
│  Approval Required                   │  ← Title
│                                      │
│  Reason text (optional)              │  ← Description
│                                      │
│  ┌────────────────────────────────┐  │
│  │ toolName                       │  │  ← Tool info card
│  │ { input JSON }                 │  │
│  └────────────────────────────────┘  │
│                                      │
│            [Reject]  [Approve]       │  ← Actions
└──────────────────────────────────────┘
```

### 样式规范

```tsx
// Backdrop
<div className="absolute inset-0 bg-black/50" />

// Dialog container
<div
  className="relative z-modal w-full max-w-md rounded-xl p-6 shadow-xl
             bg-surface border border-border"
>
  <h2 className="text-lg font-bold mb-2 text-text">
    Approval Required
  </h2>

  {/* Tool info card */}
  <div
    className="rounded-lg p-3 mb-4 text-xs font-mono
               bg-background text-text border border-border"
  >
    <div className="font-semibold mb-1">{toolCall.name}</div>
    <pre className="whitespace-pre-wrap overflow-auto max-h-40">
      {JSON.stringify(toolCall.input, null, 2)}
    </pre>
  </div>

  {/* Action buttons */}
  <div className="flex justify-end gap-3">
    <button className="bg-background text-text border border-border px-4 py-2 rounded-lg text-sm">
      Reject
    </button>
    <button className="bg-warning text-text-inverse px-4 py-2 rounded-lg text-sm">
      Approve
    </button>
  </div>
</div>
```

### 按钮颜色约定

- **Reject** 使用 Secondary variant（`bg-background` 背景 + 边框）
- **Approve** 使用 `bg-warning` 背景（橙色，强调需要用户注意）

---

## Tool 专用组件样式

### BashTool

命令执行结果展示，三层结构：命令行 / 输出 / 退出码。

```tsx
// 命令行 -- accent 色 $ 提示符
<div className="bg-background text-tool-bash">
  <span className="text-accent">$</span> {command}
</div>

// 输出 -- 最大高度 300px，超出滚动
<pre
  className={isError ? 'text-error' : 'text-text-secondary'}
  style={{ maxHeight: 300, overflowY: 'auto' }}
/>

// 退出码 -- 右对齐，成功绿色 / 失败红色
<div className={isError ? 'text-error' : 'text-success'} />
```

### EditTool

文件编辑 diff 展示，支持 unified 和 split 两种视图。

```tsx
// Unified view
<div className="text-error">- {oldLine}</div>
<div className="text-success">+ {newLine}</div>

// Split view
<pre className="text-error">{oldContent}</pre>
<pre className="text-success">{newContent}</pre>
```

### SearchTool

搜索结果列表，每行显示文件路径 + 行号 + 匹配内容。

```tsx
<div className="px-2 py-1 border-b border-border hover:opacity-80">
  <span className="text-text-secondary">
    {result.filePath}:{result.lineNumber}
  </span>
  <span className="ml-2 text-text">
    {result.line}
  </span>
</div>
```

---

## Sidebar 文件树

文件树使用递归渲染，每个节点 28px 高，缩进 16px/级。

### 选中状态

```tsx
<button
  className={`w-full text-left px-2 py-1 text-sm
    ${isSelected
      ? 'bg-primary text-text-inverse'
      : 'bg-transparent text-text hover:bg-surface'
    }`}
  style={{ paddingLeft: depth * 16 + 8 }}
>
  <span>{node.type === 'directory' ? '📁' : '📄'}</span>
  <span className="truncate">{node.name}</span>
  {node.modified && (
    <span className="ml-auto w-2 h-2 rounded-full bg-accent" />
  )}
</button>
```

### 面板头部

统一的面板头部样式：大写字母 + letter-spacing + secondary 色。

```tsx
<div className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
  Explorer
</div>
```

---

## PanelResizer 面板拖拽手柄

拖拽调整大小的交互手柄。

```tsx
<div
  role="separator"
  className={`
    flex-shrink-0 select-none bg-accent
    ${isHorizontal ? 'w-1 cursor-col-resize' : 'h-1 cursor-row-resize'}
    ${dragging ? 'opacity-100' : 'opacity-0 hover:opacity-100'}
    transition-opacity duration-normal
  `}
/>
```

- 默认隐藏（`opacity-0`），hover 时显示
- 拖拽时保持可见（`opacity-100`）
- 使用 accent 色便于识别

---

## 使用指南

### 导入 CSS 变量

在项目入口文件中导入设计 token：

```tsx
// src/main.tsx 或 src/app/layout.tsx
import '@codey/design-system/design-tokens.css'
```

### 主题切换

通过 `data-theme` 属性切换主题：

```tsx
// 切换到暗色主题
document.documentElement.setAttribute('data-theme', 'dark')

// 切换到亮色主题
document.documentElement.setAttribute('data-theme', 'light')
```

### Tailwind 配置

确保 Tailwind 配置文件引用了设计 token：

```javascript
// tailwind.config.js
const config = require('./design-system/tailwind.config.js')

module.exports = {
  ...config,
  // 项目特定配置
}
```

### 最佳实践

1. **始终使用 CSS 变量** - 不要硬编码颜色、间距等值
2. **使用语义化类名** - `bg-surface` 而不是 `bg-[#16213e]`
3. **遵循间距系统** - 使用 `p-4` 而不是 `p-[15px]`
4. **保持一致性** - 参考本文档中的组件样式
5. **支持主题切换** - 所有组件都应支持 dark/light 主题
