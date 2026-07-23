import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Field'
import { Badge, EmptyState, PageHeader, Panel } from '@/components/ui/Panel'
import { db } from '@/db'
import type { SQLQuery, SqlDialect } from '@/types'
import { formatDate, statusLabel } from '@/utils'
import { SQL_DIALECTS } from '@/pages/pageUtils'
import { trackRecent } from '@/services/data-service'

type DialectFilter = SqlDialect | 'all'

export default function SqlVaultPage() {
  const [queries, setQueries] = useState<SQLQuery[]>([])
  const [dialect, setDialect] = useState<DialectFilter>('all')
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    setQueries(await db.sqlQueries.orderBy('updatedAt').reverse().toArray())
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return queries.filter((query) => {
      const matchesDialect = dialect === 'all' || query.dialect === dialect
      const matchesSearch =
        !q ||
        [query.title, query.businessQuestion, query.explanation, query.sql, ...(query.tags ?? [])]
          .join(' ')
          .toLowerCase()
          .includes(q)
      return matchesDialect && matchesSearch
    })
  }, [dialect, queries, search])

  return (
    <div className="page">
      <PageHeader
        title="SQL Vault"
        subtitle="Personal query library for reusable analysis patterns."
        actions={
          <div className="row-wrap">
            <Link to="/sql/workspace">
              <Button>Open workspace</Button>
            </Link>
            <Link to="/sql/new">
              <Button variant="primary">New query</Button>
            </Link>
          </div>
        }
      />

      <Panel>
        <div className="row-wrap">
          <label className="field">
            <span className="label">Search</span>
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search SQL, notes, tags" />
          </label>
          <label className="field">
            <span className="label">Dialect</span>
            <Select value={dialect} onChange={(event) => setDialect(event.target.value as DialectFilter)}>
              <option value="all">All dialects</option>
              {SQL_DIALECTS.map((value) => (
                <option key={value} value={value}>
                  {statusLabel(value)}
                </option>
              ))}
            </Select>
          </label>
        </div>
      </Panel>

      <Panel title={`${filtered.length} saved quer${filtered.length === 1 ? 'y' : 'ies'}`}>
        {filtered.length === 0 ? (
          <EmptyState
            title="No SQL queries yet"
            description="Save a query from the editor or workspace."
            action={
              <Link to="/sql/new">
                <Button variant="primary">Create query</Button>
              </Link>
            }
          />
        ) : (
          <div className="list">
            {filtered.map((query) => (
              <Link
                key={query.id}
                className="list-item"
                to={`/sql/${query.id}`}
                onClick={() => void trackRecent('sql_query', query.id, query.title)}
              >
                <div className="spacer">
                  <div className="row-wrap">
                    <p className="list-item-title">{query.title}</p>
                    {query.favorite ? <Badge tone="accent">Favorite</Badge> : null}
                    {query.isTemplate ? <Badge>Template</Badge> : null}
                  </div>
                  <p className="list-item-meta">
                    {query.businessQuestion || query.explanation || 'No description yet'}
                  </p>
                  <p className="list-item-meta">Updated {formatDate(query.updatedAt)}</p>
                </div>
                <div className="row-wrap">
                  <Badge>{statusLabel(query.dialect)}</Badge>
                  <Badge>{statusLabel(query.difficulty)}</Badge>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Panel>
    </div>
  )
}
