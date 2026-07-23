import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Field'
import { Badge, EmptyState, PageHeader, Panel } from '@/components/ui/Panel'
import { db } from '@/db'
import type { Note, NoteType } from '@/types'
import { formatDate, statusLabel } from '@/utils'
import { NOTE_TYPES } from '@/pages/pageUtils'
import { trackRecent } from '@/services/data-service'

type TypeFilter = NoteType | 'all'

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([])
  const [type, setType] = useState<TypeFilter>('all')
  const [search, setSearch] = useState('')
  const [favoritesOnly, setFavoritesOnly] = useState(false)

  const load = useCallback(async () => {
    setNotes(await db.notes.orderBy('updatedAt').reverse().toArray())
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return notes.filter((note) => {
      const matchesType = type === 'all' || note.type === type
      const matchesFavorite = !favoritesOnly || Boolean(note.favorite)
      const matchesSearch =
        !q || [note.title, note.content, note.source, ...(note.tags ?? [])].join(' ').toLowerCase().includes(q)
      return matchesType && matchesFavorite && matchesSearch
    })
  }, [favoritesOnly, notes, search, type])

  return (
    <div className="page">
      <PageHeader
        title="Notebook"
        subtitle="Markdown notes for definitions, insights, meetings, and project memory."
        actions={
          <Link to="/notes/new">
            <Button variant="primary">New note</Button>
          </Link>
        }
      />

      <Panel>
        <div className="row-wrap">
          <label className="field">
            <span className="label">Search</span>
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search notes" />
          </label>
          <label className="field">
            <span className="label">Type</span>
            <Select value={type} onChange={(event) => setType(event.target.value as TypeFilter)}>
              <option value="all">All note types</option>
              {NOTE_TYPES.map((value) => (
                <option key={value} value={value}>
                  {statusLabel(value)}
                </option>
              ))}
            </Select>
          </label>
          <label className="row">
            <input type="checkbox" checked={favoritesOnly} onChange={(event) => setFavoritesOnly(event.target.checked)} />
            Favorites only
          </label>
        </div>
      </Panel>

      <Panel title={`${filtered.length} note${filtered.length === 1 ? '' : 's'}`}>
        {filtered.length === 0 ? (
          <EmptyState
            title="No notes found"
            description="Create a note or adjust the filters."
            action={
              <Link to="/notes/new">
                <Button variant="primary">Create note</Button>
              </Link>
            }
          />
        ) : (
          <div className="list">
            {filtered.map((note) => (
              <Link
                key={note.id}
                className="list-item"
                to={`/notes/${note.id}`}
                onClick={() => void trackRecent('note', note.id, note.title)}
              >
                <div className="spacer">
                  <div className="row-wrap">
                    <p className="list-item-title">{note.title}</p>
                    {note.favorite ? <Badge tone="accent">Favorite</Badge> : null}
                    {note.isBuiltIn ? <Badge tone="builtin">Built-in</Badge> : null}
                  </div>
                  <p className="list-item-meta">{note.content.slice(0, 180) || 'Empty note'}</p>
                  <p className="list-item-meta">Updated {formatDate(note.updatedAt)}</p>
                </div>
                <Badge>{statusLabel(note.type)}</Badge>
              </Link>
            ))}
          </div>
        )}
      </Panel>
    </div>
  )
}
