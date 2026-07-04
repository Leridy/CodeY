/**
 * CodeY Application Store
 *
 * Central Zustand store managing layout, chat, editor, and theme state.
 * Uses devtools and persist middleware.
 */

import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

import type { LayoutMode, ContentMode } from '../types/layout'
import type { Message, OpenFile } from '../types/message'

// --- Theme definitions (imported from types or inline) ---

const darkTheme = {
  background: '#1a1a2e',
  surface: '#16213e',
  primary: '#0f3460',
  accent: '#e94560',
  text: { primary: '#e0e0e0', secondary: '#9e9e9e', disabled: '#616161', inverse: '#1a1a2e' },
  border: { default: '#2a2a4a', hover: '#3a3a5a', focus: '#e94560' },
  status: { success: '#4caf50', warning: '#ff9800', error: '#f44336', info: '#2196f3' },
  tool: { bash: '#4caf50', edit: '#2196f3', git: '#ff9800', file: '#9c27b0', search: '#00bcd4' },
}

const lightTheme = {
  background: '#f5f5f5',
  surface: '#ffffff',
  primary: '#1976d2',
  accent: '#e91e63',
  text: { primary: '#212121', secondary: '#757575', disabled: '#bdbdbd', inverse: '#ffffff' },
  border: { default: '#e0e0e0', hover: '#bdbdbd', focus: '#e91e63' },
  status: { success: '#388e3c', warning: '#f57c00', error: '#d32f2f', info: '#1976d2' },
  tool: { bash: '#388e3c', edit: '#1976d2', git: '#f57c00', file: '#7b1fa2', search: '#0097a7' },
}

type ThemeDefinition = typeof darkTheme

// --- Store interface ---

export interface AppStore {
  // --- Layout ---
  layout: {
    mode: LayoutMode
    contentMode: ContentMode
    splitRatio: number
    explorerCollapsed: boolean
    detailsVisible: boolean
    terminalCollapsed: boolean
  }

  // --- Chat ---
  chat: {
    messages: Message[]
    isStreaming: boolean
    streamingContent: string
  }

  // --- Editor ---
  editor: {
    openFiles: OpenFile[]
    activeFilePath: string | null
  }

  // --- Theme ---
  theme: {
    mode: 'dark' | 'light'
    current: ThemeDefinition
  }

  // --- Actions ---
  setContentMode: (mode: ContentMode) => void
  toggleExplorer: () => void
  toggleTerminal: () => void
  sendMessage: (content: string) => void
  approveToolCall: (id: string) => void
  rejectToolCall: (id: string) => void
  toggleTheme: () => void
}

// --- Store creation ---

export const useAppStore = create<AppStore>()(
  devtools(
    persist(
      (set) => ({
        layout: {
          mode: 'desktop',
          contentMode: 'chat',
          splitRatio: 0.5,
          explorerCollapsed: false,
          detailsVisible: true,
          terminalCollapsed: true,
        },
        chat: {
          messages: [],
          isStreaming: false,
          streamingContent: '',
        },
        editor: {
          openFiles: [],
          activeFilePath: null,
        },
        theme: {
          mode: 'dark',
          current: darkTheme,
        },

        setContentMode: (mode) =>
          set((state) => ({
            layout: { ...state.layout, contentMode: mode },
          })),

        toggleExplorer: () =>
          set((state) => ({
            layout: {
              ...state.layout,
              explorerCollapsed: !state.layout.explorerCollapsed,
            },
          })),

        toggleTerminal: () =>
          set((state) => ({
            layout: {
              ...state.layout,
              terminalCollapsed: !state.layout.terminalCollapsed,
            },
          })),

        sendMessage: (content) =>
          set((state) => ({
            chat: {
              ...state.chat,
              messages: [
                ...state.chat.messages,
                {
                  id: crypto.randomUUID(),
                  role: 'user',
                  content,
                  timestamp: Date.now(),
                },
              ],
            },
          })),

        approveToolCall: (id) =>
          set((state) => ({
            chat: {
              ...state.chat,
              messages: state.chat.messages.map((msg) => ({
                ...msg,
                toolCalls: msg.toolCalls?.map((tc) =>
                  tc.id === id ? { ...tc, status: 'running' as const } : tc
                ),
              })),
            },
          })),

        rejectToolCall: (id) =>
          set((state) => ({
            chat: {
              ...state.chat,
              messages: state.chat.messages.map((msg) => ({
                ...msg,
                toolCalls: msg.toolCalls?.map((tc) =>
                  tc.id === id ? { ...tc, status: 'failed' as const } : tc
                ),
              })),
            },
          })),

        toggleTheme: () =>
          set((state) => ({
            theme: {
              mode: state.theme.mode === 'dark' ? 'light' : 'dark',
              current: state.theme.mode === 'dark' ? lightTheme : darkTheme,
            },
          })),
      }),
      {
        name: 'codey-app-store',
        partialize: (state) => ({
          layout: state.layout,
          theme: { mode: state.theme.mode },
        }),
      }
    )
  )
)
