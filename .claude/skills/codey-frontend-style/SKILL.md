---
name: codey-frontend-style
description: 在实现或修改 UI 组件、调整样式/动画/主题、添加响应式布局或构建新 Tool 渲染组件时使用此 skill。提供 IDE 风格四面板布局、Chat UI 组件、主题切换的完整组件库。触发关键词："UI"、"组件"、"样式"、"主题"、"布局"、"动画"、"Chat"、"Panel"。
---

# 前端设计系统 Skill

CodeY 前端设计系统，提供 IDE 风格四面板布局、Chat UI 组件、Tool 渲染、主题切换和响应式适配。

## 何时激活

- 实现或修改 UI 组件（Chat、Panel、Tool 卡片等）
- 调整样式、动画或主题配色
- 添加响应式布局适配
- 构建新的 Tool 渲染组件

## 快速示例

```tsx
import { IDELayout, ChatWindow, useAppStore } from './components'
import './styles/theme.css'
import './styles/animations.css'

function App() {
  const { chat, sendMessage } = useAppStore()

  return (
    <IDELayout
      explorer={<Sidebar />}
      content={
        <ChatWindow
          messages={chat.messages}
          isStreaming={chat.isStreaming}
          onSend={sendMessage}
        />
      }
      details={<DetailsPanel />}
      terminal={<TerminalPanel />}
    />
  )
}
```

## 目录结构

```
codey-frontend-style/
├── SKILL.md          # 入口文件
├── README.md         # 详细文档
├── types/            # TypeScript 类型定义
├── styles/           # CSS 样式（主题、动画）
├── hooks/            # React Hooks
├── stores/           # Zustand 状态管理
└── components/       # UI 组件
    ├── layout/       # IDELayout, Sidebar, PanelResizer
    ├── chat/         # ChatWindow, MessageList, ToolCallCard
    ├── tools/        # ToolCard, BashTool, EditTool
    ├── editor/       # EditorPanel
    ├── terminal/     # TerminalPanel
    └── details/      # DetailsPanel
```

## 设计原则

- IDE 风格四面板布局
- Dark/Light 主题支持
- Framer Motion 流畅动画
- 响应式窗口适配

## 内置资源

- `types/` - TypeScript 类型定义
- `styles/` - CSS 变量和动画
- `hooks/` - 布局、流式渲染 Hooks
- `stores/` - Zustand 全局状态
- `components/` - 完整组件库

完整文档见 `README.md`。
