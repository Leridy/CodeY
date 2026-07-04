# CodeY Spacing & Layout -- 间距与布局规则

本文档定义 CodeY 的间距系统、布局规则和响应式适配策略。

---

## 4px Grid System 网格基准

CodeY 所有间距基于 **4px 网格**。所有 margin、padding、gap 值必须是 4 的整数倍（即 `0.25rem` 的整数倍）。

### 基准值

| Token | px | rem | 用途 |
|-------|-----|-----|------|
| `0` | 0 | 0 | 无间距 |
| `1` | 4 | 0.25rem | 最小间距，内联元素间隔 |
| `2` | 8 | 0.5rem | 紧凑间距，图标与文字间隔 |
| `3` | 12 | 0.75rem | 小间距，列表项间距 |
| `4` | 16 | 1rem | 标准间距，组件内 padding |
| `6` | 24 | 1.5rem | 中等间距，区块分隔 |
| `8` | 32 | 2rem | 大间距，section 分隔 |
| `12` | 48 | 3rem | 超大间距，页面级分隔 |

### 使用规则

1. **组件内部 padding**: 使用 `4` (16px) 或 `3` (12px)
2. **组件之间 gap**: 使用 `2` (8px) 或 `3` (12px)
3. **区块分隔**: 使用 `6` (24px) 或 `8` (32px)
4. **禁止使用非 4 倍数**: 如 `5px`、`13px`、`22px` 等

```tsx
// 正确 -- 4 的整数倍
<div className="p-4">     {/* 16px */}
<div className="gap-2">   {/* 8px */}
<div className="mb-6">    {/* 24px */}

// 错误 -- 非标准值
<div style={{ padding: '13px' }}>
<div style={{ gap: '11px' }}>
```

---

## Panel Padding 面板内边距

各面板的内边距遵循统一规范。

### 面板类型与内边距

| 面板 | 内边距 | 说明 |
|------|--------|------|
| **Explorer (Sidebar)** | `px-3 py-2` (header), `px-2 py-1` (tree items) | 紧凑布局，最大化文件树空间 |
| **Content (Chat)** | `px-4 py-3` (message list), `p-3` (input area) | 标准阅读间距 |
| **Content (Editor)** | `p-4` (editor area), `px-3 py-1` (tab/status bar) | 代码编辑标准间距 |
| **Details** | `px-3 py-2` (header), `p-3` (content) | 信息展示间距 |
| **Terminal** | `px-3 py-2` (header), `px-3 py-2` (output) | 终端输出间距 |

### 面板头部统一规范

所有面板头部使用相同的样式模式：

```tsx
<div
  className="flex items-center justify-between px-3 py-2 border-b"
  style={{
    borderColor: 'var(--color-border)',
    background: 'var(--color-surface)',
  }}
>
  <span
    className="text-xs font-semibold uppercase tracking-wider"
    style={{ color: 'var(--color-text-secondary)' }}
  >
    Panel Title
  </span>
</div>
```

- **Padding**: `px-3 py-2` (12px horizontal, 8px vertical)
- **底部边框**: `border-b` 使用 `var(--color-border)`
- **标题样式**: `text-xs font-semibold uppercase tracking-wider`
- **标题颜色**: `var(--color-text-secondary)`

---

## Component Gaps 组件间距

### 消息列表间距

```tsx
// MessageList 内部
<div className="h-full overflow-y-auto px-4 py-3">
  {/* 消息之间的间距由 MessageBubble 的 mb-3 控制 */}
</div>

// MessageBubble 间距
<motion.div className="flex justify-end mb-3">
  {/* mb-3 = 12px 消息间距 */}
</motion.div>
```

### Tool 卡片间距

```tsx
// MessageBubble 内的 ToolCallCard 列表
<div className="mt-2 space-y-1">
  {/* mt-2 = 8px 与消息内容的间距 */}
  {/* space-y-1 = 4px 卡片之间的间距 */}
  {message.toolCalls.map((tc) => (
    <ToolCallCard key={tc.id} toolCall={tc} />
  ))}
</div>
```

### 输入区域间距

```tsx
// ChatWindow 输入区域
<form className="flex items-end gap-2 p-3 border-t">
  {/* gap-2 = 8px 输入框与按钮间距 */}
  {/* p-3 = 12px 整体内边距 */}
  {/* border-t 分隔消息列表 */}
</form>
```

### 面板间分隔

面板之间使用边框分隔，不使用额外间距：

```tsx
// Explorer 与 Content: border-r
<aside className="border-r" style={{ borderColor: 'var(--color-border)' }} />

// Content 与 Details: border-l
<aside className="border-l" style={{ borderColor: 'var(--color-border)' }} />

// Content 与 Terminal: border-t
<div className="border-t" style={{ borderColor: 'var(--color-border)' }} />
```

---

## Panel Dimensions 面板尺寸

### 默认尺寸配置

来自 `layout.ts` 的 `DEFAULT_PANEL_CONFIG`：

```tsx
export const DEFAULT_PANEL_CONFIG: PanelConfig = {
  explorerWidth: { min: 200, default: 260, max: 400 },
  detailsWidth:  { min: 240, default: 320, max: 480 },
  terminalHeight:{ min: 120, default: 240, max: 480 },
  collapsible: true,
}
```

| 面板 | Min | Default | Max | 方向 |
|------|-----|---------|-----|------|
| Explorer | 200px | 260px | 400px | 水平 |
| Details | 240px | 320px | 480px | 水平 |
| Terminal | 120px | 240px | 480px | 垂直 |

### 面板折叠

- Explorer 折叠后宽度: 48px（仅显示展开按钮）
- Terminal 折叠后高度: 32px（仅显示 "Terminal (N lines)" 文字）
- Details 在 Tablet 模式下以浮层形式展示

---

## Responsive Breakpoints 响应式断点

### 断点定义

来自 `layout.ts` 的 `BREAKPOINTS`：

```tsx
export const BREAKPOINTS = {
  mobile: 768,
  tablet: 1280,
  desktop: 1280,
} as const
```

| Mode | Width | 说明 |
|------|-------|------|
| **Mobile** | < 768px | 全部面板以 Drawer 形式展示 |
| **Tablet** | 768px - 1279px | Explorer 收缩为图标，Details 浮层，Terminal 面板 |
| **Desktop** | >= 1280px | 全部面板同时展示 |

### 各模式下的面板行为

| 面板 | Desktop | Tablet | Mobile |
|------|---------|--------|--------|
| Explorer | Sidebar (260px) | Icon (48px) | Drawer (overlay) |
| Details | Panel (320px) | Floating (overlay) | Drawer (overlay) |
| Terminal | Panel (240px) | Panel (240px) | Drawer (overlay) |
| Content | 填充剩余空间 | 填充剩余空间 | 全屏 |

### 实现方式

使用 `useLayoutMode` hook 自动检测：

```tsx
const mode = useLayoutMode() // 'desktop' | 'tablet' | 'mobile'
const visibility = usePanelVisibility(mode)

// Desktop: 所有面板可见
// { explorer: { visible: true, mode: 'sidebar' },
//   details:  { visible: true, mode: 'panel' },
//   terminal: { visible: true, mode: 'panel' } }

// Tablet: Explorer 收缩，Details 浮层
// { explorer: { visible: true, mode: 'icon' },
//   details:  { visible: true, mode: 'floating' },
//   terminal: { visible: true, mode: 'panel' } }

// Mobile: 全部 Drawer
// { explorer: { visible: true, mode: 'drawer' },
//   details:  { visible: true, mode: 'drawer' },
//   terminal: { visible: true, mode: 'drawer' } }
```

---

## Content Split Mode 内容分屏

Desktop 模式下支持 Chat + Editor 分屏：

### Split Ratio

```tsx
interface ContentPanelState {
  mode: ContentMode  // 'chat' | 'editor' | 'split'
  splitRatio: number // 0.0 - 1.0, default 0.5
}
```

- `chat`: 仅显示 ChatWindow
- `editor`: 仅显示 EditorPanel
- `split`: 左右分屏，`splitRatio` 控制 Chat 占比

### 分屏布局

```tsx
<div className="flex flex-1 overflow-hidden">
  <div style={{ width: `${splitRatio * 100}%` }}>
    <ChatWindow />
  </div>
  <PanelResizer direction="horizontal" ... />
  <div style={{ width: `${(1 - splitRatio) * 100}%` }}>
    <EditorPanel />
  </div>
</div>
```

---

## Z-Index 层级管理

### 层级定义

| Level | z-index | 用途 |
|-------|---------|------|
| Base | 0 | 默认层级 |
| Dropdown | 10 | 下拉菜单 |
| Sticky | 20 | 粘性元素 |
| Panel | 30 | 浮动面板 (Tablet Details) |
| Overlay | 40 | 遮罩层 |
| Modal | 50 | 弹窗 (ApprovalDialog) |
| Popover | 60 | 气泡弹出 |
| Toast | 70 | 通知提示 |
| Tooltip | 80 | 工具提示 |

### 实际使用

```tsx
// Tablet 模式下的浮动 Details 面板
<motion.div
  className="absolute right-0 top-0 bottom-0 z-20 shadow-xl border-l"
  style={{
    width: config.detailsWidth.default,
    borderColor: 'var(--color-border)',
    background: 'var(--color-surface)',
  }}
>
  {details}
</motion.div>

// ApprovalDialog 弹窗
<div className="fixed inset-0 z-50 flex items-center justify-center">
  <div className="absolute inset-0 bg-black/50" />
  <div className="relative z-10 ...">
    {/* Dialog content */}
  </div>
</div>
```

---

## Max Height Constraints 最大高度限制

各组件的最大高度限制，超出部分滚动：

| 组件 | Max Height | 说明 |
|------|------------|------|
| Tool 输出 (BashTool, EditTool, etc.) | 300px | `maxHeight: 300` |
| FileTool 预览 | 200px | `maxHeight: 200` |
| ApprovalDialog JSON | 160px | `max-h-40` (160px) |
| Terminal 面板 | 480px | `max: 480` in config |
| Message 气泡宽度 | 80% | `max-w-[80%]` |
| ApprovalDialog 宽度 | 448px | `max-w-md` |

---

## Scrollbar 滚动条样式

### 自定义滚动条 CSS

```css
/* Webkit 浏览器 */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: var(--color-border);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--color-border-hover);
}
```

---

## Touch Targets 触摸目标

Mobile 模式下的最小触摸目标尺寸：

| 元素 | 最小尺寸 | 说明 |
|------|---------|------|
| 按钮 | 44px x 44px | Apple HIG 推荐 |
| 列表项 | 48px 高 | Material Design 推荐 |
| 图标按钮 | 40px x 40px | 最小可点击区域 |

```tsx
// Mobile 模式下的按钮
<button className="min-h-[44px] min-w-[44px] px-4 py-3 ...">
  Action
</button>
```
