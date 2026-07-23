import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Field, Input, Textarea } from '@/components/ui/Field'
import { Badge, EmptyState, PageHeader, Panel } from '@/components/ui/Panel'
import { db } from '@/db'
import { useUiStore } from '@/lib/ui-store'
import type { SQLQuery } from '@/types'
import { createId, downloadText, nowIso, parseCsv, statusLabel, toCsv } from '@/utils'
import { createSqlQuery, runSave } from '@/pages/pageUtils'
import { logActivity, trackRecent } from '@/services/data-service'

type SqlValue = string | number | Uint8Array | null
type QueryResult = { columns: string[]; values: SqlValue[][] }
type WorkspaceDb = {
  exec: (sql: string) => QueryResult[]
  run: (sql: string, params?: SqlValue[]) => void
  close: () => void
}
type SqlStatic = { Database: new () => WorkspaceDb }
type InitSqlJs = (config: { locateFile: (file: string) => string }) => Promise<SqlStatic>

function quoteIdent(value: string): string {
  return `"${value.replace(/"/g, '""')}"`
}

function safeTableName(fileName: string): string {
  const base = fileName.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9_]+/g, '_')
  return base || 'imported_csv'
}

function resultRows(result: QueryResult | null): Record<string, unknown>[] {
  if (!result) return []
  return result.values.map((row) =>
    result.columns.reduce<Record<string, unknown>>((acc, column, index) => {
      acc[column] = row[index] ?? ''
      return acc
    }, {}),
  )
}

export default function SqlWorkspacePage() {
  const setSaveStatus = useUiStore((s) => s.setSaveStatus)
  const [workspaceDb, setWorkspaceDb] = useState<WorkspaceDb | null>(null)
  const [loadStatus, setLoadStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [loadError, setLoadError] = useState('')
  const [sql, setSql] = useState('SELECT name FROM sqlite_master WHERE type = "table" ORDER BY name;')
  const [results, setResults] = useState<QueryResult | null>(null)
  const [message, setMessage] = useState('')
  const [savedTitle, setSavedTitle] = useState('Workspace query')
  const [tables, setTables] = useState<string[]>([])

  useEffect(() => {
    let active = true
    async function loadSqlJs() {
      try {
        const module = (await import('sql.js')) as unknown as { default: InitSqlJs }
        const initSqlJs = module.default
        let SQL: SqlStatic
        try {
          SQL = await initSqlJs({
            locateFile: (file) => new URL(`../../node_modules/sql.js/dist/${file}`, import.meta.url).href,
          })
        } catch {
          SQL = await initSqlJs({ locateFile: (file) => `https://sql.js.org/dist/${file}` })
        }
        if (!active) return
        const nextDb = new SQL.Database()
        setWorkspaceDb(nextDb)
        setLoadStatus('ready')
        setMessage('Temporary SQLite workspace ready. First load may need network access for sql-wasm.wasm if the local asset is unavailable.')
      } catch (error) {
        if (!active) return
        setLoadStatus('error')
        setLoadError(error instanceof Error ? error.message : 'Unable to load sql.js')
      }
    }
    void loadSqlJs()
    return () => {
      active = false
    }
  }, [])

  useEffect(
    () => () => {
      workspaceDb?.close()
    },
    [workspaceDb],
  )

  const rows = useMemo(() => resultRows(results), [results])

  function refreshTables(currentDb: WorkspaceDb) {
    const tableResult = currentDb.exec('SELECT name FROM sqlite_master WHERE type = "table" ORDER BY name;')[0]
    setTables((tableResult?.values ?? []).map((row) => String(row[0] ?? '')))
  }

  function runSql() {
    if (!workspaceDb) return
    try {
      const output = workspaceDb.exec(sql)
      const last = output.length > 0 ? output[output.length - 1] ?? null : null
      setResults(last)
      refreshTables(workspaceDb)
      setMessage(last ? `${last.values.length} result row${last.values.length === 1 ? '' : 's'}.` : 'Statement executed.')
      void logActivity('sql.workspace.run', 'Ran SQL in workspace')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'SQL execution failed')
    }
  }

  async function importCsv(file: File) {
    if (!workspaceDb) return
    const text = await file.text()
    const parsed = parseCsv(text)
    if (parsed.headers.length === 0) {
      setMessage('CSV has no headers.')
      return
    }
    const table = safeTableName(file.name)
    const columns = parsed.headers.map((header, index) => header || `column_${index + 1}`)
    workspaceDb.run(`DROP TABLE IF EXISTS ${quoteIdent(table)};`)
    workspaceDb.run(
      `CREATE TABLE ${quoteIdent(table)} (${columns.map((column) => `${quoteIdent(column)} TEXT`).join(', ')});`,
    )
    const placeholders = columns.map(() => '?').join(', ')
    const insert = `INSERT INTO ${quoteIdent(table)} (${columns.map(quoteIdent).join(', ')}) VALUES (${placeholders});`
    for (const row of parsed.rows) {
      workspaceDb.run(insert, columns.map((_, index) => row[index] ?? ''))
    }
    refreshTables(workspaceDb)
    setSql(`SELECT * FROM ${quoteIdent(table)} LIMIT 50;`)
    setMessage(`Imported ${parsed.rows.length} row${parsed.rows.length === 1 ? '' : 's'} into ${table}.`)
    await logActivity('sql.workspace.import', `Imported CSV into SQL workspace: ${file.name}`)
  }

  async function saveToVault() {
    await runSave(setSaveStatus, async () => {
      const now = nowIso()
      const query: SQLQuery = {
        ...createSqlQuery(),
        id: createId(),
        title: savedTitle.trim() || 'Workspace query',
        sql,
        explanation: 'Saved from SQL Workspace.',
        tablesUsed: tables,
        createdAt: now,
        updatedAt: now,
      }
      await db.sqlQueries.add(query)
      await db.sqlQueryVersions.add({
        id: createId(),
        queryId: query.id,
        sql: query.sql,
        note: 'Saved from SQL Workspace',
        createdAt: now,
      })
      await logActivity('sql.created', `Saved workspace SQL to vault: ${query.title}`, {
        type: 'sql_query',
        id: query.id,
      })
      await trackRecent('sql_query', query.id, query.title)
      setMessage(`Saved "${query.title}" to SQL Vault.`)
    })
  }

  return (
    <div className="page">
      <PageHeader
        title="SQL Workspace"
        subtitle="Temporary local sql.js SQLite workspace for CSV exploration."
        actions={
          <div className="row-wrap">
            <Link to="/sql">
              <Button>Back to vault</Button>
            </Link>
            <Button variant="primary" onClick={runSql} disabled={!workspaceDb}>
              Run SQL
            </Button>
          </div>
        }
      />

      {loadStatus === 'error' ? (
        <Panel title="sql.js failed to load">
          <p className="page-subtitle">{loadError}</p>
          <p className="list-item-meta">
            The workspace first tries the local Vite dependency asset and then the sql.js CDN for
            sql-wasm.wasm. If both are unavailable, saved SQL CRUD still works in the vault.
          </p>
        </Panel>
      ) : null}

      <Panel title="Workspace controls">
        <div className="grid-2">
          <Field label="Import CSV" htmlFor="csvImport">
            <Input
              id="csvImport"
              type="file"
              accept=".csv,text/csv"
              disabled={!workspaceDb}
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (file) void importCsv(file)
              }}
            />
          </Field>
          <Field label="Save query title" htmlFor="savedTitle">
            <Input id="savedTitle" value={savedTitle} onChange={(event) => setSavedTitle(event.target.value)} />
          </Field>
        </div>
        <div className="row-wrap">
          <Badge tone={loadStatus === 'ready' ? 'success' : loadStatus === 'loading' ? 'warning' : 'danger'}>
            {statusLabel(loadStatus)}
          </Badge>
          {tables.map((table) => (
            <Badge key={table}>{table}</Badge>
          ))}
        </div>
        {message ? <p className="list-item-meta">{message}</p> : null}
      </Panel>

      <Panel title="SQL editor">
        <Field label="SQL" htmlFor="workspaceSql">
          <Textarea id="workspaceSql" value={sql} onChange={(event) => setSql(event.target.value)} rows={12} />
        </Field>
        <div className="row-wrap">
          <Button variant="primary" onClick={runSql} disabled={!workspaceDb}>
            Run SQL
          </Button>
          <Button onClick={() => downloadText('workspace-results.csv', toCsv(rows), 'text/csv')} disabled={rows.length === 0}>
            Export results CSV
          </Button>
          <Button onClick={() => void saveToVault()} disabled={!workspaceDb}>
            Save query to vault
          </Button>
        </div>
      </Panel>

      <Panel title="Results">
        {!results ? (
          <EmptyState title="No result set" description="Run a SELECT query to see rows here." />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  {results.columns.map((column) => (
                    <th key={column}>{column}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {results.values.map((row, rowIndex) => (
                  <tr key={`row-${rowIndex}`}>
                    {results.columns.map((column, columnIndex) => (
                      <td key={`${column}-${columnIndex}`}>{String(row[columnIndex] ?? '')}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  )
}
