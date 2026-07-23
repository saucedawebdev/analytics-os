import { useEffect, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Field, Input, Select, Textarea } from '@/components/ui/Field'
import { useUiStore } from '@/lib/ui-store'
import type { CaptureType } from '@/types'
import { db } from '@/db'
import { timestamps } from '@/utils'
import { logActivity } from '@/services/data-service'

const TYPES: { value: CaptureType; label: string }[] = [
  { value: 'note', label: 'Note' },
  { value: 'sql_query', label: 'SQL query' },
  { value: 'business_definition', label: 'Business definition' },
  { value: 'dataset_issue', label: 'Dataset issue' },
  { value: 'insight', label: 'Insight' },
  { value: 'interview_question', label: 'Interview question' },
  { value: 'task', label: 'Task' },
  { value: 'project_idea', label: 'Project idea' },
  { value: 'formula', label: 'Formula' },
  { value: 'kpi', label: 'KPI' },
]

export function QuickCaptureModal() {
  const open = useUiStore((s) => s.captureOpen)
  const initial = useUiStore((s) => s.captureInitialType)
  const setOpen = useUiStore((s) => s.setCaptureOpen)
  const [type, setType] = useState<CaptureType>('note')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [tags, setTags] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setType((initial as CaptureType) || 'note')
      setTitle('')
      setBody('')
      setTags('')
    }
  }, [open, initial])

  async function save() {
    if (!title.trim()) return
    setSaving(true)
    try {
      const id = timestamps().id
      await db.quickCaptures.add({
        ...timestamps(),
        id,
        type,
        title: title.trim(),
        body: body.trim(),
        processed: false,
        tags: tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
      })
      await logActivity('capture', `Captured ${type}: ${title.trim()}`, {
        type: 'quick_capture',
        id,
      })
      setOpen(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={() => setOpen(false)} title="Quick Capture">
      <div className="stack">
        <Field label="Type">
          <Select value={type} onChange={(e) => setType(e.target.value as CaptureType)}>
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Title">
          <Input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Capture something quickly…"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) void save()
            }}
          />
        </Field>
        <Field label="Details (optional)">
          <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Extra context" />
        </Field>
        <Field label="Tags (comma-separated)">
          <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="sql, retention" />
        </Field>
        <div className="row-wrap">
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button variant="primary" disabled={!title.trim() || saving} onClick={() => void save()}>
            {saving ? 'Saving…' : 'Save to inbox'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
