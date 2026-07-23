import { useCallback, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Button } from '@/components/ui/Button'
import { Field, Input } from '@/components/ui/Field'
import { Badge, EmptyState, PageHeader, Panel } from '@/components/ui/Panel'
import { ConfirmDialog } from '@/components/ui/Modal'
import { db } from '@/db'
import { useLiveQuery } from '@/hooks/useLiveQuery'
import { logActivity } from '@/services/data-service'
import type { DashboardPlan } from '@/types'
import { formatDate } from '@/utils'
import { includesText, newDashboardPlan } from '@/pages/page-utils'

export default function DashboardsPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [refresh, setRefresh] = useState(0)
  const [deleteTarget, setDeleteTarget] = useState<DashboardPlan | null>(null)
  const loadDashboards = useCallback(
    async () => (await db.dashboardPlans.orderBy('updatedAt').reverse().toArray()),
    [refresh],
  )
  const dashboards = useLiveQuery(loadDashboards, [], [] as DashboardPlan[])

  const filtered = useMemo(
    () =>
      dashboards.filter((dashboard) =>
        includesText(
          search,
          dashboard.name,
          dashboard.audience,
          dashboard.primaryQuestion,
          dashboard.decisionSupported,
          dashboard.dataSources,
        ),
      ),
    [dashboards, search],
  )

  async function createDashboard() {
    const name = window.prompt('Dashboard plan name', 'New dashboard plan')
    if (!name?.trim()) return
    const dashboard = newDashboardPlan(name.trim())
    await db.dashboardPlans.add(dashboard)
    await logActivity('dashboard', `Created dashboard plan ${dashboard.name}`, {
      type: 'dashboard_plan',
      id: dashboard.id,
    })
    navigate(`/dashboards/${dashboard.id}`)
  }

  async function deleteDashboard() {
    if (!deleteTarget) return
    await db.dashboardPlans.delete(deleteTarget.id)
    await logActivity('dashboard', `Deleted dashboard plan ${deleteTarget.name}`)
    setRefresh((v) => v + 1)
  }

  return (
    <div className="page stack">
      <PageHeader
        title="Dashboards"
        subtitle="Plan dashboard purpose, data sources, wireframe blocks, QA checklist, and publication details."
        breadcrumbs={<Breadcrumbs items={[{ label: 'Dashboards' }]} />}
        actions={
          <Button variant="primary" onClick={() => void createDashboard()}>
            New dashboard
          </Button>
        }
      />

      <Panel>
        <Field label="Search dashboard plans">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search audience, decision, data source..."
          />
        </Field>
      </Panel>

      <Panel title={`${filtered.length} dashboard plan${filtered.length === 1 ? '' : 's'}`}>
        {filtered.length === 0 ? (
          <EmptyState
            title="No dashboard plans"
            description="Create a dashboard plan to outline the decision, layout, KPI blocks, and review checklist."
            action={<Button onClick={() => void createDashboard()}>Create dashboard plan</Button>}
          />
        ) : (
          <div className="list">
            {filtered.map((dashboard) => {
              const complete = dashboard.checklist.filter((item) => item.done).length
              const total = dashboard.checklist.length
              return (
                <div key={dashboard.id} className="list-item">
                  <Link to={`/dashboards/${dashboard.id}`} className="spacer">
                    <h3 className="list-item-title">{dashboard.name}</h3>
                    <p className="list-item-meta">
                      {dashboard.primaryQuestion || dashboard.decisionSupported || 'No decision documented'} · Updated{' '}
                      {formatDate(dashboard.updatedAt)}
                    </p>
                  </Link>
                  <div className="row-wrap" style={{ justifyContent: 'flex-end' }}>
                    <Badge tone={total > 0 && complete === total ? 'success' : 'warning'}>
                      Review {complete}/{total}
                    </Badge>
                    <Badge>v{dashboard.recordVersion ?? 1}</Badge>
                    <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(dashboard)}>
                      Delete
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Panel>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete dashboard plan?"
        message={`This permanently deletes ${deleteTarget?.name ?? 'this dashboard plan'}.`}
        confirmLabel="Delete"
        danger
        onConfirm={() => void deleteDashboard()}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  )
}
