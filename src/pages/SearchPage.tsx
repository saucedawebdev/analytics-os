import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Field, Input } from '@/components/ui/Field'
import { Badge, EmptyState, PageHeader, Panel } from '@/components/ui/Panel'
import { globalSearch, groupHits, type SearchHit } from '@/services/search-service'

export default function SearchPage() {
  const [params, setParams] = useSearchParams()
  const [query, setQuery] = useState(params.get('q') ?? '')
  const [hits, setHits] = useState<SearchHit[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setParams(query ? { q: query } : {})
      if (!query.trim()) {
        setHits([])
        return
      }
      setLoading(true)
      void globalSearch(query, 120)
        .then(setHits)
        .finally(() => setLoading(false))
    }, 120)
    return () => window.clearTimeout(handle)
  }, [query, setParams])

  const grouped = useMemo(() => groupHits(hits), [hits])

  return (
    <div className="page stack">
      <PageHeader
        title="Search"
        subtitle="Search across built-in content and your local records."
        breadcrumbs={<Breadcrumbs items={[{ label: 'Search' }]} />}
        actions={loading ? <Badge tone="warning">Searching...</Badge> : <Badge>{hits.length} results</Badge>}
      />

      <Panel>
        <Field label="Search AnalystOS">
          <Input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search projects, SQL, KPIs, formulas, notes..."
          />
        </Field>
      </Panel>

      {!query.trim() ? (
        <EmptyState title="Start searching" description="Enter a term to search your AnalystOS workspace." />
      ) : hits.length === 0 && !loading ? (
        <EmptyState title="No results" description="Try a broader keyword or check spelling." />
      ) : (
        Object.entries(grouped).map(([type, group]) => (
          <Panel key={type} title={type.replace(/_/g, ' ')}>
            <div className="list">
              {group.map((hit) => (
                <Link key={`${hit.type}:${hit.id}`} to={hit.path} className="list-item">
                  <span>
                    <strong>{hit.title}</strong>
                    <span className="list-item-meta">{hit.subtitle}</span>
                  </span>
                  <div className="row-wrap" style={{ justifyContent: 'flex-end' }}>
                    {hit.favorite ? <Badge tone="accent">Favorite</Badge> : null}
                    <Badge>{hit.score}</Badge>
                  </div>
                </Link>
              ))}
            </div>
          </Panel>
        ))
      )}
    </div>
  )
}
