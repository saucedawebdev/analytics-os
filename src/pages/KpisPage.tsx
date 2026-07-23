import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Button } from '@/components/ui/Button'
import { Field, Input, Select } from '@/components/ui/Field'
import { Badge, EmptyState, PageHeader, Panel } from '@/components/ui/Panel'
import { db } from '@/db'
import { builtinKpis } from '@/data/builtin'
import { useLiveQuery } from '@/hooks/useLiveQuery'
import { logActivity } from '@/services/data-service'
import type { KPI } from '@/types'
import { timestamps } from '@/utils'
import { includesText } from '@/pages/page-utils'

export default function KpisPage() {
  const [search, setSearch] = useState('')
  const [industry, setIndustry] = useState('All')
  const [refresh, setRefresh] = useState(0)
  const loadKpis = useCallback(async () => {
    const stored = await db.kpis.toArray()
    const byId = new Map<string, KPI>()
    for (const kpi of builtinKpis) byId.set(kpi.id, kpi)
    for (const kpi of stored) byId.set(kpi.id, kpi)
    return Array.from(byId.values()).sort((a, b) => a.name.localeCompare(b.name))
  }, [refresh])
  const kpis = useLiveQuery(loadKpis, [], builtinKpis)

  const industries = useMemo(() => {
    const all = new Set<string>()
    for (const kpi of kpis) {
      for (const part of kpi.industry.split(',')) {
        const trimmed = part.trim()
        if (trimmed) all.add(trimmed)
      }
    }
    return ['All', ...Array.from(all).sort()]
  }, [kpis])

  const filtered = useMemo(
    () =>
      kpis.filter(
        (kpi) =>
          (industry === 'All' || kpi.industry.toLowerCase().includes(industry.toLowerCase())) &&
          includesText(
            search,
            kpi.name,
            kpi.category,
            kpi.industry,
            kpi.definition,
            kpi.formula,
            ...(kpi.tags ?? []),
          ),
      ),
    [industry, kpis, search],
  )

  async function createKpi() {
    const name = window.prompt('KPI name')
    if (!name?.trim()) return
    const kpi: KPI = {
      ...timestamps(),
      name: name.trim(),
      definition: '',
      formula: '',
      purpose: '',
      whenToUse: '',
      interpretation: '',
      example: '',
      relatedCharts: '',
      commonMistakes: '',
      relatedKpiIds: [],
      industry: '',
      personalNotes: '',
      isBuiltIn: false,
      category: 'Personal',
    }
    await db.kpis.add(kpi)
    await logActivity('kpi', `Created KPI ${kpi.name}`, { type: 'kpi', id: kpi.id })
    setRefresh((v) => v + 1)
  }

  return (
    <div className="page stack">
      <PageHeader
        title="KPIs"
        subtitle="Metric definitions, formulas, interpretation notes, and industry examples."
        breadcrumbs={<Breadcrumbs items={[{ label: 'KPIs' }]} />}
        actions={
          <Button variant="primary" onClick={() => void createKpi()}>
            New KPI
          </Button>
        }
      />

      <Panel>
        <div className="grid-2">
          <Field label="Search KPIs">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search retention, margin, healthcare..."
            />
          </Field>
          <Field label="Industry filter">
            <Select value={industry} onChange={(event) => setIndustry(event.target.value)}>
              {industries.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </Panel>

      <Panel
        title={`${filtered.length} KPI${filtered.length === 1 ? '' : 's'}`}
        action={<Badge tone="builtin">{kpis.filter((k) => k.isBuiltIn).length} built-in</Badge>}
      >
        {filtered.length === 0 ? (
          <EmptyState
            title="No KPIs found"
            description="Try another industry, broaden the search, or create a personal KPI."
            action={<Button onClick={() => void createKpi()}>Create KPI</Button>}
          />
        ) : (
          <div className="grid-3">
            {filtered.map((kpi) => (
              <Link key={kpi.id} to={`/kpis/${kpi.id}`} className="panel stack">
                <div className="row-wrap">
                  <h3 className="list-item-title">{kpi.name}</h3>
                  <Badge tone={kpi.isBuiltIn ? 'builtin' : 'accent'}>
                    {kpi.isBuiltIn ? 'Built-in' : 'Personal'}
                  </Badge>
                </div>
                <p className="list-item-meta">{kpi.definition || 'No definition yet'}</p>
                <p className="mono" style={{ color: 'var(--accent)' }}>
                  {kpi.formula || 'Formula not defined'}
                </p>
                <div className="row-wrap">
                  <Badge>{kpi.category}</Badge>
                  {kpi.industry ? <Badge>{kpi.industry}</Badge> : null}
                </div>
              </Link>
            ))}
          </div>
        )}
      </Panel>
    </div>
  )
}
