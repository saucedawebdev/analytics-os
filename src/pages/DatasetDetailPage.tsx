import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Button } from '@/components/ui/Button'
import { Field, Input, Select, Textarea } from '@/components/ui/Field'
import { ConfirmDialog } from '@/components/ui/Modal'
import { Badge, EmptyState, PageHeader, Panel } from '@/components/ui/Panel'
import { db } from '@/db'
import { useUiStore } from '@/lib/ui-store'
import type { Dataset, DatasetColumn, QualityStatus, Sensitivity } from '@/types'
import {
  createId,
  downloadText,
  formatDate,
  nowIso,
  parseCsv,
  statusLabel,
  touchUpdated,
} from '@/utils'
import {
  createDataset,
  dateInput,
  joinCsv,
  objectsToCsv,
  profileCsv,
  QUALITY_STATUSES,
  runSave,
  SENSITIVITIES,
  splitCsv,
  transformation,
} from '@/pages/pageUtils'
import { logActivity, trackRecent } from '@/services/data-service'

function rowsFromPreview(csvPreview: string): { headers: string[]; rows: string[][] } {
  return parseCsv(csvPreview)
}

function previewObjects(csvPreview: string): Record<string, string>[] {
  const parsed = rowsFromPreview(csvPreview)
  return parsed.rows.slice(0, 100).map((row) =>
    parsed.headers.reduce<Record<string, string>>((acc, header, index) => {
      acc[header || `column_${index + 1}`] = row[index] ?? ''
      return acc
    }, {}),
  )
}

export default function DatasetDetailPage() {
  const { id = 'new' } = useParams()
  const navigate = useNavigate()
  const setSaveStatus = useUiStore((s) => s.setSaveStatus)
  const [dataset, setDataset] = useState<Dataset>(() => createDataset())
  const [missing, setMissing] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [message, setMessage] = useState('')
  const isNew = id === 'new'

  const load = useCallback(async () => {
    if (isNew) {
      setDataset(createDataset())
      setMissing(false)
      return
    }
    const row = await db.datasets.get(id)
    if (!row) {
      setMissing(true)
      return
    }
    setDataset(row)
    setMissing(false)
    await trackRecent('dataset', row.id, row.name)
  }, [id, isNew])

  useEffect(() => {
    void load()
  }, [load])

  const previewRows = useMemo(() => previewObjects(dataset.csvPreview ?? ''), [dataset.csvPreview])

  function patchDataset(patch: Partial<Dataset>) {
    setDataset((current) => ({ ...current, ...patch }))
  }

  async function saveDataset() {
    await runSave(setSaveStatus, async () => {
      const next = isNew ? dataset : touchUpdated(dataset)
      await db.datasets.put(next)
      await logActivity(isNew ? 'dataset.created' : 'dataset.saved', `Saved dataset: ${next.name}`, {
        type: 'dataset',
        id: next.id,
      })
      await trackRecent('dataset', next.id, next.name)
      if (isNew) navigate(`/datasets/${next.id}`, { replace: true })
      else setDataset(next)
    })
  }

  async function duplicateDataset() {
    await runSave(setSaveStatus, async () => {
      const now = nowIso()
      const copy: Dataset = {
        ...dataset,
        id: createId(),
        name: `${dataset.name} (copy)`,
        createdAt: now,
        updatedAt: now,
        recordVersion: 1,
        columns: dataset.columns.map((column) => ({ ...column, id: createId() })),
        transformations: dataset.transformations.map((item) => ({ ...item, id: createId() })),
      }
      await db.datasets.add(copy)
      await logActivity('dataset.duplicated', `Duplicated dataset: ${dataset.name}`, {
        type: 'dataset',
        id: copy.id,
      })
      await trackRecent('dataset', copy.id, copy.name)
      navigate(`/datasets/${copy.id}`)
    })
  }

  async function deleteDataset() {
    await runSave(setSaveStatus, async () => {
      await db.datasets.delete(dataset.id)
      await logActivity('dataset.deleted', `Deleted dataset: ${dataset.name}`)
      navigate('/datasets')
    })
  }

  async function importCsv(file: File) {
    const text = await file.text()
    const parsed = parseCsv(text)
    const profile = profileCsv(parsed.headers, parsed.rows)
    patchDataset({
      name: dataset.name === 'Untitled dataset' ? file.name.replace(/\.[^.]+$/, '') : dataset.name,
      fileType: 'csv',
      location: file.name,
      rowCount: profile.rowCount,
      columnCount: profile.columnCount,
      columns: profile.columns,
      profileSummary: profile.summary,
      csvPreview: text,
      qualityStatus: profile.columns.some((column) => (column.missingCount ?? 0) > 0) ? 'needs_attention' : 'good',
    })
    setMessage(`Profiled ${profile.rowCount} rows and ${profile.columnCount} columns from ${file.name}.`)
    await logActivity('dataset.profiled', `Profiled CSV: ${file.name}`)
  }

  function addColumn() {
    const column: DatasetColumn = {
      id: createId(),
      name: 'new_column',
      dataType: 'text',
      description: '',
      businessMeaning: '',
      exampleValue: '',
      allowedValues: '',
      nullable: true,
      isKey: false,
      knownIssues: '',
      missingCount: 0,
      uniqueCount: 0,
    }
    patchDataset({ columns: [...dataset.columns, column], columnCount: dataset.columns.length + 1 })
  }

  function updateColumn(column: DatasetColumn, patch: Partial<DatasetColumn>) {
    patchDataset({
      columns: dataset.columns.map((item) => (item.id === column.id ? { ...item, ...patch } : item)),
    })
  }

  function applyTrim() {
    const parsed = rowsFromPreview(dataset.csvPreview ?? '')
    if (parsed.headers.length === 0) return
    const nextRows = parsed.rows.map((row) => row.map((cell) => cell.trim()))
    const csvPreview = objectsToCsv(
      nextRows.map((row) =>
        parsed.headers.reduce<Record<string, string>>((acc, header, index) => {
          acc[header || `column_${index + 1}`] = row[index] ?? ''
          return acc
        }, {}),
      ),
    )
    patchDataset({
      csvPreview,
      transformations: [...dataset.transformations, transformation('trim')],
      cleaningLog: [...dataset.cleaningLog, `Trimmed whitespace on ${formatDate(nowIso())}`],
    })
  }

  function applyRemoveDuplicates() {
    const parsed = rowsFromPreview(dataset.csvPreview ?? '')
    if (parsed.headers.length === 0) return
    const seen = new Set<string>()
    const rows = parsed.rows.filter((row) => {
      const key = JSON.stringify(row)
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    const csvPreview = objectsToCsv(
      rows.map((row) =>
        parsed.headers.reduce<Record<string, string>>((acc, header, index) => {
          acc[header || `column_${index + 1}`] = row[index] ?? ''
          return acc
        }, {}),
      ),
    )
    patchDataset({
      rowCount: rows.length,
      csvPreview,
      transformations: [...dataset.transformations, transformation('remove_duplicates')],
      cleaningLog: [...dataset.cleaningLog, `Removed duplicate preview rows on ${formatDate(nowIso())}`],
    })
  }

  if (missing) {
    return (
      <div className="page">
        <PageHeader title="Dataset not found" actions={<Link to="/datasets">Back to datasets</Link>} />
        <EmptyState title="Missing dataset" description="This dataset was deleted or is unavailable." />
      </div>
    )
  }

  return (
    <div className="page">
      <PageHeader
        title={isNew ? 'New dataset' : dataset.name}
        subtitle={isNew ? 'Catalog or profile a dataset.' : `Updated ${formatDate(dataset.updatedAt)}`}
        breadcrumbs={<Breadcrumbs items={[{ label: 'Datasets', to: '/datasets' }, { label: isNew ? 'New' : dataset.name }]} />}
        actions={
          <div className="row-wrap">
            <Button variant="ghost" onClick={() => downloadText(`${dataset.name || 'dataset'}.csv`, dataset.csvPreview ?? '', 'text/csv')} disabled={!dataset.csvPreview}>
              Export CSV
            </Button>
            {!isNew ? <Button onClick={() => void duplicateDataset()}>Duplicate</Button> : null}
            {!isNew ? (
              <Button variant="danger" onClick={() => setDeleteOpen(true)}>
                Delete
              </Button>
            ) : null}
            <Button variant="primary" onClick={() => void saveDataset()}>
              Save dataset
            </Button>
          </div>
        }
      />

      {message ? <p className="list-item-meta">{message}</p> : null}

      <Panel title="Overview">
        <div className="grid-2">
          <Field label="Name" htmlFor="name">
            <Input id="name" value={dataset.name} onChange={(event) => patchDataset({ name: event.target.value })} />
          </Field>
          <Field label="CSV import" htmlFor="csvImport">
            <Input id="csvImport" type="file" accept=".csv,text/csv" onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) void importCsv(file)
            }} />
          </Field>
          <Field label="Description" htmlFor="description">
            <Textarea id="description" value={dataset.description} onChange={(event) => patchDataset({ description: event.target.value })} rows={4} />
          </Field>
          <Field label="Source" htmlFor="source">
            <Input id="source" value={dataset.source} onChange={(event) => patchDataset({ source: event.target.value })} />
          </Field>
          <Field label="Owner" htmlFor="owner">
            <Input id="owner" value={dataset.owner} onChange={(event) => patchDataset({ owner: event.target.value })} />
          </Field>
          <Field label="File type" htmlFor="fileType">
            <Input id="fileType" value={dataset.fileType} onChange={(event) => patchDataset({ fileType: event.target.value })} />
          </Field>
          <Field label="Location" htmlFor="location">
            <Input id="location" value={dataset.location} onChange={(event) => patchDataset({ location: event.target.value })} />
          </Field>
          <Field label="Refresh frequency" htmlFor="refreshFrequency">
            <Input id="refreshFrequency" value={dataset.refreshFrequency} onChange={(event) => patchDataset({ refreshFrequency: event.target.value })} />
          </Field>
          <Field label="Date range start" htmlFor="dateRangeStart">
            <Input id="dateRangeStart" type="date" value={dateInput(dataset.dateRangeStart)} onChange={(event) => patchDataset({ dateRangeStart: event.target.value })} />
          </Field>
          <Field label="Date range end" htmlFor="dateRangeEnd">
            <Input id="dateRangeEnd" type="date" value={dateInput(dataset.dateRangeEnd)} onChange={(event) => patchDataset({ dateRangeEnd: event.target.value })} />
          </Field>
          <Field label="Row count" htmlFor="rowCount">
            <Input id="rowCount" type="number" value={dataset.rowCount} onChange={(event) => patchDataset({ rowCount: Number(event.target.value) })} />
          </Field>
          <Field label="Column count" htmlFor="columnCount">
            <Input id="columnCount" type="number" value={dataset.columnCount} onChange={(event) => patchDataset({ columnCount: Number(event.target.value) })} />
          </Field>
          <Field label="Grain" htmlFor="grain">
            <Input id="grain" value={dataset.grain} onChange={(event) => patchDataset({ grain: event.target.value })} />
          </Field>
          <Field label="Primary key" htmlFor="primaryKey">
            <Input id="primaryKey" value={dataset.primaryKey} onChange={(event) => patchDataset({ primaryKey: event.target.value })} />
          </Field>
          <Field label="Related tables" htmlFor="relatedTables">
            <Input id="relatedTables" value={joinCsv(dataset.relatedTables)} onChange={(event) => patchDataset({ relatedTables: splitCsv(event.target.value) })} />
          </Field>
          <Field label="Quality status" htmlFor="qualityStatus">
            <Select id="qualityStatus" value={dataset.qualityStatus} onChange={(event) => patchDataset({ qualityStatus: event.target.value as QualityStatus })}>
              {QUALITY_STATUSES.map((value) => (
                <option key={value} value={value}>{statusLabel(value)}</option>
              ))}
            </Select>
          </Field>
          <Field label="Sensitivity" htmlFor="sensitivity">
            <Select id="sensitivity" value={dataset.sensitivity} onChange={(event) => patchDataset({ sensitivity: event.target.value as Sensitivity })}>
              {SENSITIVITIES.map((value) => (
                <option key={value} value={value}>{statusLabel(value)}</option>
              ))}
            </Select>
          </Field>
          <Field label="Tags" htmlFor="tags">
            <Input id="tags" value={joinCsv(dataset.tags)} onChange={(event) => patchDataset({ tags: splitCsv(event.target.value) })} />
          </Field>
        </div>
        <Field label="Known issues" htmlFor="knownIssues">
          <Textarea id="knownIssues" value={dataset.knownIssues} onChange={(event) => patchDataset({ knownIssues: event.target.value })} rows={3} />
        </Field>
        <Field label="Notes" htmlFor="notes">
          <Textarea id="notes" value={dataset.notes} onChange={(event) => patchDataset({ notes: event.target.value })} rows={3} />
        </Field>
      </Panel>

      <Panel title="Profile summary">
        <Textarea value={dataset.profileSummary ?? ''} onChange={(event) => patchDataset({ profileSummary: event.target.value })} rows={8} />
      </Panel>

      <Panel title="Columns" action={<Button size="sm" onClick={addColumn}>Add column</Button>}>
        {dataset.columns.length === 0 ? (
          <EmptyState title="No columns" description="Import CSV or add columns manually." />
        ) : (
          <div className="list">
            {dataset.columns.map((column) => (
              <div key={column.id} className="list-item" style={{ display: 'block' }}>
                <div className="grid-2">
                  <Field label="Name">
                    <Input value={column.name} onChange={(event) => updateColumn(column, { name: event.target.value })} />
                  </Field>
                  <Field label="Data type">
                    <Input value={column.dataType} onChange={(event) => updateColumn(column, { dataType: event.target.value })} />
                  </Field>
                  <Field label="Business meaning">
                    <Textarea value={column.businessMeaning} onChange={(event) => updateColumn(column, { businessMeaning: event.target.value })} rows={2} />
                  </Field>
                  <Field label="Description">
                    <Textarea value={column.description} onChange={(event) => updateColumn(column, { description: event.target.value })} rows={2} />
                  </Field>
                  <Field label="Example value">
                    <Input value={column.exampleValue} onChange={(event) => updateColumn(column, { exampleValue: event.target.value })} />
                  </Field>
                  <Field label="Allowed values">
                    <Input value={column.allowedValues} onChange={(event) => updateColumn(column, { allowedValues: event.target.value })} />
                  </Field>
                  <Field label="Known issues">
                    <Input value={column.knownIssues} onChange={(event) => updateColumn(column, { knownIssues: event.target.value })} />
                  </Field>
                  <div className="row-wrap">
                    <Badge>{column.missingCount ?? 0} missing</Badge>
                    <Badge>{column.uniqueCount ?? 0} unique</Badge>
                    <label className="row">
                      <input type="checkbox" checked={column.nullable} onChange={(event) => updateColumn(column, { nullable: event.target.checked })} />
                      Nullable
                    </label>
                    <label className="row">
                      <input type="checkbox" checked={column.isKey} onChange={(event) => updateColumn(column, { isKey: event.target.checked })} />
                      Key
                    </label>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => patchDataset({ columns: dataset.columns.filter((item) => item.id !== column.id), columnCount: Math.max(0, dataset.columns.length - 1) })}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <div className="grid-2">
        <Panel title="Cleaning actions">
          <div className="row-wrap">
            <Button onClick={applyTrim} disabled={!dataset.csvPreview}>Trim whitespace</Button>
            <Button onClick={applyRemoveDuplicates} disabled={!dataset.csvPreview}>Remove duplicates</Button>
          </div>
          <div className="list" style={{ marginTop: 12 }}>
            {dataset.transformations.map((item) => (
              <div key={item.id} className="list-item">
                <div>
                  <p className="list-item-title">{statusLabel(item.type)}</p>
                  <p className="list-item-meta">{formatDate(item.appliedAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Cleaning log">
          <Textarea
            value={dataset.cleaningLog.join('\n')}
            onChange={(event) => patchDataset({ cleaningLog: event.target.value.split('\n').filter(Boolean) })}
            rows={10}
          />
        </Panel>
      </div>

      <Panel title="CSV preview">
        {previewRows.length === 0 ? (
          <EmptyState title="No preview" description="Import a CSV to store preview rows." />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  {Object.keys(previewRows[0] ?? {}).map((header) => (
                    <th key={header}>{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewRows.map((row, rowIndex) => (
                  <tr key={`preview-${rowIndex}`}>
                    {Object.entries(row).map(([key, value]) => (
                      <td key={`${rowIndex}-${key}`}>{value}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <div className="row-wrap">
        <Badge>{statusLabel(dataset.qualityStatus)}</Badge>
        <Badge>{statusLabel(dataset.sensitivity)}</Badge>
        <Badge>{dataset.rowCount} rows</Badge>
        <Badge>{dataset.columnCount} columns</Badge>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        title="Delete dataset?"
        message="This removes the dataset catalog entry and stored CSV preview."
        confirmLabel="Delete"
        danger
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => void deleteDataset()}
      />
    </div>
  )
}
