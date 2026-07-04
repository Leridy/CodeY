# CodeY Frontend Style -- 设计系统文档

## 概述

CodeY Frontend Style 是一套面向 AI IDE 的前端设计系统，基于 React + TypeScript + Tailwind CSS + Framer Motion 构建。核心特性：

- **四面板 IDE 布局**：Explorer（侧栏）、Content（主内容）、Details（详情）、Terminal（终端）
- **响应式适配**：Desktop / Tablet / Mobile 三种模式自动切换
- **Chat UI**：消息气泡、流式渲染、Tool Call 展示与审批
- **主题系统**：Dark / Light 双主题，CSS 变量驱动
- **状态管理**：Zustand store 统一管理 layout、chat、editor、theme

---

## 类型定义 (`types/`)

### layout.ts -- 布局相关

| 类型 | 说明 |
|------|------|
| `PanelConfig` | 面板尺寸约束（min / default / max） |
| `BREAKPOINTS` | 响应式断点：mobile < 768, tablet < 1280, desktop >= 1280 |
| `LayoutMode` | `'desktop' \| 'tablet' \| 'mobile'` |
| `ContentMode` | `'chat' \| 'editor' \| 'split'` |
| `ContentPanelState` | 主内容区模式 + splitRatio（0.0~1.0） |
| `FileNode` | 文件树节点（name, path, type, children, modified） |
| `PanelVisibility` | 各面板的 visible + mode（sidebar/icon/drawer 等） |

```tsx
import { DEFAULT_PANEL_CONFIG, BREAKPOINTS } from './types/layout'

// 自定义面板宽度
<IDELayout panelConfig={{ explorerWidth: { min: 200, default: 300, max: 500 } }} />
```

### message.ts -- 消息系统

| 类型 | 说明 |
|------|------|
| `Message` | id, role (user/assistant/system), content, timestamp, toolCalls?, streaming? |
| `ToolCall` | id, name, type (bash/edit/git/file/search/other), input, result?, status |
| `ToolResult` | output, exitCode?, duration?, truncated? |
| `OpenFile` | path, content, language, modified |

### tool.ts -- Tool 渲染

| 类型 | 说明 |
|------|------|
| `SearchResult` | filePath, lineNumber, line, context (before/after lines) |
| `TerminalLine` | id, type (input/output/error/system), content, timestamp |
| `TOOL_COLORS` | Tool 类型到 CSS 变量的映射，用于彩色标签 |

---

## 样式 (`styles/`)

### theme.css -- 主题变量

所有颜色通过 CSS 自定义属性定义，Tailwind 通过 `var(--color-*)` 引用。

**变量分类：**

| 前缀 | 用途 | 示例 |
|------|------|------|
| `--color-bg` | 页面背景 | `#1a1a2e` (dark) / `#f5f5f5` (light) |
| `--color-surface` | 卡片/面板背景 | `#16213e` / `#ffffff` |
| `--color-primary` | 主色调 | `#0f3460` / `#1976d2` |
| `--color-accent` | 强调色 | `#e94560` / `#e91e63` |
| `--color-text` | 正文 / 次要 / 禁用 / 反色 | 四级文本色 |
| `--color-border` | 边框 / hover / focus | 三级边框色 |
| `--color-status-*` | 状态色 | success / warning / error / info |
| `--color-tool-*` | Tool 类型色 | bash / edit / git / file / search |

**切换主题：**

```tsx
// 通过 data-theme 属性切换
document.documentElement.setAttribute('data-theme', 'dark')

// 或通过 store
const { toggleTheme } = useAppStore()
toggleTheme()
```

### animations.css -- CSS 动画

补充 Framer Motion 之外的纯 CSS 动画：

| 动画 | 用途 | 时长 |
|------|------|------|
| `fadeIn` | 淡入 | -- |
| `slideUpFade` | 上滑淡入（12px） | -- |
| `slideInRight` | 右滑淡入（8px） | -- |
| `panel-collapse-enter/exit` | 面板折叠 | 0.2s |
| `cursorBlink` | 流式光标闪烁 | 0.8s step-end |

使用 `streaming-cursor` class 自动显示闪烁光标：

```tsx
<span className="streaming-cursor" />
```

---

## Hooks (`hooks/`)

### useLayoutMode

监听窗口宽度，返回当前 `LayoutMode`。

```tsx
import { useLayoutMode } from './hooks/useLayoutMode'

const mode = useLayoutMode() // 'desktop' | 'tablet' | 'mobile'
```

断点规则：
- width >= 1280 --> `desktop`
- width >= 768 --> `tablet`
- width < 768 --> `mobile`

### usePanelVisibility

根据 `LayoutMode` 派生各面板的可见性和展示模式。

```tsx
import { usePanelVisibility } from './hooks/usePanelVisibility'

const visibility = usePanelVisibility('desktop')
// {
//   explorer: { visible: true, mode: 'sidebar' },
//   details:  { visible: true, mode: 'panel' },
//   terminal: { visible: true, mode: 'panel' },
// }
```

各模式下面板行为：

| 模式 | Explorer | Details | Terminal |
|------|----------|---------|----------|
| desktop | sidebar | panel | panel |
| tablet | icon | floating | panel |
| mobile | drawer | drawer | drawer |

### useStreaming

管理流式文本的逐字渲染状态。

```tsx
import { useStreaming } from './hooks/useStreaming'

const { displayedText, isComplete, append, setFull, reset } = useStreaming({
  speed: 30,        // 每字符延迟（ms），默认 50
  onComplete: () => console.log('done'),
})

// 逐块追加
append('Hello ')
append('World')

// 直接设置完整文本（跳过动画）
setFull('Complete text')

// 重置
reset()
```

---

## 状态管理 (`stores/`)

### appStore -- Zustand 全局 Store

使用 `devtools` + `persist` 中间件，持久化 layout 和 theme.mode。

```tsx
import { useAppStore } from './stores/appStore'

function MyComponent() {
  const {
    layout,           // { mode, contentMode, splitRatio, explorerCollapsed, ... }
    chat,             // { messages, isStreaming, streamingContent }
    editor,           // { openFiles, activeFilePath }
    theme,            // { mode, current }

    // Actions
    setContentMode,   // (mode: ContentMode) => void
    toggleExplorer,   // () => void
    toggleTerminal,   // () => void
    sendMessage,      // (content: string) => void
    approveToolCall,  // (id: string) => void
    rejectToolCall,   // (id: string) => void
    toggleTheme,      // () => void
  } = useAppStore()
}
```

**Store 结构：**

```
appStore
├── layout
│   ├── mode: LayoutMode
│   ├── contentMode: ContentMode
│   ├── splitRatio: number
│   ├── explorerCollapsed: boolean
│   ├── detailsVisible: boolean
│   └── terminalCollapsed: boolean
├── chat
│   ├── messages: Message[]
│   ├── isStreaming: boolean
│   └── streamingContent: string
├── editor
│   ├── openFiles: OpenFile[]
│   └── activeFilePath: string | null
└── theme
    ├── mode: 'dark' | 'light'
    └── current: ThemeDefinition
```

---

## 组件 (`components/`)

### 组件层级

```
IDELayout                          # 顶层布局容器
├── Sidebar                        # Explorer 侧栏
├── [Content Area]                 # 主内容区
│   ├── ChatWindow                 # Chat 模式
│   │   ├── MessageList            #   消息列表（自动滚动）
│   │   │   └── MessageBubble      #     单条消息
│   │   │       ├── StreamingText  #       流式文本
│   │   │       └── ToolCallCard   #       Tool 调用卡片
│   │   └── [Input Box]            #   输入框 + Send/Stop 按钮
│   └── EditorPanel                # Editor 模式（代码编辑）
├── DetailsPanel                   # 详情面板
├── TerminalPanel                  # 终端面板
└── ApprovalDialog                 # Tool 审批弹窗（Modal）
```

### layout/ -- 布局组件

#### IDELayout

顶层四面板容器，基于 `useLayoutMode` + `usePanelVisibility` 自动适配。

```tsx
<IDELayout
  mode="desktop"          // 可选，不传则自动检测
  explorer={<Sidebar />}  // Explorer 面板内容
  content={<ChatWindow />} // 主内容
  details={<DetailsPanel />} // 详情面板
  terminal={<TerminalPanel />} // 终端面板
  panelConfig={{ ... }}   // 面板尺寸覆盖
/>
```

内部导出 `ANIMATION` 常量，供其他组件复用动画配置：

```tsx
import { ANIMATION } from './layout/IDELayout'

// 消息进入动画
<motion.div {...ANIMATION.messageEnter}>...</motion.div>

// Tool 卡片展开动画
<motion.div layout transition={ANIMATION.toolCardExpand.transition}>...</motion.div>

// 面板切换动画
<AnimatePresence>
  <motion.div {...ANIMATION.panelSwitch}>...</motion.div>
</AnimatePresence>
```

#### PanelResizer

面板拖拽调整大小组件。

#### Sidebar

Explorer 文件树侧栏。

### chat/ -- 聊天组件

#### ChatWindow

完整的聊天窗口，包含消息列表和输入框。

```tsx
<ChatWindow
  messages={messages}       // Message[]
  isStreaming={isStreaming} // 是否正在生成
  onSend={sendMessage}      // 发送回调
  onStop={stopGeneration}   // 停止回调（streaming 时显示）
  placeholder="输入消息..."  // 输入框占位文本
/>
```

#### MessageList

消息列表容器，支持 `autoScroll` 自动滚动到底部。

#### MessageBubble

单条消息气泡，区分 user / assistant / system 角色样式：
- **user**: 主色调背景，反色文字，右对齐
- **assistant**: surface 背景，边框，左对齐
- **system**: 半透明斜体

内嵌 ToolCallCard 展示关联的 tool calls。

#### StreamingText

流式文本组件，streaming 时显示闪烁光标。

```tsx
<StreamingText content={text} complete={isComplete} />
```

#### ToolCallCard

可展开的 Tool 调用卡片，显示：
- 状态指示灯（pending/running/completed/failed/awaiting_approval）
- Tool 名称（彩色，按 type 着色）
- Input 摘要
- 展开后显示完整 Input JSON 和 Output

```tsx
<ToolCallCard toolCall={tc} expanded={expanded} onToggleExpand={toggle} />
```

#### ApprovalDialog

Modal 审批弹窗，用于危险操作确认。展示 tool 名称和 input JSON，提供 Approve / Reject 按钮。

```tsx
<ApprovalDialog
  toolCall={tc}
  reason="此操作将删除文件"
  onApprove={() => approve(tc.id)}
  onReject={() => reject(tc.id)}
/>
```

### tools/ -- Tool 渲染组件

#### ToolCard

通用 Tool 卡片外壳，根据 type 委托给专用组件。

| 组件 | Tool 类型 | 说明 |
|------|-----------|------|
| `BashTool` | bash | 命令执行 |
| `EditTool` | edit | 文件编辑 |
| `GitTool` | git | Git 操作 |
| `FileTool` | file | 文件操作 |
| `SearchTool` | search | 搜索结果 |

每个组件接收 `ToolCall` 数据，渲染对应的专用 UI。

### editor/ -- 编辑器

#### EditorPanel

代码编辑面板。

### terminal/ -- 终端

#### TerminalPanel

终端输出面板，使用 `TerminalLine` 类型渲染 input/output/error/system 行。

### details/ -- 详情

#### DetailsPanel

详情展示面板（文件属性、搜索结果详情等）。

---

## 动画规格

### Framer Motion 动画（主要）

定义在 `IDELayout.tsx` 的 `ANIMATION` 常量中：

| 动画名 | 效果 | 时长 | 缓动 |
|--------|------|------|------|
| `messageEnter` | opacity: 0->1, y: 12->0 | 0.3s | easeOut |
| `toolCardExpand` | height auto-animate | 0.2s | easeInOut |
| `panelSwitch` | opacity: 0->1, x: 8->0 | 0.2s | easeInOut |
| `typewriter` | 逐字符显示 | 0.05s/char | -- |
| `panelCollapse` | height auto-animate | 0.25s | easeInOut |

### CSS 动画（补充）

定义在 `animations.css` 中，用于非 Framer Motion 场景（如纯 CSS 组件）：

| 动画 | 关键帧 | 用途 |
|------|--------|------|
| `fadeIn` | opacity 0->1 | 通用淡入 |
| `slideUpFade` | opacity 0->1 + translateY 12px->0 | 消息出现 |
| `slideInRight` | opacity 0->1 + translateX 8px->0 | 面板滑入 |
| `cursorBlink` | opacity 1->0->1 (step-end) | 流式光标 |

---

## 主题自定义

### 添加新主题

1. 在 `theme.css` 中添加新的 `[data-theme='xxx']` 选择器
2. 在 `appStore.ts` 中添加对应的 theme 对象
3. 更新 `toggleTheme` action 支持新模式

### 自定义单个变量

直接覆盖 CSS 变量即可：

```css
:root[data-theme='dark'] {
  --color-accent: #ff6b6b;  /* 覆盖强调色 */
}
```

### 在组件中使用

```tsx
// CSS 变量方式（推荐）
<div style={{ color: 'var(--color-text)' }}>

// Tailwind 方式（需配置 tailwind.config.js 引用 CSS 变量）
<div className="text-[var(--color-text)]">

// Store 中的 current 对象
const { theme } = useAppStore()
const accent = theme.current.accent
```

### Tool 类型颜色

每种 Tool 类型有独立颜色变量，在 `tool.ts` 中映射：

```tsx
import { TOOL_COLORS } from './types/tool'

<span style={{ color: TOOL_COLORS[toolCall.type] }}>
  {toolCall.name}
</span>
```

| Tool 类型 | Dark 色值 | Light 色值 |
|-----------|----------|-----------|
| bash | `#4caf50` | `#388e3c` |
| edit | `#2196f3` | `#1976d2` |
| git | `#ff9800` | `#f57c00` |
| file | `#9c27b0` | `#7b1fa2` |
| search | `#00bcd4` | `#0097a7` |

---

## 技术栈

| 依赖 | 用途 |
|------|------|
| React 18+ | UI 框架 |
| TypeScript | 类型安全 |
| Tailwind CSS | 原子化样式 |
| Framer Motion | 布局动画 |
| Zustand | 状态管理 |
| CSS Custom Properties | 主题变量 |
