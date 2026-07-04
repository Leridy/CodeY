# CodeY Design Language -- 设计语言总览

本文档是 CodeY 设计系统的入口文件，概述设计原则、色彩体系、排版规范和组件层级。

---

## 设计原则

### 1. CSS Variables + Tailwind 架构

CodeY 使用 **CSS 自定义属性 + Tailwind CSS** 的组合方案：

- **CSS 变量**：所有设计 token 定义为 CSS 自定义属性，支持运行时主题切换
- **Tailwind 集成**：Tailwind 配置引用 CSS 变量，提供原子化类名
- **零 JS 开销**：主题切换通过 `data-theme` 属性和 CSS 变量实现，无需 JavaScript

```css
/* 定义设计 token */
:root {
  --color-primary-500: #0f3460;
  --font-family-sans: 'Inter', system-ui, sans-serif;
  --spacing-4: 1rem;
}

/* 主题切换 */
[data-theme="dark"] {
  --color-primary-500: #60a5fa;
  --color-background: #1a1a2e;
}
```

```tsx
/* 使用 Tailwind 类名 */
<button className="bg-primary-500 text-white px-4 py-2 rounded-md">
  Click me
</button>
```

### 2. Dark-First 暗色优先

CodeY 作为 AI IDE 工具，主要用户场景是长时间编码和 AI 对话。暗色主题减少视觉疲劳，提升代码可读性。所有设计决策以 Dark 主题为基准，Light 主题作为补充。

### 3. Information Density 信息密度

IDE 工具需要在有限空间内展示大量信息。设计优先考虑信息密度而非留白：
- 紧凑的面板头部 (`px-3 py-2`)
- 紧凑的文件树项 (`px-2 py-1`)
- 合理的 Tool 输出高度限制 (300px)

### 4. Semantic Color Coding 语义化色彩编码

每种信息类型有固定的色彩映射：
- **Tool 类型**: bash=绿, edit=蓝, git=橙, file=紫, search=青
- **状态**: success=绿, warning=橙, error=红, info=蓝
- **角色**: user=主色, assistant=表面色, system=半透明

### 5. Progressive Disclosure 渐进式展示

复杂信息通过展开/折叠逐步展示：
- ToolCallCard 默认折叠，点击展开详情
- Terminal 默认折叠，点击展开
- ApprovalDialog 仅在需要时弹出

### 6. Responsive Adaptation 响应式适配

三种布局模式自动切换，保证从手机到桌面的可用性：
- **Desktop**: 全面板同时展示
- **Tablet**: 侧栏收缩，详情浮层
- **Mobile**: 全部 Drawer 形式

---

## 色彩体系

### 主色调: Deep Navy (`#0f3460`)

Deep Navy 传达专业、专注的技术氛围。作为 Dark 主题的 primary 色，用于：
- 用户消息背景
- 选中状态背景
- Primary 按钮背景

在 Light 主题中调整为更亮的蓝色 (`#1976d2`)，保持可读性。

### 强调色: Rose (`#e94560`)

Rose 色系用于需要用户注意的交互元素：
- Focus 状态的边框和发光效果
- Streaming 光标
- 文件修改指示器
- 面板拖拽手柄

### 状态色

| 状态 | Dark 色值 | Light 色值 | 用途 |
|------|----------|-----------|------|
| Success | `#4caf50` | `#388e3c` | 完成状态、成功操作 |
| Warning | `#ff9800` | `#f57c00` | 待审批、需要注意 |
| Error | `#f44336` | `#d32f2f` | 失败、错误 |
| Info | `#2196f3` | `#1976d2` | 运行中、提示信息 |

### Tool 类型色

每种 Tool 类型有独立的色彩标识，便于快速识别：

| Tool | Dark | Light | 语义 |
|------|------|-------|------|
| bash | `#4caf50` | `#388e3c` | 终端/命令 (绿色) |
| edit | `#2196f3` | `#1976d2` | 编辑/代码 (蓝色) |
| git | `#ff9800` | `#f57c00` | 版本控制 (橙色) |
| file | `#9c27b0` | `#7b1fa2` | 文件操作 (紫色) |
| search | `#00bcd4` | `#0097a7` | 搜索 (青色) |

### 背景层级

Dark 主题的背景有两层：
- **Page background** (`--color-background`): `#1a1a2e` -- 最深，用于页面底色和代码区域
- **Surface** (`--color-surface`): `#16213e` -- 稍亮，用于卡片、面板、输入框

这种两层结构创造了视觉深度，区分了不同的 UI 区域。

---

## 排版规范

### 双字体方案

| 用途 | Font Family | 说明 |
|------|------------|------|
| 正文 | Inter, system-ui, sans-serif | 高可读性的人文主义无衬线体 |
| 代码 | JetBrains Mono, monospace | 专为编程设计的等宽字体，支持连字 |

### 字号阶梯

基于 1.125 比例尺，16px 为基准：

| Token | Size | px | 用途 |
|-------|------|-----|------|
| `2xs` | 0.625rem | 10px | 极小标签 |
| `xs` | 0.75rem | 12px | Tool 卡片、状态栏、面板标题 |
| `sm` | 0.875rem | 14px | 正文、消息内容、按钮 |
| `base` | 1rem | 16px | 编辑器内容 |
| `lg` | 1.125rem | 18px | 弹窗标题 |
| `xl` | 1.25rem | 20px | 页面标题 |
| `2xl` | 1.5rem | 24px | 大标题 |

### 字重使用

| Weight | Value | 用途 |
|--------|-------|------|
| Normal | 400 | 正文内容 |
| Medium | 500 | 按钮文字、次要强调 |
| Semibold | 600 | Tool 名称、面板标题、列表选中项 |
| Bold | 700 | 弹窗标题、重要强调 |

### 行高

| Token | Value | 用途 |
|-------|-------|------|
| Tight | 1.25 | 标题、按钮 |
| Snug | 1.375 | 紧凑文本 |
| Normal | 1.5 | 正文内容 |
| Relaxed | 1.625 | 长文本阅读 |

### Letter Spacing

| Token | Value | 用途 |
|-------|-------|------|
| Tight | -0.025em | 大字号标题 |
| Normal | 0em | 正文 |
| Wide | 0.025em | 面板标题 (uppercase) |
| Wider | 0.05em | 特殊标签 |

---

## 组件层级

### 全局层级结构

```
IDELayout (z-base)
├── Sidebar (Explorer)
│   ├── Panel Header (px-3 py-2)
│   └── File Tree
│       └── FileTreeItem (px-2 py-1, indent 16px/level)
├── Content Area
│   ├── ChatWindow
│   │   ├── MessageList (px-4 py-3)
│   │   │   └── MessageBubble (mb-3, max-w-[80%])
│   │   │       ├── Content Text (text-sm)
│   │   │       ├── StreamingText (with cursor)
│   │   │       └── ToolCallCard (mt-2, space-y-1)
│   │   │           ├── Header (px-3 py-1.5)
│   │   │           ├── StatusBadge (w-2 h-2)
│   │   │           └── Details (expandable, px-3 py-2)
│   │   └── Input Area (p-3, border-t)
│   │       ├── Textarea (px-3 py-2, rounded-lg)
│   │       └── Buttons (px-3 py-2, rounded-lg)
│   └── EditorPanel
│       ├── Tab Bar (px-3 py-1.5, border-b)
│       ├── Editor (p-4, font-mono)
│       └── Status Bar (px-3 py-1, border-t)
├── DetailsPanel
│   ├── Header (px-3 py-2, border-b)
│   └── Content (p-3)
├── TerminalPanel
│   ├── Header (px-3 py-1, border-b)
│   ├── Output (px-3 py-2, font-mono)
│   └── Input (px-3 py-1, border-t)
└── ApprovalDialog (z-modal, fixed)
    ├── Backdrop (bg-black/50)
    └── Dialog (p-6, rounded-xl, shadow-xl)
```

### 组件分类

| 分类 | 组件 | 说明 |
|------|------|------|
| **Layout** | IDELayout, Sidebar, PanelResizer | 布局容器和交互 |
| **Chat** | ChatWindow, MessageList, MessageBubble, StreamingText, ToolCallCard, ApprovalDialog | 聊天界面 |
| **Tools** | ToolCard, BashTool, EditTool, GitTool, FileTool, SearchTool | Tool 渲染 |
| **Panels** | EditorPanel, TerminalPanel, DetailsPanel | 功能面板 |

---

## 动画规范

### Framer Motion 动画（主要）

| 动画名 | 效果 | 时长 | 缓动 |
|--------|------|------|------|
| `messageEnter` | opacity: 0->1, y: 12->0 | 0.3s | easeOut |
| `toolCardExpand` | height auto-animate | 0.2s | easeInOut |
| `panelSwitch` | opacity: 0->1, x: 8->0 | 0.2s | easeInOut |
| `panelCollapse` | height auto-animate | 0.25s | easeInOut |

### CSS 动画（补充）

| 动画 | 关键帧 | 用途 |
|------|--------|------|
| `fadeIn` | opacity 0->1 | 通用淡入 |
| `slideUpFade` | opacity 0->1 + translateY 12px->0 | 消息出现 |
| `slideInRight` | opacity 0->1 + translateX 8px->0 | 面板滑入 |
| `cursorBlink` | opacity 1->0->1 (step-end) | 流式光标 |

### 动画原则

1. **快速响应**: 交互反馈 < 100ms
2. **平滑过渡**: 内容变化 200-300ms
3. **不阻塞**: 动画不阻止用户操作
4. **有意义**: 动画传达状态变化，不做纯装饰

---

## CSS 变量映射

所有设计 token 通过 CSS 自定义属性暴露，Tailwind 通过 `var(--*)` 引用。

### 变量分类

| 前缀 | 用途 | 示例 |
|------|------|------|
| `--color-background` | 页面背景 | `#1a1a2e` (dark) / `#f5f5f5` (light) |
| `--color-surface` | 卡片/面板背景 | `#16213e` / `#ffffff` |
| `--color-primary` | 主色调 | `#0f3460` / `#1976d2` |
| `--color-accent` | 强调色 | `#e94560` / `#e91e63` |
| `--color-text-*` | 正文 / 次要 / 禁用 / 反色 | 四级文本色 |
| `--color-border-*` | 边框 / hover / focus | 三级边框色 |
| `--color-success-*` | 成功状态 | 绿色系 |
| `--color-warning-*` | 警告状态 | 橙色系 |
| `--color-error-*` | 错误状态 | 红色系 |
| `--color-info-*` | 信息状态 | 蓝色系 |
| `--color-tool-*` | Tool 类型色 | bash / edit / git / file / search |
| `--font-family-*` | 字体家族 | sans / mono |
| `--font-size-*` | 字号 | 2xs / xs / sm / base / lg / xl / 2xl / 3xl |
| `--spacing-*` | 间距 | 0 / 1 / 2 / 3 / 4 / 5 / 6 / 8 / 10 / 12 / 16 / 20 / 24 / 32 |
| `--radius-*` | 圆角 | none / sm / md / lg / xl / 2xl / 3xl / full |
| `--shadow-*` | 阴影 | sm / md / lg / xl / inner / glow-accent / glow-primary |
| `--duration-*` | 动画时长 | instant / fast / normal / slow / slower |
| `--ease-*` | 缓动函数 | in / out / in-out / spring |
| `--z-*` | 层级 | base / dropdown / sticky / panel / overlay / modal / popover / toast / tooltip |

### 主题切换

```tsx
// 通过 data-theme 属性切换
document.documentElement.setAttribute('data-theme', 'dark')

// 或通过 store
const { toggleTheme } = useAppStore()
toggleTheme()
```

---

## 设计决策记录

### Q: 为什么选择 CSS 变量 + Tailwind 而不是纯 Tailwind 配置?

A: CSS 变量支持运行时主题切换，无需重新编译。CodeY 的主题系统通过 `data-theme` 属性和 CSS 变量实现零 JS 开销的主题切换，同时保持与 Tailwind 的兼容性。纯 Tailwind 配置需要重新编译才能切换主题。

### Q: 为什么选择 Deep Navy 而不是纯黑?

A: 纯黑 (`#000000`) 在 OLED 屏幕上会导致"black smearing"现象，且缺乏层次感。Deep Navy (`#1a1a2e`) 提供了足够的对比度，同时允许通过深浅变化创造视觉层级。

### Q: 为什么 Tool 类型使用 5 种不同颜色?

A: AI IDE 中 Tool 调用频繁，用户需要快速识别 Tool 类型。5 种颜色对应 5 种核心操作类别（命令执行、代码编辑、版本控制、文件操作、搜索），色彩差异足够大，即使在色盲场景下也能通过亮度区分。

### Q: 为什么消息气泡最大宽度 80%?

A: 超过 80% 宽度的文本行过长，降低阅读速度。80% 限制保证每行 60-80 个字符，符合最佳阅读宽度。同时左右留白创造了对话的视觉节奏。

---

## 文件索引

| 文件 | 内容 |
|------|------|
| [design-tokens.css](./design-tokens.css) | CSS 自定义属性定义（颜色、排版、间距、圆角、阴影、动画） |
| [tailwind.config.js](./tailwind.config.js) | Tailwind 配置（引用 CSS 变量） |
| [component-styles.md](./component-styles.md) | 组件样式指南（Button、Input、Card、ToolCallCard、Status） |
| [spacing-layout.md](./spacing-layout.md) | 间距与布局规则（4px 网格、面板内边距、响应式断点） |
| [DESIGN.md](./DESIGN.md) | 本文件 -- 设计语言总览 |

### 相关源码

| 文件 | 内容 |
|------|------|
| `styles/theme.css` | 旧版主题 CSS（已迁移到 design-tokens.css） |
| `styles/animations.css` | 旧版动画 CSS（已迁移到 design-tokens.css） |
| `types/layout.ts` | 布局类型和默认配置 |
| `types/message.ts` | 消息和 ToolCall 类型 |
| `types/tool.ts` | Tool 颜色映射 |
| `stores/appStore.ts` | 全局状态管理 |

---

## 快速开始

### 1. 导入设计 token

在项目入口文件中导入：

```tsx
// src/main.tsx 或 src/app/layout.tsx
import './design-system/design-tokens.css'
```

### 2. 配置 Tailwind

在 `tailwind.config.js` 中引用设计 token 配置：

```javascript
const designSystemConfig = require('./design-system/tailwind.config.js')

module.exports = {
  ...designSystemConfig,
  // 项目特定配置
}
```

### 3. 使用组件样式

参考 [component-styles.md](./component-styles.md) 中的代码示例，使用 Tailwind 类名：

```tsx
// Primary Button
<button className="bg-primary text-text-inverse px-4 py-2 rounded-lg">
  Click me
</button>

// Card
<div className="bg-surface border border-border rounded-lg p-4 shadow-md">
  Content
</div>

// Input
<input className="bg-surface text-text border border-border rounded-lg px-3 py-2" />
```

### 4. 切换主题

```tsx
// 切换到暗色主题
document.documentElement.setAttribute('data-theme', 'dark')

// 切换到亮色主题
document.documentElement.setAttribute('data-theme', 'light')
```

---

## 最佳实践

1. **始终使用 CSS 变量** - 不要硬编码颜色、间距等值
2. **使用语义化类名** - `bg-surface` 而不是 `bg-[#16213e]`
3. **遵循间距系统** - 使用 `p-4` 而不是 `p-[15px]`
4. **保持一致性** - 参考 component-styles.md 中的组件样式
5. **支持主题切换** - 所有组件都应支持 dark/light 主题
6. **使用 Tailwind 配置** - 不要自定义 Tailwind，使用提供的配置
7. **导入设计 token** - 确保 CSS 变量在项目中可用
