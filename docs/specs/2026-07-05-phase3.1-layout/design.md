# Phase 3.1 可配置布局 + 面板拖拽 设计文档

> 日期：2026-07-05
> 版本：v1.0.0
> 状态：draft
> 阶段：Phase 3.1 - 可配置布局 + 面板拖拽

## 1. 概述

### 1.1 功能描述

Phase 3.1 是 Phase 3 前端 UI 的第一个子阶段，目标是将现有的静态四面板布局升级为完全可配置的拖拽布局系统。用户可以自由调整面板大小、位置，保存和恢复布局预设，并支持面板的折叠/展开/关闭操作。

### 1.2 设计目标

| 目标 | 说明 |
|------|------|
| 面板拖拽调整 | 支持拖拽面板边缘调整大小，替代现有的 PanelResizer |
| 面板折叠/展开 | 每个面板支持折叠为图标栏或完全隐藏 |
| 布局持久化 | 用户布局配置自动保存到 localStorage |
| 布局预设 | 提供 2-3 种内置布局预设（Default、Focus、Wide） |
| 响应式适配 | 保持现有的 desktop/tablet/mobile 三档适配 |
| 动画流畅 | 使用 Framer Motion 实现面板切换动画 |

### 1.3 头脑风暴决策

| 问题 | 决策 | 说明 |
|------|------|------|
| 拖拽方案 | A: CSS Grid + 自定义拖拽 | 轻量、可控，不引入外部拖拽库 |
| 布局存储 | A: localStorage + Zustand persist | 与现有 appStore 集成 |
| 面板数量 | B: 可动态增减 | 支持用户关闭不需要的面板 |
| 预设方案 | A: 3 种内置预设 | Default、Focus、Wide |
| 分割方式 | A: CSS Grid 比例分割 | 精确控制面板比例 |

---

## 2. 架构设计

### 2.1 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                    Phase 3.1 布局架构                         │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                 LayoutEngine                        │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │    │
│  │  │ GridManager │  │ PanelDock   │  │ PresetMgr   │ │    │
│  │  │ (网格管理)   │  │ (面板停靠)   │  │ (预设管理)   │ │    │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘ │    │
│  └─────────┼────────────────┼────────────────┼─────────┘    │
│            │                │                │              │
│  ┌─────────▼────────────────▼────────────────▼─────────┐    │
│  │              DragManager (拖拽管理)                  │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │    │
│  │  │ ResizeHandle│  │ DropZone    │  │ SnapGuide   │ │    │
│  │  │ (调整手柄)   │  │ (放置区域)   │  │ (吸附辅助)   │ │    │
│  │  └─────────────┘  └─────────────┘  └─────────────┘ │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              PanelRegistry (面板注册表)              │    │
│  │  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ │    │
│  │  │Chat │ │Edit │ │Term │ │File │ │Git  │ │Srch │ │    │
│  │  │Panel│ │Panel│ │Panel│ │Tree │ │Panel│ │Panel│ │    │
│  │  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 组件层次结构

```
App
└── LayoutProvider (布局上下文)
    └── GridContainer (CSS Grid 容器)
        ├── PanelSlot (面板插槽 - 左侧)
        │   ├── PanelHeader (面板头部: 标题 + 操作按钮)
        │   ├── PanelContent (面板内容)
        │   └── ResizeHandle (拖拽调整手柄)
        ├── PanelSlot (面板插槽 - 中间)
        │   ├── PanelHeader
        │   ├── PanelContent
        │   └── ResizeHandle
        ├── PanelSlot (面板插槽 - 右侧)
        │   ├── PanelHeader
        │   └── PanelContent
        └── PanelSlot (面板插槽 - 底部)
            ├── PanelHeader
            ├── PanelContent
            └── ResizeHandle
```

### 2.3 数据流

```
用户拖拽面板边缘
      │
      ▼
ResizeHandle.onDragStart
      │
      ▼
DragManager.startResize(panelId, direction)
      │
      ▼
GridManager.updateTrackSize(trackIndex, newSize)
      │
      ▼
CSS Grid 更新 (grid-template-columns / grid-template-rows)
      │
      ▼
PanelSlot 重新渲染
      │
      ▼
ResizeHandle.onDragEnd
      │
      ▼
LayoutStore.saveLayout() → localStorage
```

---

## 3. 模块详细设计

### 3.1 GridManager（网格管理器）

管理 CSS Grid 的轨道（track）尺寸和面板分配。

**职责**：
- 维护 grid-template-columns 和 grid-template-rows 配置
- 处理面板尺寸约束（min/max）
- 计算面板折叠/展开后的网格变化

**核心状态**：
```typescript
interface GridState {
  columns: GridTrack[]    // 列轨道定义
  rows: GridTrack[]       // 行轨道定义
  areas: GridArea[]       // 面板区域映射
}

interface GridTrack {
  size: number            // 当前尺寸 (px 或 fr)
  min: number             // 最小尺寸
  max: number             // 最大尺寸
  unit: 'px' | 'fr'      // 单位
}
```

### 3.2 PanelSlot（面板插槽）

面板的容器组件，负责渲染面板头部、内容区域和调整手柄。

**职责**：
- 渲染面板头部（标题、折叠/关闭按钮）
- 管理面板折叠/展开状态
- 提供 ResizeHandle 拖拽调整

**Props**：
```typescript
interface PanelSlotProps {
  panelId: string
  title: string
  icon: React.ReactNode
  children: React.ReactNode
  collapsible?: boolean
  closable?: boolean
  defaultCollapsed?: boolean
  onCollapse?: () => void
  onExpand?: () => void
  onClose?: () => void
}
```

### 3.3 DragManager（拖拽管理器）

统一管理面板拖拽操作（调整大小、未来扩展为面板重排）。

**职责**：
- 监听鼠标/触摸事件
- 计算拖拽增量
- 应用尺寸约束
- 发出吸附辅助线

**核心方法**：
```typescript
interface DragManager {
  startResize(panelId: string, direction: 'horizontal' | 'vertical'): void
  updateDrag(deltaX: number, deltaY: number): void
  endDrag(): void
  getSnapGuides(): SnapGuide[]
}
```

### 3.4 LayoutStore（布局状态管理）

扩展现有 appStore 的 layout 部分，增加布局持久化和预设管理。

**新增状态**：
```typescript
interface LayoutState {
  // 现有字段保留
  mode: LayoutMode
  contentMode: ContentMode
  splitRatio: number
  explorerCollapsed: boolean
  detailsVisible: boolean
  terminalCollapsed: boolean

  // 新增字段
  gridConfig: GridState           // 网格配置
  panelStates: Map<string, PanelState>  // 面板状态
  activePreset: string | null     // 当前预设名称
  presets: LayoutPreset[]         // 可用预设列表
}

interface PanelState {
  visible: boolean
  collapsed: boolean
  position: GridArea
  size: { width: number; height: number }
}

interface LayoutPreset {
  id: string
  name: string
  gridConfig: GridState
  panelStates: Map<string, PanelState>
}
```

### 3.5 PresetManager（预设管理器）

管理内置布局预设和用户自定义预设。

**内置预设**：

| 预设名称 | 说明 | 布局 |
|----------|------|------|
| Default | 标准四面板 | 左侧文件树 + 中间聊天/编辑器 + 右侧详情 + 底部终端 |
| Focus | 专注模式 | 中间聊天/编辑器最大化，其他面板折叠 |
| Wide | 宽屏模式 | 聊天和编辑器左右并排，终端底部 |

---

## 4. 技术选型

### 4.1 技术栈

| 技术 | 用途 | 说明 |
|------|------|------|
| CSS Grid | 布局引擎 | 精确控制面板比例和位置 |
| Zustand | 状态管理 | 扩展现有 appStore，persist 中间件 |
| Framer Motion | 动画 | 面板折叠/展开动画 |
| Tailwind CSS | 样式 | 工具类样式 |
| Radix UI | 无障碍基础 | Tooltip、Popover 等基础组件 |

### 4.2 方案对比

#### 拖拽方案对比

| 方案 | 优势 | 劣势 | 决策 |
|------|------|------|------|
| react-grid-layout | 功能完善 | 依赖重、样式定制难 | 不采用 |
| react-mosaic | 窗口化布局 | 与 IDE 风格不符 | 不采用 |
| CSS Grid + 自定义 | 轻量、完全可控 | 需自行实现拖拽逻辑 | **采用** |

#### 状态管理方案对比

| 方案 | 优势 | 劣势 | 决策 |
|------|------|------|------|
| Redux Toolkit | 生态完善 | 样板代码多 | 不采用 |
| Jotai | 原子化 | 布局状态不适合原子化 | 不采用 |
| Zustand | 轻量、已有基础 | - | **采用** |

---

## 5. 响应式适配

### 5.1 断点策略

```
┌─────────────────────────────────────────────────────────────┐
│                    响应式断点策略                             │
│                                                             │
│  Mobile (<768px)                                            │
│  ┌─────────────────┐                                       │
│  │   单面板模式     │  底部 Tab 切换面板                     │
│  │   全屏显示       │  抽屉式导航                           │
│  └─────────────────┘                                       │
│                                                             │
│  Tablet (768px - 1280px)                                    │
│  ┌────────┬────────┐                                       │
│  │ 侧边栏  │ 内容区  │  侧边栏可折叠                        │
│  │ (图标)  │        │  底部终端可折叠                       │
│  └────────┴────────┘                                       │
│                                                             │
│  Desktop (>1280px)                                          │
│  ┌────┬──────────┬────┐                                   │
│  │文件 │  内容区   │详情│  四面板完整布局                     │
│  │ 树  │          │面板│  所有面板可调整                     │
│  ├────┴──────────┴────┤                                   │
│  │      终端面板       │                                   │
│  └────────────────────┘                                   │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 面板可见性矩阵

| 面板 | Desktop | Tablet | Mobile |
|------|---------|--------|--------|
| 文件树 | 侧边栏 | 图标栏 | 抽屉 |
| 聊天区 | 面板 | 面板 | 全屏 |
| 编辑器 | 面板 | 面板 | 全屏 |
| 详情面板 | 面板 | 浮动 | 抽屉 |
| 终端 | 面板 | 面板 | 抽屉 |

---

## 6. 实现顺序

```
Phase 3.1.1: GridManager + PanelSlot 基础实现
      │
      ▼
Phase 3.1.2: ResizeHandle 拖拽调整
      │
      ▼
Phase 3.1.3: LayoutStore 扩展 + 布局持久化
      │
      ▼
Phase 3.1.4: PanelSlot 折叠/展开/关闭
      │
      ▼
Phase 3.1.5: PresetManager + 内置预设
      │
      ▼
Phase 3.1.6: 响应式适配 + 动画优化
```

---

## 7. 与现有代码的关系

### 7.1 保留的组件

| 组件 | 处理方式 | 说明 |
|------|----------|------|
| IDELayout.tsx | 重构 | 替换为 GridContainer + PanelSlot 组合 |
| PanelResizer.tsx | 替换 | 替换为 ResizeHandle，支持更丰富的拖拽 |
| Sidebar.tsx | 保留 | 作为 PanelSlot 的内容 |

### 7.2 扩展的 Store

| Store | 处理方式 | 说明 |
|-------|----------|------|
| appStore.ts | 扩展 | layout 部分增加 gridConfig、panelStates、presets |

### 7.3 保留的 Hooks

| Hook | 处理方式 | 说明 |
|------|----------|------|
| useLayoutMode.ts | 保留 | 响应式断点检测 |
| usePanelVisibility.ts | 重构 | 基于 GridState 计算可见性 |
| useStreaming.ts | 保留 | 流式渲染逻辑不变 |

---

## 8. 成功标准

- [ ] 面板可通过拖拽边缘调整大小
- [ ] 面板支持折叠/展开操作
- [ ] 面板支持关闭/重新打开
- [ ] 布局配置自动保存到 localStorage
- [ ] 提供 3 种内置布局预设
- [ ] 用户可保存自定义布局预设
- [ ] 响应式适配 desktop/tablet/mobile
- [ ] 面板切换动画流畅（Framer Motion）
- [ ] 所有现有功能不受影响
- [ ] 单元测试覆盖率 >= 80%

---

*文档版本: v1.0.0*
*最后更新: 2026-07-05*
