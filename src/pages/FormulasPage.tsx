import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Button } from '@/components/ui/Button'
import { Field, Input } from '@/components/ui/Field'
import { Badge, EmptyState, PageHeader, Panel } from '@/components/ui/Panel'
import { db } from '@/db'
import { builtinFormulas } from '@/data/builtin'
import type { Formula } from '@/types'
import { useLiveQuery } from '@/hooks/useLiveQuery'
import { includesText, PillButton } from '@/pages/page-utils'
import { logActivity } from '@/services/data-service'
import { timestamps } from '@/utils'

type FormulaCategory = Formula['category'] | 'All'

const CATEGORIES: FormulaCategory[] = ['All', 'Excel', 'Statistics', 'Other']

export default function FormulasPage() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<FormulaCategory>('All')
  const [refresh, setRefresh] = useState(0)
  const loadFormulas = useCallback(async () => {
    const stored = await db.formulas.toArray()
    const byId = new Map<string, Formula>()
    for (const formula of builtinFormulas) byId.set(formula.id, formula)
    for (const formula of stored) byId.set(formula.id, formula)
    return Array.from(byId.values()).sort((a, b) => a.name.localeCompare(b.name))
  }, [refresh])
  const formulas = useLiveQuery(loadFormulas, [], builtinFormulas)

  const filtered = useMemo(
    () =>
      formulas.filter(
        (formula) =>
          (category === 'All' || formula.category === category) &&
          includesText(
            search,
            formula.name,
            formula.category,
            formula.subcategory,
            formula.description,
            formula.syntax,
            ...(formula.tags ?? []),
          ),
      ),
    [category, formulas, search],
  )

  async function createFormula() {
    const name = window.prompt('Formula name')
    if (!name?.trim()) return
    const formula: Formula = {
      ...timestamps(),
      name: name.trim(),
      category: 'Other',
      subcategory: 'Personal',
      syntax: '',
      description: '',
      purpose: '',
      whenToUse: '',
      example: '',
      commonMistakes: '',
      relatedFormulaIds: [],
      personalNotes: '',
      isBuiltIn: false,
      difficulty: 'beginner',
    }
    await db.formulas.add(formula)
    await logActivity('formula', `Created formula ${formula.name}`, {
      type: 'formula',
      id: formula.id,
    })
    setRefresh((v) => v + 1)
  }

  return (
    <div className="page stack">
      <PageHeader
        title="Formulas"
        subtitle="Excel and statistics formulas with examples, pitfalls, and personal notes."
        breadcrumbs={<Breadcrumbs items={[{ label: 'Formulas' }]} />}
        actions={
          <Button variant="primary" onClick={() => void createFormula()}>
            New formula
          </Button>
        }
      />

      <Panel>
        <div className="stack">
          <Field label="Search formulas">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search SUMIFS, z-score, regression..."
            />
          </Field>
          <div className="tabs" role="tablist" aria-label="Formula categories">
            {CATEGORIES.map((item) => (
              <PillButton key={item} active={category === item} onClick={() => setCategory(item)}>
                {item}
              </PillButton>
            ))}
          </div>
        </div>
      </Panel>

      <Panel
        title={`${filtered.length} formula${filtered.length === 1 ? '' : 's'}`}
        action={<Badge tone="builtin">{formulas.filter((f) => f.isBuiltIn).length} built-in</Badge>}
      >
        {filtered.length === 0 ? (
          <EmptyState
            title="No formulas found"
            description="Try a broader search or create a personal formula."
            action={<Button onClick={() => void createFormula()}>Create formula</Button>}
          />
        ) : (
          <div className="grid-3">
            {filtered.map((formula) => (
              <Link key={formula.id} to={`/formulas/${formula.id}`} className="panel stack">
                <div className="row-wrap">
                  <h3 className="list-item-title">{formula.name}</h3>
                  <Badge tone={formula.isBuiltIn ? 'builtin' : 'accent'}>
                    {formula.isBuiltIn ? 'Built-in' : 'Personal'}
                  </Badge>
                </div>
                <p className="mono" style={{ margin: 0, color: 'var(--accent)' }}>
                  {formula.syntax || 'No syntax yet'}
                </p>
                <p className="list-item-meta">{formula.description || formula.purpose}</p>
                <div className="row-wrap">
                  <Badge>{formula.category}</Badge>
                  <Badge>{formula.subcategory}</Badge>
                  <Badge>{formula.difficulty}</Badge>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Panel>
    </div>
  )
}
