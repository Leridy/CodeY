# Phase 3.1 可配置布局 + 面板拖拽 测试计划

> 日期：2026-07-05
> 版本：v1.0.0
> 状态：draft

## 1. 测试目标

| 目标 | 说明 |
|------|------|
| GridManager | 网格配置计算正确性 |
| PanelSlot | 面板折叠/展开/关闭功能 |
| ResizeHandle | 拖拽调整大小功能 |
| LayoutStore | 状态管理和持久化 |
| PresetManager | 预设切换和自定义预设 |
| 响应式适配 | 不同断点下的面板可见性 |
| 动画 | Framer Motion 动画流畅性 |

---

## 2. 单元测试

### 2.1 GridManager

| 测试场景 | 输入 | 预期结果 | 测试类型 |
|----------|------|----------|----------|
| 初始化默认网格配置 | DEFAULT_PANEL_CONFIG | columns/rows/areas 正确 | 单元测试 |
| 更新列轨道尺寸 | trackIndex=0, newSize=300 | columns[0].size=300 | 单元测试 |
| 尺寸约束 - 最小值 | trackIndex=0, newSize=100 | columns[0].size=200 (min) | 单元测试 |
| 尺寸约束 - 最大值 | trackIndex=0, newSize=500 | columns[0].size=400 (max) | 单元测试 |
| 计算 CSS Grid 样式 | GridState | grid-template-columns 正确 | 单元测试 |
| 获取面板 grid-area | panelId='explorer' | 返回正确的 area 字符串 | 单元测试 |
| 面板折叠后网格更新 | collapsePanel('explorer') | 对应列 size 变为 collapsedWidth | 单元测试 |
| 面板展开后网格更新 | expandPanel('explorer') | 对应列 size 恢复原值 | 单元测试 |

### 2.2 PanelSlot

| 测试场景 | 输入 | 预期结果 | 测试类型 |
|----------|------|----------|----------|
| 渲染面板头部 | title, icon | 头部显示标题和图标 | 单元测试 |
| 渲染面板内容 | children | 内容区域正确渲染 | 单元测试 |
| 折叠操作 | 点击折叠按钮 | collapsed=true，内容隐藏 | 单元测试 |
| 展开操作 | 点击展开按钮 | collapsed=false，内容显示 | 单元测试 |
| 关闭操作 | 点击关闭按钮 | visible=false，面板隐藏 | 单元测试 |
| 不可折叠 | collapsible=false | 折叠按钮不显示 | 单元测试 |
| 不可关闭 | closable=false | 关闭按钮不显示 | 单元测试 |
| 默认折叠 | defaultCollapsed=true | 初始状态为折叠 | 单元测试 |
| 自定义头部 | renderHeader | 使用自定义渲染函数 | 单元测试 |

### 2.3 ResizeHandle

| 测试场景 | 输入 | 预期结果 | 测试类型 |
|----------|------|----------|----------|
| 水平拖拽调整 | direction='horizontal', deltaX=50 | 宽度增加 50px | 单元测试 |
| 垂直拖拽调整 | direction='vertical', deltaY=30 | 高度增加 30px | 单元测试 |
| 最小尺寸约束 | 拖拽到 min 以下 | 停止在 min 值 | 单元测试 |
| 最大尺寸约束 | 拖拽到 max 以上 | 停止在 max 值 | 单元测试 |
| 吸附功能 | 拖拽到吸附阈值内 | 自动吸附到辅助线 | 单元测试 |
| 拖拽开始回调 | mousedown | onDragStart 被调用 | 单元测试 |
| 拖拽结束回调 | mouseup | onDragEnd 被调用 | 单元测试 |
| 触摸事件支持 | touchstart/touchmove/touchend | 正确处理触摸拖拽 | 单元测试 |

### 2.4 LayoutStore

| 测试场景 | 输入 | 预期结果 | 测试类型 |
|----------|------|----------|----------|
| 更新网格配置 | updateGridConfig({columns: [...]}) | gridConfig 正确更新 | 单元测试 |
| 调整面板大小 | resizePanel('explorer', 300) | panelStates.explorer.size.width=300 | 单元测试 |
| 折叠面板 | collapsePanel('explorer') | panelStates.explorer.collapsed=true | 单元测试 |
| 展开面板 | expandPanel('explorer') | panelStates.explorer.collapsed=false | 单元测试 |
| 切换折叠 | togglePanelCollapse('explorer') | collapsed 状态翻转 | 单元测试 |
| 显示面板 | showPanel('details') | panelStates.details.visible=true | 单元测试 |
| 隐藏面板 | hidePanel('details') | panelStates.details.visible=false | 单元测试 |
| 切换可见性 | togglePanelVisibility('details') | visible 状态翻转 | 单元测试 |
| 应用预设 | applyPreset('focus') | gridConfig 和 panelStates 更新 | 单元测试 |
| 保存自定义预设 | saveAsPreset('my-layout') | customPresets 增加新预设 | 单元测试 |
| 删除自定义预设 | deletePreset('my-layout') | customPresets 移除该预设 | 单元测试 |
| 重置布局 | resetLayout() | 恢复到 DEFAULT_PRESET | 单元测试 |
| 持久化到 localStorage | 布局变更后 | localStorage 包含最新配置 | 单元测试 |
| 从 localStorage 恢复 | 页面加载 | 布局配置正确恢复 | 单元测试 |
| 开始拖拽 | startDrag('explorer', 'resize', 'horizontal') | dragState.isDragging=true | 单元测试 |
| 更新拖拽位置 | updateDrag({x: 100, y: 200}) | dragState.currentPos 更新 | 单元测试 |
| 结束拖拽 | endDrag() | dragState.isDragging=false | 单元测试 |

### 2.5 PresetManager

| 测试场景 | 输入 | 预期结果 | 测试类型 |
|----------|------|----------|----------|
| 加载内置预设 | 初始化 | 3 个内置预设可用 | 单元测试 |
| 应用 Default 预设 | applyPreset('default') | 四面板布局 | 单元测试 |
| 应用 Focus 预设 | applyPreset('focus') | 聊天最大化 | 单元测试 |
| 应用 Wide 预设 | applyPreset('wide') | 聊天+编辑器并排 | 单元测试 |
| 保存自定义预设 | saveAsPreset('custom') | 预设保存到 customPresets | 单元测试 |
| 删除内置预设 | deletePreset('default') | 操作被拒绝（内置不可删除） | 单元测试 |
| 删除自定义预设 | deletePreset('custom') | 预设从 customPresets 移除 | 单元测试 |
| 预设持久化 | 保存预设后刷新 | 自定义预设仍然存在 | 单元测试 |

### 2.6 usePanelDrag Hook

| 测试场景 | 输入 | 预期结果 | 测试类型 |
|----------|------|----------|----------|
| 鼠标按下开始拖拽 | mousedown | isDragging=true | 单元测试 |
| 鼠标移动更新尺寸 | mousemove(deltaX=50) | onResize 被调用 | 单元测试 |
| 鼠标释放结束拖拽 | mouseup | isDragging=false | 单元测试 |
| 触摸开始拖拽 | touchstart | isDragging=true | 单元测试 |
| 触摸移动更新尺寸 | touchmove(deltaX=50) | onResize 被调用 | 单元测试 |
| 触摸结束拖拽 | touchend | isDragging=false | 单元测试 |
| 尺寸约束生效 | 拖拽超出 min/max | 尺寸被约束 | 单元测试 |

### 2.7 useLayoutPreset Hook

| 测试场景 | 输入 | 预期结果 | 测试类型 |
|----------|------|----------|----------|
| 获取当前预设 | 初始化 | activePresetId='default' | 单元测试 |
| 获取所有预设 | 初始化 | presets 包含 3 个内置预设 | 单元测试 |
| 应用预设 | apply('focus') | activePresetId='focus' | 单元测试 |
| 保存预设 | save('my-layout') | presets 增加新预设 | 单元测试 |
| 删除预设 | remove('my-layout') | presets 移除该预设 | 单元测试 |
| 重置布局 | reset() | 恢复默认预设 | 单元测试 |

---

## 3. 集成测试

### 3.1 布局完整流程

| 测试场景 | 操作步骤 | 预期结果 | 测试类型 |
|----------|----------|----------|----------|
| 完整拖拽流程 | mousedown → mousemove → mouseup | 面板尺寸正确更新，布局持久化 | 集成测试 |
| 面板折叠后拖拽 | 折叠面板 → 展开 → 拖拽 | 拖拽功能正常 | 集成测试 |
| 预设切换后拖拽 | 切换预设 → 拖拽面板 | 新布局下拖拽正常 | 集成测试 |
| 多面板连续拖拽 | 依次拖拽多个面板边缘 | 所有面板尺寸正确 | 集成测试 |
| 布局持久化恢复 | 修改布局 → 刷新页面 | 布局配置正确恢复 | 集成测试 |
| 响应式切换 | desktop → tablet → mobile | 面板可见性正确切换 | 集成测试 |

### 3.2 Store 与组件联动

| 测试场景 | 操作步骤 | 预期结果 | 测试类型 |
|----------|----------|----------|----------|
| Store 状态驱动渲染 | 修改 panelStates | 组件正确响应 | 集成测试 |
| 组件操作更新 Store | 点击折叠按钮 | Store 状态正确更新 | 集成测试 |
| 预设应用到 UI | applyPreset('focus') | UI 切换到专注模式 | 集成测试 |
| localStorage 同步 | 布局变更 | localStorage 内容同步更新 | 集成测试 |

---

## 4. E2E 测试

### 4.1 关键用户流程

| 测试场景 | 操作步骤 | 预期结果 | 测试工具 |
|----------|----------|----------|----------|
| 首次加载默认布局 | 打开应用 | 显示四面板默认布局 | Playwright |
| 拖拽调整面板大小 | 拖拽面板边缘 | 面板大小改变 | Playwright |
| 折叠和展开面板 | 点击折叠/展开按钮 | 面板正确折叠/展开 | Playwright |
| 关闭和重新打开面板 | 关闭面板 → 菜单重新打开 | 面板重新显示 | Playwright |
| 切换布局预设 | 选择 Focus 预设 | 布局切换到专注模式 | Playwright |
| 保存自定义预设 | 调整布局 → 保存预设 | 预设保存成功 | Playwright |
| 布局持久化 | 修改布局 → 刷新页面 | 布局保持修改后的状态 | Playwright |
| 响应式适配 | 调整浏览器宽度 | 面板布局自动适配 | Playwright |

---

## 5. 测试工具

| 工具 | 用途 | 版本 |
|------|------|------|
| Vitest | 单元测试和集成测试 | 4.x |
| @testing-library/react | 组件测试 | 16.x |
| @testing-library/user-event | 用户交互模拟 | 14.x |
| Playwright | E2E 测试 | 1.x |
| jsdom | DOM 环境模拟 | latest |

---

## 6. 测试数据

### 6.1 Mock 数据

| 数据类型 | 说明 |
|----------|------|
| DEFAULT_GRID_STATE | 默认网格配置 |
| FOCUS_GRID_STATE | 专注模式网格配置 |
| WIDE_GRID_STATE | 宽屏模式网格配置 |
| MOCK_PANEL_STATES | 各面板初始状态 |
| MOCK_LOCALSTORAGE_DATA | localStorage 模拟数据 |

### 6.2 测试环境

| 配置 | 值 |
|------|------|
| 浏览器 | Chromium (Playwright) |
| 视口尺寸 | 1920x1080 (Desktop), 1024x768 (Tablet), 375x667 (Mobile) |
| localStorage | 测试前清空，测试后清理 |

---

## 7. 覆盖率目标

| 模块 | 目标覆盖率 | 说明 |
|------|-----------|------|
| GridManager | >= 90% | 核心布局逻辑 |
| PanelSlot | >= 85% | 组件交互 |
| ResizeHandle | >= 85% | 拖拽逻辑 |
| LayoutStore | >= 90% | 状态管理 |
| PresetManager | >= 85% | 预设管理 |
| Hooks | >= 80% | 自定义 Hooks |
| **整体** | **>= 85%** | 加权平均 |

---

## 8. 测试执行计划

```
Phase 3.1.1: GridManager + PanelSlot 基础实现
  └── 单元测试: GridManager 8 个 + PanelSlot 9 个

Phase 3.1.2: ResizeHandle 拖拽调整
  └── 单元测试: ResizeHandle 8 个 + usePanelDrag 7 个

Phase 3.1.3: LayoutStore 扩展 + 布局持久化
  └── 单元测试: LayoutStore 17 个

Phase 3.1.4: PanelSlot 折叠/展开/关闭
  └── 集成测试: Store 与组件联动 4 个

Phase 3.1.5: PresetManager + 内置预设
  └── 单元测试: PresetManager 8 个 + useLayoutPreset 6 个

Phase 3.1.6: 响应式适配 + 动画优化
  └── E2E 测试: 8 个关键用户流程
```

---

*测试计划版本: v1.0.0*
*最后更新: 2026-07-05*
