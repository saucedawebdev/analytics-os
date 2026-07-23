import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Button } from '@/components/ui/Button'
import { Field, Input, Textarea } from '@/components/ui/Field'
import { Badge, EmptyState, PageHeader, Panel } from '@/components/ui/Panel'
import { ConfirmDialog } from '@/components/ui/Modal'
import { db } from '@/db'
import { builtinKpis } from '@/data/builtin'
import { useLiveQuery } from '@/hooks/useLiveQuery'
import { logActivity, trackRecent } from '@/services/data-service'
import type { KPI } from '@/types'
import { joinList, splitList, withUpdated } from '@/pages/page-utils'

export default function KpiDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const [refresh, setRefresh] = useState(0)
  const [draft, setDraft] = useState<KPI | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const loadKpi = useCallback(async () => {
    const stored = await db.kpis.get(id)
    return stored ?? builtinKpis.find((kpi) => kpi.id === id) ?? null
  }, [id, refresh])
  const kpi = useLiveQuery(loadKpi, [], null as KPI | null)

  useEffect(() => {
    setDraft(kpi)
    if (kpi) void trackRecent('kpi', kpi.id, kpi.name)
  }, [kpi])

  if (!kpi || !draft) {
    return (
      <div className="page stack">
        <PageHeader
          title="KPI not found"
          breadcrumbs={<Breadcrumbs items={[{ label: 'KPIs', to: '/kpis' }, { label: 'Missing' }]} />}
        />
        <EmptyState
          title="No KPI found"
          description="The KPI may have been deleted or built-in content has not loaded yet."
          action={<Button onClick={() => navigate('/kpis')}>Back to KPIs</Button>}
        />
      </div>
    )
  }

  async function saveNotes() {
    const currentKpi = kpi!
    const currentDraft = draft!
    const current = await db.kpis.get(currentKpi.id)
    const next = withUpdated<KPI>({
      ...(current ?? currentKpi),
      personalNotes: currentDraft.personalNotes,
    })
    await db.kpis.put(next)
    await logActivity('kpi', `Updated notes for ${next.name}`, { type: 'kpi', id: next.id })
    setRefresh((v) => v + 1)
  }

  async function savePersonalKpi() {
    const currentDraft = draft!
    if (currentDraft.isBuiltIn) return
    const next = withUpdated<KPI>({
      ...currentDraft,
      name: currentDraft.name.trim() || 'Untitled KPI',
    })
    await db.kpis.put(next)
    await logActivity('kpi', `Updated KPI ${next.name}`, { type: 'kpi', id: next.id })
    setRefresh((v) => v + 1)
  }

  async function duplicateBuiltIn() {
    const currentKpi = kpi!
    const currentDraft = draft!
    const now = new Date().toISOString()
    const copy: KPI = {
      ...currentKpi,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
      recordVersion: 1,
      name: `${currentKpi.name} (personal copy)`,
      isBuiltIn: false,
      personalNotes: currentDraft.personalNotes,
    }
    await db.kpis.add(copy)
    await logActivity('kpi', `Duplicated KPI ${currentKpi.name}`, { type: 'kpi', id: copy.id })
    navigate(`/kpis/${copy.id}`)
  }

  async function deletePersonalKpi() {
    const currentKpi = kpi!
    if (currentKpi.isBuiltIn) return
    await db.kpis.delete(currentKpi.id)
    await logActivity('kpi', `Deleted KPI ${currentKpi.name}`)
    navigate('/kpis')
  }

  return (
    <div className="page stack">
      <PageHeader
        title={kpi.name}
        subtitle={`${kpi.category}${kpi.industry ? ` · ${kpi.industry}` : ''}`}
        breadcrumbs={<Breadcrumbs items={[{ label: 'KPIs', to: '/kpis' }, { label: kpi.name }]} />}
        actions={
          <div className="row-wrap">
            <Badge tone={kpi.isBuiltIn ? 'builtin' : 'accent'}>{kpi.isBuiltIn ? 'Built-in' : 'Personal'}</Badge>
            {kpi.isBuiltIn ? (
              <Button onClick={() => void duplicateBuiltIn()}>Make personal copy</Button>
            ) : (
              <Button variant="danger" onClick={() => setDeleteOpen(true)}>
                Delete
              </Button>
            )}
          </div>
        }
      />

      <div className="grid-2">
        <Panel title="Definition">
          <div className="stack">
            {draft.isBuiltIn ? (
              <>
                <p>{draft.definition}</p>
                <p className="mono" style={{ color: 'var(--accent)' }}>
                  {draft.formula}
                </p>
              </>
            ) : (
              <>
                <Field label="Name">
                  <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
                </Field>
                <div className="grid-2">
                  <Field label="Category">
                    <Input
                      value={draft.category}
                      onChange={(e) => setDraft({ ...draft, category: e.target.value })}
                    />
                  </Field>
                  <Field label="Industry">
                    <Input
                      value={draft.industry}
                      onChange={(e) => setDraft({ ...draft, industry: e.target.value })}
                    />
                  </Field>
                </div>
                <Field label="Definition">
                  <Textarea
                    value={draft.definition}
                    onChange={(e) => setDraft({ ...draft, definition: e.target.value })}
                  />
                </Field>
                <Field label="Formula">
                  <Textarea value={draft.formula} onChange={(e) => setDraft({ ...draft, formula: e.target.value })} />
                </Field>
              </>
            )}
          </div>
        </Panel>

        <Panel title="Personal notes">
          <div className="stack">
            <Textarea
              value={draft.personalNotes}
              onChange={(event) => setDraft({ ...draft, personalNotes: event.target.value })}
              placeholder="Your company definition, caveats, source table, or dashboard placement."
            />
            <Button variant="primary" onClick={() => void saveNotes()}>
              Save notes
            </Button>
          </div>
        </Panel>
      </div>

      <Panel title="How to use this KPI">
        <div className="grid-2">
          <div>
            <h3>Purpose</h3>
            {draft.isBuiltIn ? (
              <p>{draft.purpose}</p>
            ) : (
              <Textarea value={draft.purpose} onChange={(e) => setDraft({ ...draft, purpose: e.target.value })} />
            )}
          </div>
          <div>
            <h3>When to use</h3>
            {draft.isBuiltIn ? (
              <p>{draft.whenToUse}</p>
            ) : (
              <Textarea value={draft.whenToUse} onChange={(e) => setDraft({ ...draft, whenToUse: e.target.value })} />
            )}
          </div>
          <div>
            <h3>Interpretation</h3>
            {draft.isBuiltIn ? (
              <p>{draft.interpretation}</p>
            ) : (
              <Textarea
                value={draft.interpretation}
                onChange={(e) => setDraft({ ...draft, interpretation: e.target.value })}
              />
            )}
          </div>
          <div>
            <h3>Common mistakes</h3>
            {draft.isBuiltIn ? (
              <p>{draft.commonMistakes}</p>
            ) : (
              <Textarea
                value={draft.commonMistakes}
                onChange={(e) => setDraft({ ...draft, commonMistakes: e.target.value })}
              />
            )}
          </div>
        </div>
        {!draft.isBuiltIn ? (
          <div className="stack" style={{ marginTop: 16 }}>
            <Field label="Example">
              <Textarea value={draft.example} onChange={(e) => setDraft({ ...draft, example: e.target.value })} />
            </Field>
            <Field label="Related charts">
              <Input
                value={draft.relatedCharts}
                onChange={(e) => setDraft({ ...draft, relatedCharts: e.target.value })}
              />
            </Field>
            <Field label="Related KPI IDs (comma-separated)">
              <Input
                value={joinList(draft.relatedKpiIds)}
                onChange={(e) => setDraft({ ...draft, relatedKpiIds: splitList(e.target.value) })}
              />
            </Field>
            <Button variant="primary" onClick={() => void savePersonalKpi()}>
              Save KPI
            </Button>
          </div>
        ) : null}
      </Panel>

      {kpi.relatedKpiIds.length > 0 ? (
        <Panel title="Related KPIs">
          <div className="list">
            {kpi.relatedKpiIds.map((relatedId) => (
              <Link key={relatedId} to={`/kpis/${relatedId}`} className="list-item">
                {relatedId}
              </Link>
            ))}
          </div>
        </Panel>
      ) : null}

      <ConfirmDialog
        open={deleteOpen}
        title="Delete KPI?"
        message="This permanently deletes your personal KPI."
        confirmLabel="Delete"
        danger
        onConfirm={() => void deletePersonalKpi()}
        onClose={() => setDeleteOpen(false)}
      />
    </div>
  )
}
