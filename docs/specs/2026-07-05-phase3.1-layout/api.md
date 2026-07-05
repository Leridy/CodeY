# Phase 3.1 可配置布局 + 面板拖拽 API 文档

> 日期：2026-07-05
> 版本：v1.0.0
> 状态：draft

## 1. 类型定义

### 1.1 GridState

```typescript
/** CSS Grid 网格状态 */
interface GridState {
  /** 列轨道定义 */
  columns: GridTrack[]
  /** 行轨道定义 */
  rows: GridTrack[]
  /** 面板区域映射 */
  areas: GridArea[]
}

/** 网格轨道 */
interface GridTrack {
  /** 当前尺寸 (px 或 fr) */
  size: number
  /** 最小尺寸 (px) */
  min: number
  /** 最大尺寸 (px) */
  max: number
  /** 尺寸单位 */
  unit: 'px' | 'fr'
}

/** 网格区域 */
interface GridArea {
  /** 面板 ID */
  panelId: string
  /** 起始列 (1-based) */
  columnStart: number
  /** 结束列 (1-based) */
  columnEnd: number
  /** 起始行 (1-based) */
  rowStart: number
  /** 结束行 (1-based) */
  rowEnd: number
}
```

### 1.2 PanelState

```typescript
/** 单个面板的状态 */
interface PanelState {
  /** 是否可见 */
  visible: boolean
  /** 是否折叠 */
  collapsed: boolean
  /** 面板在网格中的位置 */
  position: GridArea
  /** 面板尺寸 */
  size: {
    width: number
    height: number
  }
}
```

### 1.3 LayoutPreset

```typescript
/** 布局预设 */
interface LayoutPreset {
  /** 预设唯一 ID */
  id: string
  /** 预设显示名称 */
  name: string
  /** 预设描述 */
  description?: string
  /** 是否为内置预设 */
  builtin: boolean
  /** 网格配置 */
  gridConfig: GridState
  /** 各面板状态 */
  panelStates: Record<string, PanelState>
}
```

### 1.4 DragState

```typescript
/** 拖拽状态 */
interface DragState {
  /** 是否正在拖拽 */
  isDragging: boolean
  /** 拖拽类型 */
  dragType: 'resize' | 'reorder' | null
  /** 拖拽目标面板 ID */
  targetPanelId: string | null
  /** 拖拽方向 */
  direction: 'horizontal' | 'vertical' | null
  /** 起始位置 */
  startPos: { x: number; y: number }
  /** 当前位置 */
  currentPos: { x: number; y: number }
}

/** 吸附辅助线 */
interface SnapGuide {
  /** 辅助线位置 (px) */
  position: number
  /** 辅助线方向 */
  direction: 'horizontal' | 'vertical'
  /** 吸附阈值 (px) */
  threshold: number
}
```

---

## 2. 组件 API

### 2.1 GridContainer

顶层网格容器组件，管理 CSS Grid 布局。

```typescript
interface GridContainerProps {
  /** 网格配置 */
  gridConfig: GridState
  /** 子面板 */
  children: React.ReactNode
  /** 布局变更回调 */
  onLayoutChange?: (config: GridState) => void
  /** 自定义类名 */
  className?: string
}
```

**使用示例**：
```tsx
<GridContainer
  gridConfig={layoutStore.gridConfig}
  onLayoutChange={layoutStore.updateGridConfig}
>
  <PanelSlot panelId="explorer" title="文件" icon={<FolderIcon />}>
    <FileTree />
  </PanelSlot>
  <PanelSlot panelId="chat" title="聊天" icon={<ChatIcon />}>
    <ChatWindow />
  </PanelSlot>
</GridContainer>
```

### 2.2 PanelSlot

面板插槽组件，包含头部、内容和调整手柄。

```typescript
interface PanelSlotProps {
  /** 面板唯一 ID */
  panelId: string
  /** 面板标题 */
  title: string
  /** 面板图标 */
  icon: React.ReactNode
  /** 面板内容 */
  children: React.ReactNode
  /** 是否可折叠 (默认: true) */
  collapsible?: boolean
  /** 是否可关闭 (默认: true) */
  closable?: boolean
  /** 默认是否折叠 (默认: false) */
  defaultCollapsed?: boolean
  /** 最小宽度 (px, 默认: 200) */
  minWidth?: number
  /** 最小高度 (px, 默认: 120) */
  minHeight?: number
  /** 折叠时的宽度 (px, 默认: 48) */
  collapsedWidth?: number
  /** 折叠回调 */
  onCollapse?: () => void
  /** 展开回调 */
  onExpand?: () => void
  /** 关闭回调 */
  onClose?: () => void
  /** 自定义头部渲染 */
  renderHeader?: (props: PanelHeaderRenderProps) => React.ReactNode
}

interface PanelHeaderRenderProps {
  title: string
  icon: React.ReactNode
  collapsed: boolean
  onToggleCollapse: () => void
  onClose: () => void
}
```

**使用示例**：
```tsx
<PanelSlot
  panelId="terminal"
  title="终端"
  icon={<TerminalIcon />}
  collapsible={true}
  closable={true}
  minHeight={120}
  onCollapse={() => console.log('terminal collapsed')}
>
  <TerminalPanel />
</PanelSlot>
```

### 2.3 PanelHeader

面板头部组件，显示标题和操作按钮。

```typescript
interface PanelHeaderProps {
  /** 面板标题 */
  title: string
  /** 面板图标 */
  icon: React.ReactNode
  /** 是否折叠 */
  collapsed: boolean
  /** 是否可折叠 */
  collapsible: boolean
  /** 是否可关闭 */
  closable: boolean
  /** 切换折叠 */
  onToggleCollapse: () => void
  /** 关闭面板 */
  onClose: () => void
  /** 自定义操作按钮 */
  actions?: React.ReactNode
}
```

### 2.4 ResizeHandle

面板调整大小的拖拽手柄。

```typescript
interface ResizeHandleProps {
  /** 调整方向 */
  direction: 'horizontal' | 'vertical'
  /** 目标面板 ID */
  panelId: string
  /** 当前尺寸 (px) */
  size: number
  /** 最小尺寸 (px) */
  min: number
  /** 最大尺寸 (px) */
  max: number
  /** 是否启用吸附 */
  snapEnabled?: boolean
  /** 吸附阈值 (px, 默认: 10) */
  snapThreshold?: number
  /** 尺寸变更回调 */
  onResize: (newSize: number) => void
  /** 拖拽开始回调 */
  onDragStart?: () => void
  /** 拖拽结束回调 */
  onDragEnd?: () => void
}
```

**使用示例**：
```tsx
<ResizeHandle
  direction="horizontal"
  panelId="explorer"
  size={260}
  min={200}
  max={400}
  snapEnabled={true}
  onResize={(newSize) => layoutStore.resizePanel('explorer', newSize)}
/>
```

---

## 3. Store API

### 3.1 LayoutStore Actions

扩展现有 appStore 的 layout slice。

```typescript
interface LayoutActions {
  // --- 网格配置 ---
  /** 更新网格配置 */
  updateGridConfig: (config: Partial<GridState>) => void

  // --- 面板操作 ---
  /** 调整面板大小 */
  resizePanel: (panelId: string, size: number) => void
  /** 折叠面板 */
  collapsePanel: (panelId: string) => void
  /** 展开面板 */
  expandPanel: (panelId: string) => void
  /** 切换面板折叠状态 */
  togglePanelCollapse: (panelId: string) => void
  /** 显示面板 */
  showPanel: (panelId: string) => void
  /** 隐藏面板 */
  hidePanel: (panelId: string) => void
  /** 切换面板可见性 */
  togglePanelVisibility: (panelId: string) => void

  // --- 预设管理 ---
  /** 应用布局预设 */
  applyPreset: (presetId: string) => void
  /** 保存当前布局为预设 */
  saveAsPreset: (name: string) => void
  /** 删除自定义预设 */
  deletePreset: (presetId: string) => void
  /** 重置为默认布局 */
  resetLayout: () => void

  // --- 拖拽状态 ---
  /** 开始拖拽 */
  startDrag: (panelId: string, dragType: DragState['dragType'], direction: DragState['direction']) => void
  /** 更新拖拽位置 */
  updateDrag: (pos: { x: number; y: number }) => void
  /** 结束拖拽 */
  endDrag: () => void
}
```

---

## 4. Hooks API

### 4.1 useGridLayout

管理 CSS Grid 样式计算。

```typescript
function useGridLayout(gridConfig: GridState): {
  /** CSS Grid 样式对象 */
  gridStyle: React.CSSProperties
  /** 更新轨道尺寸 */
  updateTrackSize: (trackIndex: number, newSize: number) => void
  /** 获取面板的 grid-area 值 */
  getPanelArea: (panelId: string) => string
}
```

### 4.2 usePanelDrag

封装面板拖拽逻辑。

```typescript
function usePanelDrag(options: {
  /** 目标面板 ID */
  panelId: string
  /** 拖拽方向 */
  direction: 'horizontal' | 'vertical'
  /** 最小尺寸 */
  min: number
  /** 最大尺寸 */
  max: number
  /** 尺寸变更回调 */
  onResize: (newSize: number) => void
}): {
  /** 是否正在拖拽 */
  isDragging: boolean
  /** 鼠标按下事件处理器 */
  onMouseDown: (e: React.MouseEvent) => void
  /** 触摸开始事件处理器 */
  onTouchStart: (e: React.TouchEvent) => void
}
```

### 4.3 usePanelState

获取和操作单个面板状态。

```typescript
function usePanelState(panelId: string): {
  /** 面板是否可见 */
  visible: boolean
  /** 面板是否折叠 */
  collapsed: boolean
  /** 面板尺寸 */
  size: { width: number; height: number }
  /** 折叠面板 */
  collapse: () => void
  /** 展开面板 */
  expand: () => void
  /** 切换折叠 */
  toggleCollapse: () => void
  /** 显示面板 */
  show: () => void
  /** 隐藏面板 */
  hide: () => void
}
```

### 4.4 useLayoutPreset

管理布局预设。

```typescript
function useLayoutPreset(): {
  /** 当前活跃预设 ID */
  activePresetId: string | null
  /** 所有可用预设 */
  presets: LayoutPreset[]
  /** 应用预设 */
  apply: (presetId: string) => void
  /** 保存当前布局为新预设 */
  save: (name: string) => void
  /** 删除预设 */
  remove: (presetId: string) => void
  /** 重置为默认 */
  reset: () => void
}
```

---

## 5. 内置预设配置

### 5.1 Default 预设

```typescript
const DEFAULT_PRESET: LayoutPreset = {
  id: 'default',
  name: '默认布局',
  description: '标准四面板 IDE 布局',
  builtin: true,
  gridConfig: {
    columns: [
      { size: 260, min: 200, max: 400, unit: 'px' },  // 文件树
      { size: 1, min: 0.3, max: 0.7, unit: 'fr' },    // 聊天/编辑器
      { size: 320, min: 240, max: 480, unit: 'px' },   // 详情面板
    ],
    rows: [
      { size: 1, min: 0.5, max: 0.8, unit: 'fr' },    // 主内容区
      { size: 240, min: 120, max: 480, unit: 'px' },   // 终端
    ],
    areas: [
      { panelId: 'explorer', columnStart: 1, columnEnd: 2, rowStart: 1, rowEnd: 2 },
      { panelId: 'content', columnStart: 2, columnEnd: 3, rowStart: 1, rowEnd: 2 },
      { panelId: 'details', columnStart: 3, columnEnd: 4, rowStart: 1, rowEnd: 2 },
      { panelId: 'terminal', columnStart: 1, columnEnd: 4, rowStart: 2, rowEnd: 3 },
    ],
  },
  panelStates: {
    explorer: { visible: true, collapsed: false, position: { panelId: 'explorer', columnStart: 1, columnEnd: 2, rowStart: 1, rowEnd: 2 }, size: { width: 260, height: 600 } },
    content: { visible: true, collapsed: false, position: { panelId: 'content', columnStart: 2, columnEnd: 3, rowStart: 1, rowEnd: 2 }, size: { width: 800, height: 600 } },
    details: { visible: true, collapsed: false, position: { panelId: 'details', columnStart: 3, columnEnd: 4, rowStart: 1, rowEnd: 2 }, size: { width: 320, height: 600 } },
    terminal: { visible: true, collapsed: false, position: { panelId: 'terminal', columnStart: 1, columnEnd: 4, rowStart: 2, rowEnd: 3 }, size: { width: 1380, height: 240 } },
  },
}
```

### 5.2 Focus 预设

```typescript
const FOCUS_PRESET: LayoutPreset = {
  id: 'focus',
  name: '专注模式',
  description: '聊天/编辑器最大化，其他面板折叠',
  builtin: true,
  gridConfig: {
    columns: [
      { size: 48, min: 48, max: 48, unit: 'px' },     // 文件树折叠
      { size: 1, min: 0.5, max: 1, unit: 'fr' },      // 聊天/编辑器
      { size: 0, min: 0, max: 0, unit: 'px' },         // 详情隐藏
    ],
    rows: [
      { size: 1, min: 1, max: 1, unit: 'fr' },        // 主内容区
      { size: 0, min: 0, max: 0, unit: 'px' },         // 终端隐藏
    ],
    areas: [
      { panelId: 'explorer', columnStart: 1, columnEnd: 2, rowStart: 1, rowEnd: 2 },
      { panelId: 'content', columnStart: 2, columnEnd: 3, rowStart: 1, rowEnd: 2 },
    ],
  },
  panelStates: {
    explorer: { visible: true, collapsed: true, position: { panelId: 'explorer', columnStart: 1, columnEnd: 2, rowStart: 1, rowEnd: 2 }, size: { width: 48, height: 600 } },
    content: { visible: true, collapsed: false, position: { panelId: 'content', columnStart: 2, columnEnd: 3, rowStart: 1, rowEnd: 2 }, size: { width: 1200, height: 600 } },
    details: { visible: false, collapsed: false, position: { panelId: 'details', columnStart: 3, columnEnd: 4, rowStart: 1, rowEnd: 2 }, size: { width: 0, height: 0 } },
    terminal: { visible: false, collapsed: false, position: { panelId: 'terminal', columnStart: 1, columnEnd: 4, rowStart: 2, rowEnd: 3 }, size: { width: 0, height: 0 } },
  },
}
```

### 5.3 Wide 预设

```typescript
const WIDE_PRESET: LayoutPreset = {
  id: 'wide',
  name: '宽屏模式',
  description: '聊天和编辑器左右并排，终端底部',
  builtin: true,
  gridConfig: {
    columns: [
      { size: 260, min: 200, max: 400, unit: 'px' },  // 文件树
      { size: 1, min: 0.3, max: 0.7, unit: 'fr' },    // 聊天
      { size: 1, min: 0.3, max: 0.7, unit: 'fr' },    // 编辑器
    ],
    rows: [
      { size: 1, min: 0.5, max: 0.8, unit: 'fr' },    // 主内容区
      { size: 240, min: 120, max: 480, unit: 'px' },   // 终端
    ],
    areas: [
      { panelId: 'explorer', columnStart: 1, columnEnd: 2, rowStart: 1, rowEnd: 2 },
      { panelId: 'chat', columnStart: 2, columnEnd: 3, rowStart: 1, rowEnd: 2 },
      { panelId: 'editor', columnStart: 3, columnEnd: 4, rowStart: 1, rowEnd: 2 },
      { panelId: 'terminal', columnStart: 1, columnEnd: 4, rowStart: 2, rowEnd: 3 },
    ],
  },
  panelStates: {
    explorer: { visible: true, collapsed: false, position: { panelId: 'explorer', columnStart: 1, columnEnd: 2, rowStart: 1, rowEnd: 2 }, size: { width: 260, height: 600 } },
    chat: { visible: true, collapsed: false, position: { panelId: 'chat', columnStart: 2, columnEnd: 3, rowStart: 1, rowEnd: 2 }, size: { width: 560, height: 600 } },
    editor: { visible: true, collapsed: false, position: { panelId: 'editor', columnStart: 3, columnEnd: 4, rowStart: 1, rowEnd: 2 }, size: { width: 560, height: 600 } },
    terminal: { visible: true, collapsed: false, position: { panelId: 'terminal', columnStart: 1, columnEnd: 4, rowStart: 2, rowEnd: 3 }, size: { width: 1380, height: 240 } },
  },
}
```

---

## 6. localStorage 存储格式

### 6.1 存储 Key

```
codey-layout-config
```

### 6.2 存储结构

```typescript
interface LayoutPersistData {
  /** 版本号，用于迁移 */
  version: number
  /** 当前网格配置 */
  gridConfig: GridState
  /** 各面板状态 */
  panelStates: Record<string, PanelState>
  /** 当前活跃预设 ID */
  activePresetId: string | null
  /** 用户自定义预设 */
  customPresets: LayoutPreset[]
}
```

### 6.3 示例数据

```json
{
  "version": 1,
  "gridConfig": {
    "columns": [
      { "size": 260, "min": 200, "max": 400, "unit": "px" },
      { "size": 1, "min": 0.3, "max": 0.7, "unit": "fr" },
      { "size": 320, "min": 240, "max": 480, "unit": "px" }
    ],
    "rows": [
      { "size": 1, "min": 0.5, "max": 0.8, "unit": "fr" },
      { "size": 240, "min": 120, "max": 480, "unit": "px" }
    ],
    "areas": []
  },
  "panelStates": {
    "explorer": { "visible": true, "collapsed": false, "position": { "panelId": "explorer", "columnStart": 1, "columnEnd": 2, "rowStart": 1, "rowEnd": 2 }, "size": { "width": 260, "height": 600 } }
  },
  "activePresetId": "default",
  "customPresets": []
}
```

---

*API 文档版本: v1.0.0*
*最后更新: 2026-07-05*
