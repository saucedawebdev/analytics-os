import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Field'
import { useUiStore } from '@/lib/ui-store'
import { usePrefsStore } from '@/lib/prefs-store'
import {
  globalSearch,
  groupHits,
  searchCommands,
  type SearchHit,
} from '@/services/search-service'
import { buildBackup } from '@/services/data-service'
import { downloadJson, debounce } from '@/utils'
import { nowIso } from '@/utils'

const TYPE_LABELS: Record<string, string> = {
  command: 'Commands',
  builtin_knowledge: 'Knowledge',
  formula: 'Formulas',
  kpi: 'KPIs',
  note: 'Notes',
  sql_query: 'SQL',
  project: 'Projects',
  dataset: 'Datasets',
  dashboard_plan: 'Dashboards',
  portfolio_case_study: 'Portfolio',
  interview_question: 'Interview',
  thinking_session: 'Thinking',
  job_application: 'Career',
  quick_capture: 'Captures',
  personal_knowledge: 'Personal knowledge',
}

export function CommandPalette() {
  const open = useUiStore((s) => s.commandOpen)
  const setOpen = useUiStore((s) => s.setCommandOpen)
  const setCaptureOpen = useUiStore((s) => s.setCaptureOpen)
  const prefs = usePrefsStore((s) => s.preferences)
  const updatePrefs = usePrefsStore((s) => s.update)
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [hits, setHits] = useState<SearchHit[]>([])
  const [active, setActive] = useState(0)

  const commands = useMemo(() => searchCommands(query), [query])

  useEffect(() => {
    const run = debounce((q: string) => {
      void globalSearch(q).then(setHits)
    }, 120)
    run(query)
  }, [query])

  useEffect(() => {
    setActive(0)
  }, [query, open])

  const flat = useMemo(() => {
    const items: Array<{ kind: 'command' | 'hit'; id: string; title: string; subtitle?: string; run: () => void }> =
      []
    for (const c of commands) {
      items.push({
        kind: 'command',
        id: c.id,
        title: c.title,
        subtitle: 'Command',
        run: () => {
          if (c.path) navigate(c.path)
          if (c.action === 'capture') setCaptureOpen(true)
          if (c.action === 'settings') navigate('/settings')
          if (c.action === 'theme') {
            const next = prefs.theme === 'dark' ? 'light' : 'dark'
            void updatePrefs({ theme: next })
          }
          if (c.action === 'export') {
            void buildBackup().then((b) => {
              downloadJson(`analystos-backup-${nowIso().slice(0, 10)}.json`, b)
            })
          }
          setOpen(false)
          setQuery('')
        },
      })
    }
    for (const h of hits) {
      items.push({
        kind: 'hit',
        id: `${h.type}-${h.id}`,
        title: h.title,
        subtitle: h.subtitle,
        run: () => {
          navigate(h.path)
          setOpen(false)
          setQuery('')
        },
      })
    }
    return items
  }, [commands, hits, navigate, prefs.theme, setCaptureOpen, setOpen, updatePrefs])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActive((a) => Math.min(a + 1, Math.max(flat.length - 1, 0)))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActive((a) => Math.max(a - 1, 0))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        flat[active]?.run()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, flat, active])

  const groupedHits = groupHits(hits)

  return (
    <Modal open={open} onClose={() => setOpen(false)} title="Search & commands" wide>
      <Input
        autoFocus
        placeholder="Search knowledge, projects, SQL, notes… or run a command"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Global search"
      />
      <div className="command-results" style={{ marginTop: 12, maxHeight: '55dvh' }}>
        {commands.length > 0 && (
          <>
            <div className="command-group-title">Commands</div>
            {commands.map((c) => {
              const idx = flat.findIndex((f) => f.id === c.id)
              return (
                <button
                  key={c.id}
                  type="button"
                  className="command-item"
                  data-active={idx === active}
                  onMouseEnter={() => setActive(idx)}
                  onClick={() => flat[idx]?.run()}
                >
                  <span>{c.title}</span>
                  <span className="badge">Command</span>
                </button>
              )
            })}
          </>
        )}
        {Object.entries(groupedHits).map(([type, group]) => (
          <div key={type}>
            <div className="command-group-title">{TYPE_LABELS[type] ?? type}</div>
            {group.map((h) => {
              const id = `${h.type}-${h.id}`
              const idx = flat.findIndex((f) => f.id === id)
              return (
                <button
                  key={id}
                  type="button"
                  className="command-item"
                  data-active={idx === active}
                  onMouseEnter={() => setActive(idx)}
                  onClick={() => flat[idx]?.run()}
                >
                  <span>
                    <strong>{h.title}</strong>
                    {h.subtitle ? (
                      <div className="list-item-meta" style={{ margin: 0 }}>
                        {h.subtitle}
                      </div>
                    ) : null}
                  </span>
                  {h.favorite ? <span className="badge badge-accent">Favorite</span> : null}
                </button>
              )
            })}
          </div>
        ))}
        {flat.length === 0 ? (
          <div className="empty-state">
            <h3>No matches</h3>
            <p>Try a topic, project name, or command like “export backup”.</p>
          </div>
        ) : null}
      </div>
    </Modal>
  )
}
