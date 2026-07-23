import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { EntityRef, RecordType, Relationship } from '@/types'
import { getRelated } from '@/services/data-service'
import { Panel, EmptyState } from '@/components/ui/Panel'
import { Badge } from '@/components/ui/Panel'

const PATHS: Partial<Record<RecordType, (id: string) => string>> = {
  project: (id) => `/projects/${id}`,
  sql_query: (id) => `/sql/${id}`,
  dataset: (id) => `/datasets/${id}`,
  note: (id) => `/notes/${id}`,
  dashboard_plan: (id) => `/dashboards/${id}`,
  portfolio_case_study: (id) => `/portfolio/${id}`,
  interview_question: (id) => `/interview/${id}`,
  thinking_session: (id) => `/thinking/${id}`,
  job_application: (id) => `/career/jobs/${id}`,
  kpi: (id) => `/kpis/${id}`,
  formula: (id) => `/formulas/${id}`,
  builtin_knowledge: (id) => `/library/${id}`,
  star_story: () => `/star-stories`,
}

function otherSide(rel: Relationship, entity: EntityRef): EntityRef {
  if (rel.fromType === entity.type && rel.fromId === entity.id) {
    return { type: rel.toType, id: rel.toId }
  }
  return { type: rel.fromType, id: rel.fromId }
}

export function RelationshipPanel({ entity }: { entity: EntityRef }) {
  const [rels, setRels] = useState<Relationship[]>([])

  useEffect(() => {
    void getRelated(entity).then(setRels)
  }, [entity.id, entity.type])

  return (
    <Panel title="Related items">
      {rels.length === 0 ? (
        <EmptyState
          title="No links yet"
          description="Link projects, queries, datasets, and notes as you work."
        />
      ) : (
        <div className="list">
          {rels.map((rel) => {
            const other = otherSide(rel, entity)
            const to = PATHS[other.type]?.(other.id) ?? '/'
            return (
              <Link key={rel.id} to={to} className="list-item">
                <div>
                  <p className="list-item-title">{other.type.replace(/_/g, ' ')}</p>
                  <p className="list-item-meta mono">{other.id.slice(0, 8)}</p>
                </div>
                <Badge tone="accent">{rel.label ?? 'linked'}</Badge>
              </Link>
            )
          })}
        </div>
      )}
    </Panel>
  )
}
