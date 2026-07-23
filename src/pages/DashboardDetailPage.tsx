import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Button } from '@/components/ui/Button'
import { Field, Input, Select, Textarea } from '@/components/ui/Field'
import { Badge, EmptyState, PageHeader, Panel } from '@/components/ui/Panel'
import { db } from '@/db'
import { useLiveQuery } from '@/hooks/useLiveQuery'
import { linkRecords, logActivity, trackRecent } from '@/services/data-service'
import type { DashboardBlock, DashboardBlockType, DashboardPlan, KPI, Project } from '@/types'
import {
  DASHBOARD_BLOCK_TYPES,
  joinList,
  newDashboardBlock,
  newDashboardPlan,
  splitList,
  withUpdated,
} from '@/pages/page-utils'
import { statusLabel } from '@/utils'

type DashboardContext = {
  dashboard: DashboardPlan | null
  projects: Project[]
  kpis: KPI[]
}

export default function DashboardDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const [refresh, setRefresh] = useState(0)
  const [draft, setDraft] = useState<DashboardPlan | null>(null)
  const loadContext = useCallback(async (): Promise<DashboardContext> => {
    const dashboard = id === 'new' ? newDashboardPlan('New dashboard plan') : (await db.dashboardPlans.get(id)) ?? null
    const [projects, kpis] = await Promise.all([
      db.projects.orderBy('updatedAt').reverse().toArray(),
      db.kpis.orderBy('name').toArray(),
    ])
    return { dashboard, projects, kpis }
  }, [id, refresh])
  const context = useLiveQuery(loadContext, [], { dashboard: null, projects: [], kpis: [] })

  useEffect(() => {
    setDraft(context.dashboard)
    if (context.dashboard && id !== 'new') {
      void trackRecent('dashboard_plan', context.dashboard.id, context.dashboard.name)
    }
  }, [context.dashboard, id])

  const reviewScore = useMemo(() => {
    const total = draft?.checklist.length ?? 0
    const done = draft?.checklist.filter((item) => item.done).length ?? 0
    return { done, total }
  }, [draft])

  if (!draft) {
    return (
      <div className="page stack">
        <PageHeader
          title="Dashboard not found"
          breadcrumbs={<Breadcrumbs items={[{ label: 'Dashboards', to: '/dashboards' }, { label: 'Missing' }]} />}
        />
        <EmptyState
          title="No dashboard plan found"
          description="Create a dashboard plan from the dashboards page."
          action={<Button onClick={() => navigate('/dashboards')}>Back to dashboards</Button>}
        />
      </div>
    )
  }

  function updateBlock(blockId: string, patch: Partial<DashboardBlock>) {
    const currentDraft = draft!
    setDraft({
      ...currentDraft,
      blocks: currentDraft.blocks.map((block) => (block.id === blockId ? { ...block, ...patch } : block)),
    })
  }

  function addBlock(type: DashboardBlockType) {
    const currentDraft = draft!
    setDraft({
      ...currentDraft,
      blocks: [...currentDraft.blocks, newDashboardBlock(type, currentDraft.blocks.length)],
    })
  }

  async function save() {
    const currentDraft = draft!
    const next = withUpdated<DashboardPlan>({
      ...currentDraft,
      name: currentDraft.name.trim() || 'Untitled dashboard plan',
    })
    await db.dashboardPlans.put(next)
    if (next.projectId) {
      await linkRecords({ type: 'project', id: next.projectId }, { type: 'dashboard_plan', id: next.id })
    }
    await logActivity('dashboard', `Saved dashboard plan ${next.name}`, {
      type: 'dashboard_plan',
      id: next.id,
    })
    if (id === 'new') navigate(`/dashboards/${next.id}`, { replace: true })
    setRefresh((v) => v + 1)
  }

  return (
    <div className="page stack">
      <PageHeader
        title={draft.name}
        subtitle={`Review score ${reviewScore.done}/${reviewScore.total} · Version ${draft.recordVersion ?? 1}`}
        breadcrumbs={
          <Breadcrumbs items={[{ label: 'Dashboards', to: '/dashboards' }, { label: draft.name || 'New' }]} />
        }
        actions={
          <Button variant="primary" onClick={() => void save()}>
            Save dashboard
          </Button>
        }
      />

      <Panel title="Plan">
        <div className="grid-2">
          <Field label="Name">
            <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          </Field>
          <Field label="Related project">
            <Select
              value={draft.projectId ?? ''}
              onChange={(e) => setDraft({ ...draft, projectId: e.target.value || null })}
            >
              <option value="">No project</option>
              {context.projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.title}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Audience">
            <Input value={draft.audience} onChange={(e) => setDraft({ ...draft, audience: e.target.value })} />
          </Field>
          <Field label="Decision supported">
            <Input
              value={draft.decisionSupported}
              onChange={(e) => setDraft({ ...draft, decisionSupported: e.target.value })}
            />
          </Field>
          <Field label="Primary question">
            <Textarea
              value={draft.primaryQuestion}
              onChange={(e) => setDraft({ ...draft, primaryQuestion: e.target.value })}
            />
          </Field>
          <Field label="Data sources">
            <Textarea value={draft.dataSources} onChange={(e) => setDraft({ ...draft, dataSources: e.target.value })} />
          </Field>
          <Field label="Charts">
            <Textarea value={draft.charts} onChange={(e) => setDraft({ ...draft, charts: e.target.value })} />
          </Field>
          <Field label="Filters">
            <Textarea value={draft.filters} onChange={(e) => setDraft({ ...draft, filters: e.target.value })} />
          </Field>
          <Field label="Refresh frequency">
            <Input
              value={draft.refreshFrequency}
              onChange={(e) => setDraft({ ...draft, refreshFrequency: e.target.value })}
            />
          </Field>
          <Field label="Publication location">
            <Input
              value={draft.publicationLocation}
              onChange={(e) => setDraft({ ...draft, publicationLocation: e.target.value })}
            />
          </Field>
        </div>
      </Panel>

      <Panel title="KPI selection">
        <div className="stack">
          <Field label="Selected KPI IDs (comma-separated)">
            <Input
              value={joinList(draft.kpiIds)}
              onChange={(e) => setDraft({ ...draft, kpiIds: splitList(e.target.value) })}
            />
          </Field>
          <div className="row-wrap">
            {context.kpis.slice(0, 18).map((kpi) => (
              <Button
                key={kpi.id}
                size="sm"
                variant={draft.kpiIds.includes(kpi.id) ? 'primary' : 'secondary'}
                onClick={() => {
                  const exists = draft.kpiIds.includes(kpi.id)
                  setDraft({
                    ...draft,
                    kpiIds: exists ? draft.kpiIds.filter((item) => item !== kpi.id) : [...draft.kpiIds, kpi.id],
                  })
                }}
              >
                {kpi.name}
              </Button>
            ))}
          </div>
        </div>
      </Panel>

      <Panel
        title="Wireframe blocks"
        action={
          <div className="row-wrap">
            {DASHBOARD_BLOCK_TYPES.map((type) => (
              <Button key={type} size="sm" onClick={() => addBlock(type)}>
                Add {statusLabel(type)}
              </Button>
            ))}
          </div>
        }
      >
        {draft.blocks.length === 0 ? (
          <EmptyState
            title="No blocks yet"
            description="Add KPI, chart, table, text, insight, or recommendation blocks to sketch the dashboard layout."
          />
        ) : (
          <div
            className="grid-3"
            style={{
              alignItems: 'stretch',
            }}
          >
            {draft.blocks.map((block) => (
              <div key={block.id} className="panel stack">
                <div className="row-wrap">
                  <Badge tone="accent">{statusLabel(block.type)}</Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setDraft({ ...draft, blocks: draft.blocks.filter((item) => item.id !== block.id) })
                    }
                  >
                    Remove
                  </Button>
                </div>
                <Field label="Title">
                  <Input value={block.title} onChange={(e) => updateBlock(block.id, { title: e.target.value })} />
                </Field>
                <Field label="Notes">
                  <Textarea value={block.notes} onChange={(e) => updateBlock(block.id, { notes: e.target.value })} />
                </Field>
                <div className="grid-4">
                  <Field label="Row">
                    <Input
                      type="number"
                      value={block.row}
                      onChange={(e) => updateBlock(block.id, { row: Number(e.target.value) })}
                    />
                  </Field>
                  <Field label="Col">
                    <Input
                      type="number"
                      value={block.col}
                      onChange={(e) => updateBlock(block.id, { col: Number(e.target.value) })}
                    />
                  </Field>
                  <Field label="Width">
                    <Input
                      type="number"
                      value={block.width}
                      onChange={(e) => updateBlock(block.id, { width: Number(e.target.value) })}
                    />
                  </Field>
                  <Field label="Height">
                    <Input
                      type="number"
                      value={block.height}
                      onChange={(e) => updateBlock(block.id, { height: Number(e.target.value) })}
                    />
                  </Field>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <div className="grid-2">
        <Panel title={`Review checklist (${reviewScore.done}/${reviewScore.total})`}>
          <div className="stack">
            {draft.checklist.map((item) => (
              <label key={item.id} className="row" style={{ alignItems: 'flex-start' }}>
                <input
                  type="checkbox"
                  checked={item.done}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      checklist: draft.checklist.map((check) =>
                        check.id === item.id ? { ...check, done: e.target.checked } : check,
                      ),
                    })
                  }
                />
                <Input
                  value={item.text}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      checklist: draft.checklist.map((check) =>
                        check.id === item.id ? { ...check, text: e.target.value } : check,
                      ),
                    })
                  }
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setDraft({ ...draft, checklist: draft.checklist.filter((check) => check.id !== item.id) })
                  }
                >
                  Remove
                </Button>
              </label>
            ))}
            <Button
              onClick={() =>
                setDraft({
                  ...draft,
                  checklist: [...draft.checklist, { id: crypto.randomUUID(), text: 'New review item', done: false }],
                })
              }
            >
              Add checklist item
            </Button>
          </div>
        </Panel>

        <Panel title="Design notes">
          <div className="stack">
            <Field label="Layout notes">
              <Textarea value={draft.layoutNotes} onChange={(e) => setDraft({ ...draft, layoutNotes: e.target.value })} />
            </Field>
            <Field label="Color notes">
              <Textarea value={draft.colorNotes} onChange={(e) => setDraft({ ...draft, colorNotes: e.target.value })} />
            </Field>
            <Field label="Accessibility notes">
              <Textarea
                value={draft.accessibilityNotes}
                onChange={(e) => setDraft({ ...draft, accessibilityNotes: e.target.value })}
              />
            </Field>
            <Field label="Known limitations">
              <Textarea
                value={draft.knownLimitations}
                onChange={(e) => setDraft({ ...draft, knownLimitations: e.target.value })}
              />
            </Field>
          </div>
        </Panel>
      </div>

      {draft.projectId ? (
        <Panel title="Linked project">
          <Link className="list-item" to={`/projects/${draft.projectId}`}>
            Open linked project
          </Link>
        </Panel>
      ) : null}
    </div>
  )
}
