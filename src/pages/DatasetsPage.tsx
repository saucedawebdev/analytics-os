import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Field'
import { Badge, EmptyState, PageHeader, Panel } from '@/components/ui/Panel'
import { db } from '@/db'
import type { Dataset, QualityStatus } from '@/types'
import { formatDate, statusLabel } from '@/utils'
import { QUALITY_STATUSES } from '@/pages/pageUtils'
import { trackRecent } from '@/services/data-service'

type QualityFilter = QualityStatus | 'all'

export default function DatasetsPage() {
  const [datasets, setDatasets] = useState<Dataset[]>([])
  const [quality, setQuality] = useState<QualityFilter>('all')
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    setDatasets(await db.datasets.orderBy('updatedAt').reverse().toArray())
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return datasets.filter((dataset) => {
      const matchesQuality = quality === 'all' || dataset.qualityStatus === quality
      const matchesSearch =
        !q ||
        [dataset.name, dataset.description, dataset.source, dataset.owner, dataset.grain, ...(dataset.tags ?? [])]
          .join(' ')
          .toLowerCase()
          .includes(q)
      return matchesQuality && matchesSearch
    })
  }, [datasets, quality, search])

  return (
    <div className="page">
      <PageHeader
        title="Datasets"
        subtitle="Catalog data sources, profile CSVs, track columns, and record cleaning work."
        actions={
          <Link to="/datasets/new">
            <Button variant="primary">Add dataset</Button>
          </Link>
        }
      />

      <Panel>
        <div className="row-wrap">
          <label className="field">
            <span className="label">Search</span>
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search datasets" />
          </label>
          <label className="field">
            <span className="label">Quality</span>
            <Select value={quality} onChange={(event) => setQuality(event.target.value as QualityFilter)}>
              <option value="all">All quality statuses</option>
              {QUALITY_STATUSES.map((value) => (
                <option key={value} value={value}>
                  {statusLabel(value)}
                </option>
              ))}
            </Select>
          </label>
        </div>
      </Panel>

      <Panel title={`${filtered.length} dataset${filtered.length === 1 ? '' : 's'}`}>
        {filtered.length === 0 ? (
          <EmptyState
            title="No datasets found"
            description="Add a dataset or import a CSV profile."
            action={
              <Link to="/datasets/new">
                <Button variant="primary">Add dataset</Button>
              </Link>
            }
          />
        ) : (
          <div className="list">
            {filtered.map((dataset) => (
              <Link
                key={dataset.id}
                className="list-item"
                to={`/datasets/${dataset.id}`}
                onClick={() => void trackRecent('dataset', dataset.id, dataset.name)}
              >
                <div className="spacer">
                  <p className="list-item-title">{dataset.name}</p>
                  <p className="list-item-meta">{dataset.description || dataset.source || 'No description yet'}</p>
                  <p className="list-item-meta">
                    {dataset.rowCount} rows · {dataset.columnCount} columns · Updated {formatDate(dataset.updatedAt)}
                  </p>
                </div>
                <div className="row-wrap">
                  <Badge>{statusLabel(dataset.fileType || 'dataset')}</Badge>
                  <Badge>{statusLabel(dataset.qualityStatus)}</Badge>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Panel>
    </div>
  )
}
