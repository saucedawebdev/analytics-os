import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Button } from '@/components/ui/Button'
import { Field, Input, Select, Textarea } from '@/components/ui/Field'
import { ConfirmDialog } from '@/components/ui/Modal'
import { Badge, EmptyState, PageHeader, Panel } from '@/components/ui/Panel'
import { db } from '@/db'
import { useUiStore } from '@/lib/ui-store'
import type { Note, NoteType } from '@/types'
import { createId, downloadText, formatDate, nowIso, statusLabel, touchUpdated } from '@/utils'
import {
  createNote,
  joinCsv,
  NOTE_TYPES,
  noteTemplateContent,
  noteTemplateTitle,
  runSave,
  splitCsv,
} from '@/pages/pageUtils'
import { linkRecords, logActivity, trackRecent } from '@/services/data-service'

export default function NoteDetailPage() {
  const { id = 'new' } = useParams()
  const navigate = useNavigate()
  const setSaveStatus = useUiStore((s) => s.setSaveStatus)
  const [note, setNote] = useState<Note>(() => createNote())
  const [missing, setMissing] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const isNew = id === 'new'

  const load = useCallback(async () => {
    if (isNew) {
      setNote(createNote())
      setMissing(false)
      return
    }
    const row = await db.notes.get(id)
    if (!row) {
      setMissing(true)
      return
    }
    setNote(row)
    setMissing(false)
    await trackRecent('note', row.id, row.title)
  }, [id, isNew])

  useEffect(() => {
    void load()
  }, [load])

  function patchNote(patch: Partial<Note>) {
    setNote((current) => ({ ...current, ...patch }))
  }

  function changeType(type: NoteType) {
    setNote((current) => ({
      ...current,
      type,
      title: isNew || current.title.startsWith('Untitled') || current.title.endsWith('note') ? noteTemplateTitle(type) : current.title,
      content: current.content.trim() ? current.content : noteTemplateContent(type),
    }))
  }

  async function saveNote() {
    await runSave(setSaveStatus, async () => {
      const next = isNew ? note : touchUpdated(note)
      await db.notes.put(next)
      if (next.relatedProjectId) {
        await linkRecords({ type: 'note', id: next.id }, { type: 'project', id: next.relatedProjectId }, 'related_project')
      }
      if (next.relatedDatasetId) {
        await linkRecords({ type: 'note', id: next.id }, { type: 'dataset', id: next.relatedDatasetId }, 'related_dataset')
      }
      if (next.relatedQueryId) {
        await linkRecords({ type: 'note', id: next.id }, { type: 'sql_query', id: next.relatedQueryId }, 'related_query')
      }
      await logActivity(isNew ? 'note.created' : 'note.saved', `Saved note: ${next.title}`, {
        type: 'note',
        id: next.id,
      })
      await trackRecent('note', next.id, next.title)
      if (isNew) navigate(`/notes/${next.id}`, { replace: true })
      else setNote(next)
    })
  }

  async function duplicateNote() {
    await runSave(setSaveStatus, async () => {
      const now = nowIso()
      const copy: Note = {
        ...note,
        id: createId(),
        title: `${note.title} (copy)`,
        isBuiltIn: false,
        createdAt: now,
        updatedAt: now,
        recordVersion: 1,
        checklist: note.checklist?.map((item) => ({ ...item, id: createId() })) ?? [],
      }
      await db.notes.add(copy)
      await logActivity('note.duplicated', `Duplicated note: ${note.title}`, { type: 'note', id: copy.id })
      await trackRecent('note', copy.id, copy.title)
      navigate(`/notes/${copy.id}`)
    })
  }

  async function deleteNote() {
    await runSave(setSaveStatus, async () => {
      await db.notes.delete(note.id)
      await logActivity('note.deleted', `Deleted note: ${note.title}`)
      navigate('/notes')
    })
  }

  if (missing) {
    return (
      <div className="page">
        <PageHeader title="Note not found" actions={<Link to="/notes">Back to notes</Link>} />
        <EmptyState title="Missing note" description="This note was deleted or is unavailable." />
      </div>
    )
  }

  return (
    <div className="page">
      <PageHeader
        title={isNew ? 'New note' : note.title}
        subtitle={isNew ? 'Create a markdown notebook entry.' : `Updated ${formatDate(note.updatedAt)}`}
        breadcrumbs={<Breadcrumbs items={[{ label: 'Notebook', to: '/notes' }, { label: isNew ? 'New' : note.title }]} />}
        actions={
          <div className="row-wrap">
            <Button variant="ghost" onClick={() => patchNote({ favorite: !note.favorite })}>
              {note.favorite ? 'Unfavorite' : 'Favorite'}
            </Button>
            <Button variant="ghost" onClick={() => downloadText(`${note.title || 'note'}.md`, note.content, 'text/markdown')}>
              Download Markdown
            </Button>
            {!isNew ? <Button onClick={() => void duplicateNote()}>Duplicate</Button> : null}
            {!isNew ? (
              <Button variant="danger" onClick={() => setDeleteOpen(true)}>
                Delete
              </Button>
            ) : null}
            <Button variant="primary" onClick={() => void saveNote()}>
              Save note
            </Button>
          </div>
        }
      />

      <div className="grid-2">
        <Panel title="Metadata">
          <Field label="Title" htmlFor="title">
            <Input id="title" value={note.title} onChange={(event) => patchNote({ title: event.target.value })} />
          </Field>
          <Field label="Type" htmlFor="type">
            <Select id="type" value={note.type} onChange={(event) => changeType(event.target.value as NoteType)}>
              {NOTE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {statusLabel(type)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Source" htmlFor="source">
            <Input id="source" value={note.source ?? ''} onChange={(event) => patchNote({ source: event.target.value })} />
          </Field>
          <Field label="Tags" htmlFor="tags">
            <Input id="tags" value={joinCsv(note.tags)} onChange={(event) => patchNote({ tags: splitCsv(event.target.value) })} />
          </Field>
          <Field label="Related project ID" htmlFor="relatedProjectId">
            <Input id="relatedProjectId" value={note.relatedProjectId ?? ''} onChange={(event) => patchNote({ relatedProjectId: event.target.value || null })} />
          </Field>
          <Field label="Related dataset ID" htmlFor="relatedDatasetId">
            <Input id="relatedDatasetId" value={note.relatedDatasetId ?? ''} onChange={(event) => patchNote({ relatedDatasetId: event.target.value || null })} />
          </Field>
          <Field label="Related query ID" htmlFor="relatedQueryId">
            <Input id="relatedQueryId" value={note.relatedQueryId ?? ''} onChange={(event) => patchNote({ relatedQueryId: event.target.value || null })} />
          </Field>
          <Field label="Related KPI ID" htmlFor="relatedKpiId">
            <Input id="relatedKpiId" value={note.relatedKpiId ?? ''} onChange={(event) => patchNote({ relatedKpiId: event.target.value || null })} />
          </Field>
          <Field label="Related skill" htmlFor="relatedSkill">
            <Input id="relatedSkill" value={note.relatedSkill ?? ''} onChange={(event) => patchNote({ relatedSkill: event.target.value || null })} />
          </Field>
          <Field label="Related built-in knowledge ID" htmlFor="relatedBuiltinId">
            <Input id="relatedBuiltinId" value={note.relatedBuiltinId ?? ''} onChange={(event) => patchNote({ relatedBuiltinId: event.target.value || null })} />
          </Field>
          <label className="row">
            <input type="checkbox" checked={Boolean(note.pinned)} onChange={(event) => patchNote({ pinned: event.target.checked })} />
            Pinned
          </label>
        </Panel>

        <Panel title="Preview">
          <div style={{ whiteSpace: 'pre-wrap' }}>{note.content || 'Nothing to preview yet.'}</div>
        </Panel>
      </div>

      <Panel title="Markdown">
        <Field label="Content" htmlFor="content">
          <Textarea id="content" value={note.content} onChange={(event) => patchNote({ content: event.target.value })} rows={18} />
        </Field>
      </Panel>

      <div className="row-wrap">
        <Badge>{statusLabel(note.type)}</Badge>
        {note.favorite ? <Badge tone="accent">Favorite</Badge> : null}
        {note.pinned ? <Badge>Pinned</Badge> : null}
      </div>

      <ConfirmDialog
        open={deleteOpen}
        title="Delete note?"
        message="This removes the note from your local notebook."
        confirmLabel="Delete"
        danger
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => void deleteNote()}
      />
    </div>
  )
}
