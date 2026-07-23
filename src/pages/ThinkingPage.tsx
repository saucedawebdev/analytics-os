import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Field'
import { Badge, EmptyState, PageHeader, Panel } from '@/components/ui/Panel'
import { db } from '@/db'
import type { ThinkingSession } from '@/types'
import { formatDate, statusLabel } from '@/utils'
import { trackRecent } from '@/services/data-service'

type CompletionFilter = 'all' | 'open' | 'completed'

export default function ThinkingPage() {
  const [sessions, setSessions] = useState<ThinkingSession[]>([])
  const [filter, setFilter] = useState<CompletionFilter>('all')
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    setSessions(await db.thinkingSessions.orderBy('updatedAt').reverse().toArray())
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return sessions.filter((session) => {
      const matchesFilter =
        filter === 'all' || (filter === 'completed' ? session.completed : !session.completed)
      const matchesSearch =
        !q ||
        [
          session.title,
          session.answers.requested,
          session.answers.primaryQuestion,
          session.answers.recommendation,
          ...(session.tags ?? []),
        ]
          .join(' ')
          .toLowerCase()
          .includes(q)
      return matchesFilter && matchesSearch
    })
  }, [filter, search, sessions])

  return (
    <div className="page">
      <PageHeader
        title="Thinking Mode"
        subtitle="Structured question-first planning for analytics work."
        actions={
          <Link to="/thinking/new">
            <Button variant="primary">New session</Button>
          </Link>
        }
      />

      <Panel>
        <div className="row-wrap">
          <label className="field">
            <span className="label">Search</span>
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search sessions" />
          </label>
          <label className="field">
            <span className="label">Status</span>
            <Select value={filter} onChange={(event) => setFilter(event.target.value as CompletionFilter)}>
              <option value="all">All sessions</option>
              <option value="open">Open</option>
              <option value="completed">Completed</option>
            </Select>
          </label>
        </div>
      </Panel>

      <Panel title={`${filtered.length} session${filtered.length === 1 ? '' : 's'}`}>
        {filtered.length === 0 ? (
          <EmptyState
            title="No thinking sessions"
            description="Start a session to build an analysis plan from your own answers."
            action={
              <Link to="/thinking/new">
                <Button variant="primary">Start Thinking Mode</Button>
              </Link>
            }
          />
        ) : (
          <div className="list">
            {filtered.map((session) => (
              <Link
                key={session.id}
                className="list-item"
                to={`/thinking/${session.id}`}
                onClick={() => void trackRecent('thinking_session', session.id, session.title)}
              >
                <div className="spacer">
                  <p className="list-item-title">{session.title}</p>
                  <p className="list-item-meta">
                    {session.answers.primaryQuestion || session.answers.requested || 'No question yet'}
                  </p>
                  <p className="list-item-meta">Updated {formatDate(session.updatedAt)}</p>
                </div>
                <div className="row-wrap">
                  <Badge tone={session.completed ? 'success' : 'warning'}>
                    {session.completed ? 'Completed' : 'Open'}
                  </Badge>
                  <Badge>{statusLabel(`step ${Math.min(session.currentStep + 1, 8)} of 8`)}</Badge>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Panel>
    </div>
  )
}
