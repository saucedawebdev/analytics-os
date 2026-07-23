import { create } from 'zustand'

type UiState = {
  commandOpen: boolean
  captureOpen: boolean
  captureInitialType?: string
  mobileNavMoreOpen: boolean
  contextPanelOpen: boolean
  sidebarCollapsed: boolean
  saveStatus: 'idle' | 'saving' | 'saved' | 'error'
  pwaUpdateReady: boolean
  setCommandOpen: (open: boolean) => void
  setCaptureOpen: (open: boolean, type?: string) => void
  setMobileNavMoreOpen: (open: boolean) => void
  setContextPanelOpen: (open: boolean) => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setSaveStatus: (status: UiState['saveStatus']) => void
  setPwaUpdateReady: (ready: boolean) => void
}

export const useUiStore = create<UiState>((set) => ({
  commandOpen: false,
  captureOpen: false,
  captureInitialType: undefined,
  mobileNavMoreOpen: false,
  contextPanelOpen: false,
  sidebarCollapsed: false,
  saveStatus: 'idle',
  pwaUpdateReady: false,
  setCommandOpen: (open) => set({ commandOpen: open }),
  setCaptureOpen: (open, type) => set({ captureOpen: open, captureInitialType: type }),
  setMobileNavMoreOpen: (open) => set({ mobileNavMoreOpen: open }),
  setContextPanelOpen: (open) => set({ contextPanelOpen: open }),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  setSaveStatus: (saveStatus) => set({ saveStatus }),
  setPwaUpdateReady: (pwaUpdateReady) => set({ pwaUpdateReady }),
}))
