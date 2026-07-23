import Editor from '@monaco-editor/react'
import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Button } from '@/components/ui/Button'
import { Field, Input, Select, Textarea } from '@/components/ui/Field'
import { ConfirmDialog } from '@/components/ui/Modal'
import { Badge, EmptyState, PageHeader, Panel } from '@/components/ui/Panel'
import { db } from '@/db'
import { useUiStore } from '@/lib/ui-store'
import type { SQLQuery, SQLQueryVersion, SqlDialect } from '@/types'
import { createId, downloadText, formatDate, nowIso, statusLabel, touchUpdated } from '@/utils'
import {
  createSqlQuery,
  DIFFICULTIES,
  joinCsv,
  runSave,
  splitCsv,
  SQL_DIALECTS,
} from '@/pages/pageUtils'
import { logActivity, trackRecent } from '@/services/data-service'

export default function SqlQueryPage() {
  const { id = 'new' } = useParams()
  const navigate = useNavigate()
  const setSaveStatus = useUiStore((s) => s.setSaveStatus)
  const [query, setQuery] = useState<SQLQuery>(() => createSqlQuery())
  const [versions, setVersions] = useState<SQLQueryVersion[]>([])
  const [missing, setMissing] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const isNew = id === 'new'

  const load = useCallback(async () => {
    if (isNew) {
      setQuery(createSqlQuery())
      setVersions([])
      setMissing(false)
      return
    }
    const row = await db.sqlQueries.get(id)
    if (!row) {
      setMissing(true)
      return
    }
    const history = await db.sqlQueryVersions.where('queryId').equals(row.id).sortBy('createdAt')
    setQuery(row)
    setVersions(history.reverse())
    setMissing(false)
    await trackRecent('sql_query', row.id, row.title)
  }, [id, isNew])

  useEffect(() => {
    void load()
  }, [load])

  function patchQuery(patch: Partial<SQLQuery>) {
    setQuery((current) => ({ ...current, ...patch }))
  }

  async function saveQuery(note = 'Manual save') {
    await runSave(setSaveStatus, async () => {
      const next = isNew ? query : touchUpdated(query)
      const lastVersion = versions[0]
      await db.sqlQueries.put(next)
      if (!lastVersion || lastVersion.sql !== next.sql || isNew) {
        await db.sqlQueryVersions.add({
          id: createId(),
          queryId: next.id,
          sql: next.sql,
          note,
          createdAt: nowIso(),
        })
      }
      await logActivity(isNew ? 'sql.created' : 'sql.saved', `Saved SQL query: ${next.title}`, {
        type: 'sql_query',
        id: next.id,
      })
      await trackRecent('sql_query', next.id, next.title)
      if (isNew) navigate(`/sql/${next.id}`, { replace: true })
      else await load()
    })
  }

  async function duplicateQuery() {
    await runSave(setSaveStatus, async () => {
      const now = nowIso()
      const copy: SQLQuery = {
        ...query,
        id: createId(),
        title: `${query.title} (copy)`,
        favorite: false,
        createdAt: now,
        updatedAt: now,
        recordVersion: 1,
      }
      await db.sqlQueries.add(copy)
      await db.sqlQueryVersions.add({
        id: createId(),
        queryId: copy.id,
        sql: copy.sql,
        note: 'Duplicated from existing query',
        createdAt: now,
      })
      await logActivity('sql.duplicated', `Duplicated SQL query: ${query.title}`, {
        type: 'sql_query',
        id: copy.id,
      })
      await trackRecent('sql_query', copy.id, copy.title)
      navigate(`/sql/${copy.id}`)
    })
  }

  async function deleteQuery() {
    await runSave(setSaveStatus, async () => {
      await db.sqlQueryVersions.where('queryId').equals(query.id).delete()
      await db.sqlQueries.delete(query.id)
      await logActivity('sql.deleted', `Deleted SQL query: ${query.title}`)
      navigate('/sql')
    })
  }

  async function copySql() {
    await navigator.clipboard.writeText(query.sql)
    await logActivity('sql.copied', `Copied SQL query: ${query.title}`, {
      type: 'sql_query',
      id: query.id,
    })
  }

  if (missing) {
    return (
      <div className="page">
        <PageHeader title="SQL query not found" actions={<Link to="/sql">Back to SQL Vault</Link>} />
        <EmptyState title="Missing query" description="This query was deleted or is unavailable." />
      </div>
    )
  }

  return (
    <div className="page">
      <PageHeader
        title={isNew ? 'New SQL query' : query.title}
        subtitle={isNew ? 'Create a reusable SQL record.' : `Updated ${formatDate(query.updatedAt)}`}
        breadcrumbs={<Breadcrumbs items={[{ label: 'SQL Vault', to: '/sql' }, { label: isNew ? 'New' : query.title }]} />}
        actions={
          <div className="row-wrap">
            <Button variant="ghost" onClick={() => void copySql()}>
              Copy SQL
            </Button>
            <Button variant="ghost" onClick={() => downloadText(`${query.title || 'query'}.sql`, query.sql, 'text/sql')}>
              Download .sql
            </Button>
            {!isNew ? (
              <Button variant="secondary" onClick={() => void duplicateQuery()}>
                Duplicate
              </Button>
            ) : null}
            {!isNew ? (
              <Button variant="danger" onClick={() => setDeleteOpen(true)}>
                Delete
              </Button>
            ) : null}
            <Button variant="primary" onClick={() => void saveQuery()}>
              Save query
            </Button>
          </div>
        }
      />

      <Panel title="Query details">
        <div className="grid-2">
          <Field label="Title" htmlFor="title">
            <Input id="title" value={query.title} onChange={(event) => patchQuery({ title: event.target.value })} />
          </Field>
          <Field label="Dialect" htmlFor="dialect">
            <Select id="dialect" value={query.dialect} onChange={(event) => patchQuery({ dialect: event.target.value as SqlDialect })}>
              {SQL_DIALECTS.map((dialect) => (
                <option key={dialect} value={dialect}>
                  {statusLabel(dialect)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Difficulty" htmlFor="difficulty">
            <Select
              id="difficulty"
              value={query.difficulty}
              onChange={(event) => patchQuery({ difficulty: event.target.value as SQLQuery['difficulty'] })}
            >
              {DIFFICULTIES.map((difficulty) => (
                <option key={difficulty} value={difficulty}>
                  {statusLabel(difficulty)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Favorite/template">
            <div className="row-wrap">
              <label className="row">
                <input type="checkbox" checked={Boolean(query.favorite)} onChange={(event) => patchQuery({ favorite: event.target.checked })} />
                Favorite
              </label>
              <label className="row">
                <input type="checkbox" checked={Boolean(query.isTemplate)} onChange={(event) => patchQuery({ isTemplate: event.target.checked })} />
                Template
              </label>
            </div>
          </Field>
        </div>
        <Field label="Business question" htmlFor="businessQuestion">
          <Textarea id="businessQuestion" value={query.businessQuestion} onChange={(event) => patchQuery({ businessQuestion: event.target.value })} rows={3} />
        </Field>
        <Field label="Explanation" htmlFor="explanation">
          <Textarea id="explanation" value={query.explanation} onChange={(event) => patchQuery({ explanation: event.target.value })} rows={3} />
        </Field>
      </Panel>

      <Panel title="SQL">
        <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 12, overflow: 'hidden' }}>
          <Editor
            height="420px"
            defaultLanguage="sql"
            theme="vs-dark"
            value={query.sql}
            onChange={(value) => patchQuery({ sql: value ?? '' })}
            options={{ minimap: { enabled: false }, fontSize: 14, wordWrap: 'on' }}
          />
        </div>
      </Panel>

      <Panel title="Metadata">
        <div className="grid-2">
          <Field label="Tables used" htmlFor="tablesUsed">
            <Input id="tablesUsed" value={joinCsv(query.tablesUsed)} onChange={(event) => patchQuery({ tablesUsed: splitCsv(event.target.value) })} />
          </Field>
          <Field label="Columns used" htmlFor="columnsUsed">
            <Input id="columnsUsed" value={joinCsv(query.columnsUsed)} onChange={(event) => patchQuery({ columnsUsed: splitCsv(event.target.value) })} />
          </Field>
          <Field label="Project IDs" htmlFor="projectIds">
            <Input id="projectIds" value={joinCsv(query.projectIds)} onChange={(event) => patchQuery({ projectIds: splitCsv(event.target.value) })} />
          </Field>
          <Field label="Dataset IDs" htmlFor="datasetIds">
            <Input id="datasetIds" value={joinCsv(query.datasetIds)} onChange={(event) => patchQuery({ datasetIds: splitCsv(event.target.value) })} />
          </Field>
          <Field label="Related topic IDs" htmlFor="relatedTopicIds">
            <Input id="relatedTopicIds" value={joinCsv(query.relatedTopicIds)} onChange={(event) => patchQuery({ relatedTopicIds: splitCsv(event.target.value) })} />
          </Field>
          <Field label="Tags" htmlFor="tags">
            <Input id="tags" value={joinCsv(query.tags)} onChange={(event) => patchQuery({ tags: splitCsv(event.target.value) })} />
          </Field>
          <Field label="Expected output" htmlFor="expectedOutput">
            <Textarea id="expectedOutput" value={query.expectedOutput} onChange={(event) => patchQuery({ expectedOutput: event.target.value })} rows={4} />
          </Field>
          <Field label="Common mistakes" htmlFor="commonMistakes">
            <Textarea id="commonMistakes" value={query.commonMistakes} onChange={(event) => patchQuery({ commonMistakes: event.target.value })} rows={4} />
          </Field>
          <Field label="Notes" htmlFor="notes">
            <Textarea id="notes" value={query.notes} onChange={(event) => patchQuery({ notes: event.target.value })} rows={4} />
          </Field>
        </div>
      </Panel>

      <Panel title="Version history">
        {versions.length === 0 ? (
          <EmptyState title="No versions yet" description="Saving the query records its SQL text here." />
        ) : (
          <div className="list">
            {versions.map((version) => (
              <div key={version.id} className="list-item">
                <div className="spacer">
                  <p className="list-item-title">{version.note}</p>
                  <p className="list-item-meta">{formatDate(version.createdAt)}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => patchQuery({ sql: version.sql })}>
                  Restore
                </Button>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <div className="row-wrap">
        <Badge>{statusLabel(query.dialect)}</Badge>
        <Badge>{statusLabel(query.difficulty)}</Badge>
        {query.favorite ? <Badge tone="accent">Favorite</Badge> : null}
      </div>

      <ConfirmDialog
        open={deleteOpen}
        title="Delete query?"
        message="This removes the saved query and its version history."
        confirmLabel="Delete"
        danger
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => void deleteQuery()}
      />
    </div>
  )
}
