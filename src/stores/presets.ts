/**
 * Built-in Layout Presets
 *
 * Default, Focus, and Wide layout configurations.
 * All presets use consistent panel IDs: 'explorer', 'content', 'details', 'terminal'.
 */

import type { LayoutPreset } from '../types/grid';

/** Default four-panel IDE layout */
export const DEFAULT_PRESET: LayoutPreset = {
  id: 'default',
  name: '默认布局',
  description: '标准四面板 IDE 布局',
  builtin: true,
  gridConfig: {
    columns: [
      { size: 260, min: 200, max: 400, unit: 'px' },
      { size: 1, min: 0.3, max: 0.7, unit: 'fr' },
      { size: 320, min: 240, max: 480, unit: 'px' },
    ],
    rows: [
      { size: 1, min: 0.5, max: 0.8, unit: 'fr' },
      { size: 240, min: 120, max: 480, unit: 'px' },
    ],
    areas: [
      { panelId: 'explorer', columnStart: 1, columnEnd: 2, rowStart: 1, rowEnd: 2 },
      { panelId: 'content', columnStart: 2, columnEnd: 3, rowStart: 1, rowEnd: 2 },
      { panelId: 'details', columnStart: 3, columnEnd: 4, rowStart: 1, rowEnd: 2 },
      { panelId: 'terminal', columnStart: 1, columnEnd: 4, rowStart: 2, rowEnd: 3 },
    ],
  },
  panelStates: {
    explorer: {
      visible: true,
      collapsed: false,
      position: { panelId: 'explorer', columnStart: 1, columnEnd: 2, rowStart: 1, rowEnd: 2 },
      size: { width: 260, height: 600 },
    },
    content: {
      visible: true,
      collapsed: false,
      position: { panelId: 'content', columnStart: 2, columnEnd: 3, rowStart: 1, rowEnd: 2 },
      size: { width: 800, height: 600 },
    },
    details: {
      visible: true,
      collapsed: false,
      position: { panelId: 'details', columnStart: 3, columnEnd: 4, rowStart: 1, rowEnd: 2 },
      size: { width: 320, height: 600 },
    },
    terminal: {
      visible: true,
      collapsed: false,
      position: { panelId: 'terminal', columnStart: 1, columnEnd: 4, rowStart: 2, rowEnd: 3 },
      size: { width: 1380, height: 240 },
    },
  },
};

/** Focus mode: chat/editor maximized, other panels collapsed */
export const FOCUS_PRESET: LayoutPreset = {
  id: 'focus',
  name: '专注模式',
  description: '聊天/编辑器最大化，其他面板折叠',
  builtin: true,
  gridConfig: {
    columns: [
      { size: 48, min: 48, max: 48, unit: 'px' },
      { size: 1, min: 0.5, max: 1, unit: 'fr' },
      { size: 0, min: 0, max: 0, unit: 'px' },
    ],
    rows: [
      { size: 1, min: 1, max: 1, unit: 'fr' },
      { size: 0, min: 0, max: 0, unit: 'px' },
    ],
    areas: [
      { panelId: 'explorer', columnStart: 1, columnEnd: 2, rowStart: 1, rowEnd: 2 },
      { panelId: 'content', columnStart: 2, columnEnd: 3, rowStart: 1, rowEnd: 2 },
    ],
  },
  panelStates: {
    explorer: {
      visible: true,
      collapsed: true,
      position: { panelId: 'explorer', columnStart: 1, columnEnd: 2, rowStart: 1, rowEnd: 2 },
      size: { width: 48, height: 600 },
    },
    content: {
      visible: true,
      collapsed: false,
      position: { panelId: 'content', columnStart: 2, columnEnd: 3, rowStart: 1, rowEnd: 2 },
      size: { width: 1200, height: 600 },
    },
    details: {
      visible: false,
      collapsed: false,
      position: { panelId: 'details', columnStart: 3, columnEnd: 4, rowStart: 1, rowEnd: 2 },
      size: { width: 0, height: 0 },
    },
    terminal: {
      visible: false,
      collapsed: false,
      position: { panelId: 'terminal', columnStart: 1, columnEnd: 4, rowStart: 2, rowEnd: 3 },
      size: { width: 0, height: 0 },
    },
  },
};

/** Wide mode: content and details side by side (3-column with explorer) */
export const WIDE_PRESET: LayoutPreset = {
  id: 'wide',
  name: '宽屏模式',
  description: '内容和详情左右并排，终端底部',
  builtin: true,
  gridConfig: {
    columns: [
      { size: 260, min: 200, max: 400, unit: 'px' },
      { size: 1, min: 0.3, max: 0.7, unit: 'fr' },
      { size: 1, min: 0.3, max: 0.7, unit: 'fr' },
    ],
    rows: [
      { size: 1, min: 0.5, max: 0.8, unit: 'fr' },
      { size: 240, min: 120, max: 480, unit: 'px' },
    ],
    areas: [
      { panelId: 'explorer', columnStart: 1, columnEnd: 2, rowStart: 1, rowEnd: 2 },
      { panelId: 'content', columnStart: 2, columnEnd: 3, rowStart: 1, rowEnd: 2 },
      { panelId: 'details', columnStart: 3, columnEnd: 4, rowStart: 1, rowEnd: 2 },
      { panelId: 'terminal', columnStart: 1, columnEnd: 4, rowStart: 2, rowEnd: 3 },
    ],
  },
  panelStates: {
    explorer: {
      visible: true,
      collapsed: false,
      position: { panelId: 'explorer', columnStart: 1, columnEnd: 2, rowStart: 1, rowEnd: 2 },
      size: { width: 260, height: 600 },
    },
    content: {
      visible: true,
      collapsed: false,
      position: { panelId: 'content', columnStart: 2, columnEnd: 3, rowStart: 1, rowEnd: 2 },
      size: { width: 560, height: 600 },
    },
    details: {
      visible: true,
      collapsed: false,
      position: { panelId: 'details', columnStart: 3, columnEnd: 4, rowStart: 1, rowEnd: 2 },
      size: { width: 560, height: 600 },
    },
    terminal: {
      visible: true,
      collapsed: false,
      position: { panelId: 'terminal', columnStart: 1, columnEnd: 4, rowStart: 2, rowEnd: 3 },
      size: { width: 1380, height: 240 },
    },
  },
};

/** All built-in presets */
export const BUILTIN_PRESETS: LayoutPreset[] = [DEFAULT_PRESET, FOCUS_PRESET, WIDE_PRESET];
