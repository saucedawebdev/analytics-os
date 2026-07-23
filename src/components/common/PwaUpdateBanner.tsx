import { useUiStore } from '@/lib/ui-store'
import { Button } from '@/components/ui/Button'

export function PwaUpdateBanner() {
  const ready = useUiStore((s) => s.pwaUpdateReady)
  const setReady = useUiStore((s) => s.setPwaUpdateReady)

  if (!ready) return null

  return (
    <div
      role="status"
      style={{
        position: 'fixed',
        left: 12,
        right: 12,
        bottom: 84,
        zIndex: 70,
        display: 'flex',
        gap: 12,
        alignItems: 'center',
        padding: '12px 14px',
        borderRadius: 14,
        border: '1px solid var(--border-subtle)',
        background: 'var(--bg-panel)',
        boxShadow: 'var(--shadow-md)',
      }}
    >
      <div className="spacer">
        <strong>Update ready</strong>
        <div className="list-item-meta" style={{ margin: 0 }}>
          A new AnalystOS version is available. Reload to apply. Your local data stays on this device.
        </div>
      </div>
      <Button variant="ghost" size="sm" onClick={() => setReady(false)}>
        Later
      </Button>
      <Button variant="primary" size="sm" onClick={() => window.location.reload()}>
        Reload
      </Button>
    </div>
  )
}
