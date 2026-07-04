# codey-frontend-style

CodeY 前端设计系统 -- 提供 IDE 风格四面板布局、Chat UI 组件、Tool 渲染、主题切换和响应式适配的完整组件库与样式方案。

## 何时使用

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
├── SKILL.md          # 本文件 -- 快速入口
├── README.md         # 详细文档
├── types/            # TypeScript 类型定义
│   ├── layout.ts     #   布局模式、面板配置、文件节点
│   ├── message.ts    #   消息、ToolCall、ToolResult
│   └── tool.ts       #   搜索结果、终端行、Tool 颜色映射
├── styles/           # CSS 样式
│   ├── theme.css     #   Dark/Light 主题 CSS 变量
│   └── animations.css#   补充 CSS 动画（cursor blink 等）
├── hooks/            # React Hooks
│   ├── useLayoutMode.ts     # 响应式窗口宽度检测
│   ├── usePanelVisibility.ts# 面板可见性派生
│   └── useStreaming.ts      # 流式文本逐字渲染
├── stores/           # 状态管理
│   └── appStore.ts   #   Zustand 全局 store（layout/chat/editor/theme）
└── components/       # UI 组件
    ├── layout/       #   IDELayout, Sidebar, PanelResizer
    ├── chat/         #   ChatWindow, MessageList, MessageBubble, StreamingText, ToolCallCard, ApprovalDialog
    ├── tools/        #   ToolCard, BashTool, EditTool, GitTool, FileTool, SearchTool
    ├── editor/       #   EditorPanel
    ├── terminal/     #   TerminalPanel
    └── details/      #   DetailsPanel
```

## 详细文档

参见 [README.md](./README.md) 获取组件层级、动画规格、主题自定义等完整说明。
