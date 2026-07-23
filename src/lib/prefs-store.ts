import { create } from 'zustand'
import type { AccentColor, ThemeMode, UserPreferences } from '@/types'
import { db, defaultPreferences, ensurePreferences } from '@/db'
import { nowIso } from '@/utils'

type PrefsState = {
  preferences: UserPreferences
  loaded: boolean
  load: () => Promise<void>
  update: (patch: Partial<UserPreferences>) => Promise<void>
  applyTheme: () => void
}

function resolveTheme(theme: ThemeMode): 'dark' | 'light' {
  if (theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return theme
}

export const usePrefsStore = create<PrefsState>((set, get) => ({
  preferences: defaultPreferences(),
  loaded: false,
  load: async () => {
    const preferences = await ensurePreferences()
    set({ preferences, loaded: true })
    get().applyTheme()
  },
  update: async (patch) => {
    const next = {
      ...get().preferences,
      ...patch,
      updatedAt: nowIso(),
    }
    await db.preferences.put(next)
    set({ preferences: next })
    get().applyTheme()
  },
  applyTheme: () => {
    const { theme, accent, density, fontSize, reducedMotion } = get().preferences
    const resolved = resolveTheme(theme)
    document.documentElement.dataset.theme = resolved
    document.documentElement.dataset.accent = accent
    document.documentElement.dataset.density = density
    document.documentElement.dataset.fontSize = fontSize
    document.documentElement.dataset.reducedMotion = reducedMotion ? 'true' : 'false'
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) meta.setAttribute('content', resolved === 'dark' ? '#0a0c10' : '#f4f6f8')
  },
}))

export function setAccent(accent: AccentColor): void {
  void usePrefsStore.getState().update({ accent })
}
