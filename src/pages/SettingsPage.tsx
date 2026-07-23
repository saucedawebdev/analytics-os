import { useRef, useState } from 'react'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Button } from '@/components/ui/Button'
import { Field, Input, Select } from '@/components/ui/Field'
import { Badge, PageHeader, Panel } from '@/components/ui/Panel'
import { ConfirmDialog } from '@/components/ui/Modal'
import { resetBuiltInContent, removeDemoData, restoreDemoData } from '@/services/bootstrap'
import {
  buildBackup,
  clearPersonalData,
  restoreBackup,
  validateBackup,
} from '@/services/data-service'
import { usePrefsStore } from '@/lib/prefs-store'
import type {
  AccentColor,
  AnalystOSBackup,
  Density,
  FontSize,
  SqlDialect,
  ThemeMode,
} from '@/types'
import { downloadJson, nowIso } from '@/utils'

type ConfirmAction = 'import-replace' | 'import-merge' | 'clear' | 'reset-built-in' | 'restore-demo' | 'remove-demo'

export default function SettingsPage() {
  const prefs = usePrefsStore((state) => state.preferences)
  const updatePrefs = usePrefsStore((state) => state.update)
  const loadPrefs = usePrefsStore((state) => state.load)
  const fileRef = useRef<HTMLInputElement | null>(null)
  const [pendingBackup, setPendingBackup] = useState<AnalystOSBackup | null>(null)
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null)
  const [message, setMessage] = useState('')

  async function exportBackup() {
    const backup = await buildBackup()
    downloadJson(`analystos-backup-${nowIso().slice(0, 10)}.json`, backup)
    await updatePrefs({ lastBackupAt: nowIso() })
    setMessage('Backup exported')
  }

  async function readImport(file: File | undefined) {
    if (!file) return
    const text = await file.text()
    const parsed = JSON.parse(text) as unknown
    if (!validateBackup(parsed)) {
      setMessage('Backup file is not valid')
      return
    }
    setPendingBackup(parsed)
    setMessage('Backup loaded. Choose replace or merge.')
  }

  async function runConfirmed() {
    if (confirmAction === 'import-replace' && pendingBackup) {
      await restoreBackup(pendingBackup, 'replace')
      await loadPrefs()
      setMessage('Backup restored with replace mode')
    } else if (confirmAction === 'import-merge' && pendingBackup) {
      await restoreBackup(pendingBackup, 'merge')
      await loadPrefs()
      setMessage('Backup restored with merge mode')
    } else if (confirmAction === 'clear') {
      await clearPersonalData(true)
      setMessage('Personal data cleared')
    } else if (confirmAction === 'reset-built-in') {
      await resetBuiltInContent()
      setMessage('Built-in content reset')
    } else if (confirmAction === 'restore-demo') {
      await restoreDemoData()
      await loadPrefs()
      setMessage('Demo data restored')
    } else if (confirmAction === 'remove-demo') {
      await removeDemoData()
      await updatePrefs({ demoDataInstalled: false })
      setMessage('Demo data removed')
    }
  }

  return (
    <div className="page stack">
      <PageHeader
        title="Settings"
        subtitle="Preferences, backup, restore, privacy, PWA guidance, shortcuts, and app information."
        breadcrumbs={<Breadcrumbs items={[{ label: 'Settings' }]} />}
        actions={message ? <Badge tone="success">{message}</Badge> : null}
      />

      <Panel title="Profile and appearance">
        <div className="grid-3">
          <Field label="Display name">
            <Input value={prefs.displayName} onChange={(e) => void updatePrefs({ displayName: e.target.value })} />
          </Field>
          <Field label="Theme">
            <Select value={prefs.theme} onChange={(e) => void updatePrefs({ theme: e.target.value as ThemeMode })}>
              <option value="dark">Dark</option>
              <option value="light">Light</option>
              <option value="system">System</option>
            </Select>
          </Field>
          <Field label="Accent">
            <Select value={prefs.accent} onChange={(e) => void updatePrefs({ accent: e.target.value as AccentColor })}>
              <option value="cyan">Cyan</option>
              <option value="blue">Blue</option>
              <option value="teal">Teal</option>
              <option value="indigo">Indigo</option>
            </Select>
          </Field>
          <Field label="Density">
            <Select value={prefs.density} onChange={(e) => void updatePrefs({ density: e.target.value as Density })}>
              <option value="comfortable">Comfortable</option>
              <option value="compact">Compact</option>
            </Select>
          </Field>
          <Field label="Font size">
            <Select value={prefs.fontSize} onChange={(e) => void updatePrefs({ fontSize: e.target.value as FontSize })}>
              <option value="sm">Small</option>
              <option value="md">Medium</option>
              <option value="lg">Large</option>
            </Select>
          </Field>
          <Field label="Reduced motion">
            <Select
              value={prefs.reducedMotion ? 'true' : 'false'}
              onChange={(e) => void updatePrefs({ reducedMotion: e.target.value === 'true' })}
            >
              <option value="false">Off</option>
              <option value="true">On</option>
            </Select>
          </Field>
        </div>
      </Panel>

      <Panel title="Defaults">
        <div className="grid-3">
          <Field label="Landing page">
            <Input
              value={prefs.defaultLandingPage}
              onChange={(e) => void updatePrefs({ defaultLandingPage: e.target.value })}
            />
          </Field>
          <Field label="Date format">
            <Select value={prefs.dateFormat} onChange={(e) => void updatePrefs({ dateFormat: e.target.value })}>
              <option value="MMM d, yyyy">MMM d, yyyy</option>
              <option value="yyyy-MM-dd">yyyy-MM-dd</option>
              <option value="locale">Locale</option>
            </Select>
          </Field>
          <Field label="SQL dialect">
            <Select
              value={prefs.sqlDialect}
              onChange={(e) => void updatePrefs({ sqlDialect: e.target.value as SqlDialect })}
            >
              <option value="ansi">ANSI</option>
              <option value="postgresql">PostgreSQL</option>
              <option value="mysql">MySQL</option>
              <option value="sqlite">SQLite</option>
              <option value="sqlserver">SQL Server</option>
              <option value="bigquery">BigQuery</option>
              <option value="snowflake">Snowflake</option>
            </Select>
          </Field>
          <Field label="Backup reminder days">
            <Input
              type="number"
              min="1"
              value={prefs.backupReminderDays}
              onChange={(e) => void updatePrefs({ backupReminderDays: Number(e.target.value) })}
            />
          </Field>
        </div>
      </Panel>

      <Panel title="Backup and restore">
        <div className="row-wrap">
          <Button variant="primary" onClick={() => void exportBackup()}>
            Export backup
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            style={{ display: 'none' }}
            onChange={(e) => void readImport(e.target.files?.[0])}
          />
          <Button onClick={() => fileRef.current?.click()}>Choose import file</Button>
          <Button disabled={!pendingBackup} onClick={() => setConfirmAction('import-replace')}>
            Restore replace
          </Button>
          <Button disabled={!pendingBackup} onClick={() => setConfirmAction('import-merge')}>
            Restore merge
          </Button>
        </div>
        {pendingBackup ? (
          <p className="list-item-meta">
            Loaded backup exported {pendingBackup.manifest.exportedAt} with{' '}
            {Object.values(pendingBackup.manifest.recordCounts).reduce((sum, count) => sum + count, 0)} records.
          </p>
        ) : null}
      </Panel>

      <Panel title="Data management">
        <div className="row-wrap">
          <Button variant="danger" onClick={() => setConfirmAction('clear')}>
            Clear personal data
          </Button>
          <Button onClick={() => setConfirmAction('reset-built-in')}>Reset built-in content</Button>
          <Button onClick={() => setConfirmAction('restore-demo')}>Restore demo data</Button>
          <Button onClick={() => setConfirmAction('remove-demo')}>Remove demo data</Button>
        </div>
      </Panel>

      <div className="grid-2">
        <Panel title="PWA install guidance">
          <p>
            AnalystOS can be installed from your browser when the install icon appears in the address bar or browser
            menu. On mobile, use the share menu and choose Add to Home Screen.
          </p>
          <p className="list-item-meta">Your workspace is local-first and private to this browser profile.</p>
        </Panel>

        <Panel title="Keyboard shortcuts">
          <div className="list">
            <div className="list-item">
              <strong>Command palette</strong>
              <Badge>Cmd/Ctrl + K</Badge>
            </div>
            <div className="list-item">
              <strong>Quick capture</strong>
              <Badge>Top bar Capture</Badge>
            </div>
            <div className="list-item">
              <strong>Save text fields</strong>
              <Badge>Use page Save buttons</Badge>
            </div>
          </div>
        </Panel>
      </div>

      <Panel title="About AnalystOS">
        <p>
          AnalystOS is a local-first, private analytics operating system for notes, SQL, datasets, projects, formulas,
          KPIs, dashboards, portfolio work, interviews, and career tracking.
        </p>
        <p className="list-item-meta">Schema version {prefs.schemaVersion} · Last backup {prefs.lastBackupAt ?? 'never'}</p>
      </Panel>

      <ConfirmDialog
        open={Boolean(confirmAction)}
        title="Confirm settings action"
        message={confirmMessage(confirmAction)}
        confirmLabel="Confirm"
        danger={confirmAction === 'clear'}
        onConfirm={() => void runConfirmed()}
        onClose={() => setConfirmAction(null)}
      />
    </div>
  )
}

function confirmMessage(action: ConfirmAction | null): string {
  if (action === 'import-replace') return 'Replace existing personal data with the selected backup?'
  if (action === 'import-merge') return 'Merge the selected backup into existing data?'
  if (action === 'clear') return 'Clear all personal data? Export a backup first if you need one.'
  if (action === 'reset-built-in') return 'Reset built-in formulas, KPIs, notes, and interview questions?'
  if (action === 'restore-demo') return 'Restore demo data? Existing demo data will be replaced.'
  if (action === 'remove-demo') return 'Remove demo records from this workspace?'
  return 'Continue?'
}
