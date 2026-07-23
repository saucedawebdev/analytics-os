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
import type { PortfolioCaseStudy } from '@/types'
import { formatDate } from '@/utils'
import { includesText, newPortfolioCaseStudy } from '@/pages/page-utils'

export default function PortfolioPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [refresh, setRefresh] = useState(0)
  const [deleteTarget, setDeleteTarget] = useState<PortfolioCaseStudy | null>(null)
  const loadCaseStudies = useCallback(
    async () => (await db.portfolioCaseStudies.orderBy('updatedAt').reverse().toArray()),
    [refresh],
  )
  const caseStudies = useLiveQuery(loadCaseStudies, [], [] as PortfolioCaseStudy[])

  const filtered = useMemo(
    () =>
      caseStudies.filter((study) =>
        includesText(
          search,
          study.title,
          study.oneSentenceSummary,
          study.businessProblem,
          study.keyFindings,
          study.recommendations,
        ),
      ),
    [caseStudies, search],
  )

  async function createCaseStudy() {
    const title = window.prompt('Case study title', 'New portfolio case study')
    if (!title?.trim()) return
    const study = newPortfolioCaseStudy(title.trim())
    await db.portfolioCaseStudies.add(study)
    await logActivity('portfolio', `Created case study ${study.title}`, {
      type: 'portfolio_case_study',
      id: study.id,
    })
    navigate(`/portfolio/${study.id}`)
  }

  async function deleteCaseStudy() {
    if (!deleteTarget) return
    await db.portfolioCaseStudies.delete(deleteTarget.id)
    await logActivity('portfolio', `Deleted case study ${deleteTarget.title}`)
    setRefresh((v) => v + 1)
  }

  return (
    <div className="page stack">
      <PageHeader
        title="Portfolio"
        subtitle="Build analytics case studies and generate deterministic copy for GitHub, web, resumes, LinkedIn, and STAR."
        breadcrumbs={<Breadcrumbs items={[{ label: 'Portfolio' }]} />}
        actions={
          <Button variant="primary" onClick={() => void createCaseStudy()}>
            New case study
          </Button>
        }
      />

      <Panel>
        <Field label="Search case studies">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search findings, tools, recommendations..."
          />
        </Field>
      </Panel>

      <Panel title={`${filtered.length} case stud${filtered.length === 1 ? 'y' : 'ies'}`}>
        {filtered.length === 0 ? (
          <EmptyState
            title="No portfolio case studies"
            description="Create a case study from scratch or connect it to an existing project."
            action={<Button onClick={() => void createCaseStudy()}>Create case study</Button>}
          />
        ) : (
          <div className="list">
            {filtered.map((study) => (
              <div key={study.id} className="list-item">
                <Link to={`/portfolio/${study.id}`} className="spacer">
                  <h3 className="list-item-title">{study.title}</h3>
                  <p className="list-item-meta">
                    {study.oneSentenceSummary || 'No summary yet'} · Updated {formatDate(study.updatedAt)}
                  </p>
                </Link>
                <div className="row-wrap" style={{ justifyContent: 'flex-end' }}>
                  {study.projectId ? <Badge tone="accent">Project linked</Badge> : <Badge>Standalone</Badge>}
                  <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(study)}>
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete case study?"
        message={`This permanently deletes ${deleteTarget?.title ?? 'this case study'}.`}
        confirmLabel="Delete"
        danger
        onConfirm={() => void deleteCaseStudy()}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  )
}
