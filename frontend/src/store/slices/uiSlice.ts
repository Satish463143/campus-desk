// store/slices/uiSlice.ts

import { createSlice, PayloadAction } from '@reduxjs/toolkit'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: string
  type: ToastType
  message: string
  duration?: number  // ms, default 4000
}

interface UIState {
  sidebarOpen: boolean
  theme: 'light' | 'dark' | 'system'
  toasts: Toast[]
}

const initialState: UIState = {
  sidebarOpen: true,
  theme: 'system',
  toasts: [],
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload
    },
    setTheme: (state, action: PayloadAction<UIState['theme']>) => {
      state.theme = action.payload
    },
    addToast: (state, action: PayloadAction<Omit<Toast, 'id'>>) => {
      state.toasts.push({
        ...action.payload,
        id: Date.now().toString(),
      })
    },
    removeToast: (state, action: PayloadAction<string>) => {
      state.toasts = state.toasts.filter(t => t.id !== action.payload)
    },
    clearToasts: (state) => {
      state.toasts = []
    },
  },
})

export const {
  toggleSidebar,
  setSidebarOpen,
  setTheme,
  addToast,
  removeToast,
  clearToasts,
} = uiSlice.actions

export default uiSlice.reducer