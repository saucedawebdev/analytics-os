import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Field, Input } from '@/components/ui/Field'
import { Badge, EmptyState, PageHeader, Panel } from '@/components/ui/Panel'
import { db } from '@/db'
import { useUiStore } from '@/lib/ui-store'
import type { ActivityRecord, FocusItem, Project, RecentItem, SkillRecord } from '@/types'
import {
  confidenceLabel,
  formatDate,
  greetingForHour,
  nowIso,
  statusLabel,
  touchUpdated,
} from '@/utils'
import { createFocusItem, runSave } from '@/pages/pageUtils'
import { logActivity, trackRecent } from '@/services/data-service'

type Metrics = {
  projects: number
  queries: number
  notes: number
  datasets: number
  personalKnowledge: number
  annotations: number
}

function recentPath(item: RecentItem): string {
  const id = item.id.includes(':') ? item.id.split(':').slice(1).join(':') : item.id
  const routes: Partial<Record<RecentItem['type'], string>> = {
    project: `/projects/${id}`,
    sql_query: `/sql/${id}`,
    note: `/notes/${id}`,
    dataset: `/datasets/${id}`,
    thinking_session: `/thinking/${id}`,
    builtin_knowledge: `/library/${id}`,
    personal_knowledge: `/library/personal/${id}`,
  }
  return routes[item.type] ?? '/'
}

function toneForStatus(status: Project['status']): 'default' | 'success' | 'warning' | 'danger' {
  if (status === 'completed') return 'success'
  if (status === 'blocked') return 'danger'
  if (status === 'active') return 'warning'
  return 'default'
}

export default function CommandCenterPage() {
  const setCommandOpen = useUiStore((s) => s.setCommandOpen)
  const setSaveStatus = useUiStore((s) => s.setSaveStatus)
  const [recent, setRecent] = useState<RecentItem[]>([])
  const [focusItems, setFocusItems] = useState<FocusItem[]>([])
  const [focusText, setFocusText] = useState('')
  const [metrics, setMetrics] = useState<Metrics>({
    projects: 0,
    queries: 0,
    notes: 0,
    datasets: 0,
    personalKnowledge: 0,
    annotations: 0,
  })
  const [skills, setSkills] = useState<SkillRecord[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [activities, setActivities] = useState<ActivityRecord[]>([])

  const load = useCallback(async () => {
    const [
      recentRows,
      focusRows,
      projectRows,
      queryCount,
      noteCount,
      datasetCount,
      personalKnowledgeCount,
      annotationCount,
      skillRows,
      activityRows,
    ] = await Promise.all([
      db.recentItems.orderBy('openedAt').reverse().limit(12).toArray(),
      db.focusItems.orderBy('order').toArray(),
      db.projects.toArray(),
      db.sqlQueries.count(),
      db.notes.count(),
      db.datasets.count(),
      db.personalKnowledge.count(),
      db.knowledgeAnnotations.count(),
      db.skillRecords.orderBy('updatedAt').reverse().limit(6).toArray(),
      db.activities.orderBy('createdAt').reverse().limit(8).toArray(),
    ])
    setRecent(recentRows)
    setFocusItems(focusRows.filter((item) => !item.archivedAt))
    setProjects(projectRows.filter((project) => project.status !== 'archived'))
    setMetrics({
      projects: projectRows.filter((project) => project.status !== 'archived').length,
      queries: queryCount,
      notes: noteCount,
      datasets: datasetCount,
      personalKnowledge: personalKnowledgeCount,
      annotations: annotationCount,
    })
    setSkills(skillRows)
    setActivities(activityRows)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const greeting = greetingForHour(new Date().getHours())
  const today = formatDate(nowIso())
  const projectPulse = useMemo(
    () => ({
      active: projects.filter((project) => project.status === 'active').length,
      blocked: projects.filter((project) => project.status === 'blocked').length,
      completed: projects.filter((project) => project.status === 'completed').length,
    }),
    [projects],
  )

  async function addFocusItem() {
    const text = focusText.trim()
    if (!text) return
    await runSave(setSaveStatus, async () => {
      const nextOrder = focusItems.reduce((max, item) => Math.max(max, item.order), 0) + 1
      const item = createFocusItem(text, nextOrder)
      await db.focusItems.add(item)
      await logActivity('focus', `Added focus item: ${text}`, { type: 'focus_item', id: item.id })
      setFocusText('')
      await load()
    })
  }

  async function updateFocus(item: FocusItem, patch: Partial<FocusItem>, activity: string) {
    await runSave(setSaveStatus, async () => {
      const next = touchUpdated({ ...item, ...patch })
      await db.focusItems.put(next)
      await logActivity('focus', activity, { type: 'focus_item', id: item.id })
      await load()
    })
  }

  async function deleteFocus(item: FocusItem) {
    await runSave(setSaveStatus, async () => {
      await db.focusItems.delete(item.id)
      await logActivity('focus', `Deleted focus item: ${item.text}`)
      await load()
    })
  }

  async function moveFocus(item: FocusItem, direction: -1 | 1) {
    const sorted = [...focusItems].sort((a, b) => a.order - b.order)
    const index = sorted.findIndex((focus) => focus.id === item.id)
    const swap = sorted[index + direction]
    if (!swap) return
    await runSave(setSaveStatus, async () => {
      await db.focusItems.bulkPut([
        touchUpdated({ ...item, order: swap.order }),
        touchUpdated({ ...swap, order: item.order }),
      ])
      await load()
    })
  }

  async function carryForward(item: FocusItem) {
    await updateFocus(
      item,
      { completed: false, completedAt: null, carriedForward: true, order: Date.now() },
      `Carried forward focus item: ${item.text}`,
    )
  }

  return (
    <div className="page">
      <PageHeader
        title={`${greeting}.`}
        subtitle={`${today} · AnalystOS is ready for local-first work.`}
        actions={
          <div className="row-wrap">
            <Badge tone="success">System ready</Badge>
            <Button variant="primary" onClick={() => setCommandOpen(true)}>
              Quick search
            </Button>
          </div>
        }
      />

      <Panel>
        <div className="grid-2">
          <div>
            <h2 style={{ marginTop: 0 }}>Your analytics command center</h2>
            <p className="page-subtitle">
              Continue current work, keep focus visible, and jump into creation flows without using
              network or AI features.
            </p>
          </div>
          <div className="grid-2">
            <Link className="list-item" to="/projects/new">
              <strong>New project</strong>
              <span className="list-item-meta">Frame a business analysis</span>
            </Link>
            <Link className="list-item" to="/sql/new">
              <strong>New SQL query</strong>
              <span className="list-item-meta">Save reusable analysis SQL</span>
            </Link>
            <Link className="list-item" to="/datasets/new">
              <strong>Add dataset</strong>
              <span className="list-item-meta">Profile columns and quality</span>
            </Link>
            <Link className="list-item" to="/thinking/new">
              <strong>Thinking Mode</strong>
              <span className="list-item-meta">Turn answers into a plan</span>
            </Link>
          </div>
        </div>
      </Panel>

      <div className="grid-2">
        <Panel title="Continue working">
          {recent.length === 0 ? (
            <EmptyState
              title="No recent work yet"
              description="Open a project, query, note, or dataset and it will appear here."
            />
          ) : (
            <div className="list">
              {recent.map((item) => (
                <Link
                  key={item.id}
                  className="list-item"
                  to={recentPath(item)}
                  onClick={() => void trackRecent(item.type, item.id.split(':').slice(1).join(':'), item.title)}
                >
                  <div>
                    <p className="list-item-title">{item.title}</p>
                    <p className="list-item-meta">
                      {statusLabel(item.type)} · opened {formatDate(item.openedAt)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Today's focus">
          <form
            className="row-wrap"
            onSubmit={(event) => {
              event.preventDefault()
              void addFocusItem()
            }}
          >
            <Field label="Add focus item" htmlFor="focusText">
              <Input
                id="focusText"
                value={focusText}
                onChange={(event) => setFocusText(event.target.value)}
                placeholder="What deserves attention today?"
              />
            </Field>
            <Button type="submit" variant="primary">
              Add
            </Button>
          </form>
          <div className="list" style={{ marginTop: 12 }}>
            {focusItems.length === 0 ? (
              <EmptyState title="Clear slate" description="Add a focus item to plan the day." />
            ) : (
              focusItems.map((item) => (
                <div key={item.id} className="list-item">
                  <div className="spacer">
                    <label className="row" style={{ alignItems: 'flex-start' }}>
                      <input
                        type="checkbox"
                        checked={item.completed}
                        onChange={(event) =>
                          void updateFocus(
                            item,
                            {
                              completed: event.target.checked,
                              completedAt: event.target.checked ? nowIso() : null,
                            },
                            `${event.target.checked ? 'Completed' : 'Reopened'} focus item: ${item.text}`,
                          )
                        }
                      />
                      <span style={{ textDecoration: item.completed ? 'line-through' : undefined }}>
                        {item.text}
                      </span>
                    </label>
                    <p className="list-item-meta">
                      {item.carriedForward ? 'Carried forward · ' : ''}
                      Updated {formatDate(item.updatedAt)}
                    </p>
                  </div>
                  <div className="row-wrap">
                    <Button size="sm" variant="ghost" onClick={() => void moveFocus(item, -1)}>
                      Up
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => void moveFocus(item, 1)}>
                      Down
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => void carryForward(item)}>
                      Carry
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => void deleteFocus(item)}>
                      Delete
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Panel>
      </div>

      <div className="grid-3">
        <Panel title="Knowledge metrics">
          <div className="grid-2">
            <Metric label="Projects" value={metrics.projects} />
            <Metric label="Queries" value={metrics.queries} />
            <Metric label="Notes" value={metrics.notes} />
            <Metric label="Datasets" value={metrics.datasets} />
            <Metric label="Personal knowledge" value={metrics.personalKnowledge} />
            <Metric label="Annotations" value={metrics.annotations} />
          </div>
        </Panel>

        <Panel title="Skill snapshot">
          {skills.length === 0 ? (
            <EmptyState title="No skills tracked" description="Skill records will appear here." />
          ) : (
            <div className="list">
              {skills.map((skill) => (
                <div key={skill.id} className="list-item">
                  <div>
                    <p className="list-item-title">{skill.skill}</p>
                    <p className="list-item-meta">
                      {confidenceLabel(skill.confidence)} · {skill.nextAction || 'No next action'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Project pulse">
          <div className="grid-3">
            <Metric label="Active" value={projectPulse.active} />
            <Metric label="Blocked" value={projectPulse.blocked} />
            <Metric label="Completed" value={projectPulse.completed} />
          </div>
          <div className="list" style={{ marginTop: 12 }}>
            {projects.slice(0, 5).map((project) => (
              <Link key={project.id} className="list-item" to={`/projects/${project.id}`}>
                <div className="spacer">
                  <p className="list-item-title">{project.title}</p>
                  <p className="list-item-meta">{project.primaryQuestion || project.summary}</p>
                </div>
                <Badge tone={toneForStatus(project.status)}>{statusLabel(project.status)}</Badge>
              </Link>
            ))}
          </div>
        </Panel>
      </div>

      <Panel title="Knowledge activity">
        {activities.length === 0 ? (
          <EmptyState title="No activity yet" description="Saves and important actions will be logged here." />
        ) : (
          <div className="list">
            {activities.map((activity) => (
              <div key={activity.id} className="list-item">
                <div>
                  <p className="list-item-title">{activity.summary}</p>
                  <p className="list-item-meta">
                    {statusLabel(activity.type)} · {formatDate(activity.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="panel" style={{ padding: 14 }}>
      <div style={{ fontSize: 28, fontWeight: 700, fontFamily: 'var(--font-display)' }}>{value}</div>
      <div className="list-item-meta">{label}</div>
    </div>
  )
}
