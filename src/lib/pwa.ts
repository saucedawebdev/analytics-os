import { registerSW } from 'virtual:pwa-register'
import { useUiStore } from '@/lib/ui-store'

export function registerPwa(): void {
  try {
    registerSW({
      immediate: true,
      onNeedRefresh() {
        useUiStore.getState().setPwaUpdateReady(true)
      },
      onOfflineReady() {
        // Offline shell ready — no toast required
      },
    })
  } catch {
    // PWA registration is optional in non-secure contexts / unsupported browsers
  }
}
