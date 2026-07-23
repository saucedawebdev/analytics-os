import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Button } from '@/components/ui/Button'
import { Field, Input, Select, Textarea } from '@/components/ui/Field'
import { Badge, EmptyState, PageHeader, Panel } from '@/components/ui/Panel'
import { ConfirmDialog } from '@/components/ui/Modal'
import { db } from '@/db'
import { builtinFormulas } from '@/data/builtin'
import { logActivity, trackRecent } from '@/services/data-service'
import type { Difficulty, Formula } from '@/types'
import { useLiveQuery } from '@/hooks/useLiveQuery'
import { joinList, splitList, withUpdated } from '@/pages/page-utils'

const DIFFICULTIES: Difficulty[] = ['beginner', 'intermediate', 'advanced']

export default function FormulaDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const [refresh, setRefresh] = useState(0)
  const [draft, setDraft] = useState<Formula | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const loadFormula = useCallback(async () => {
    const stored = await db.formulas.get(id)
    return stored ?? builtinFormulas.find((formula) => formula.id === id) ?? null
  }, [id, refresh])
  const formula = useLiveQuery(loadFormula, [], null as Formula | null)

  useEffect(() => {
    setDraft(formula)
    if (formula) void trackRecent('formula', formula.id, formula.name)
  }, [formula])

  if (!formula || !draft) {
    return (
      <div className="page stack">
        <PageHeader
          title="Formula not found"
          breadcrumbs={<Breadcrumbs items={[{ label: 'Formulas', to: '/formulas' }, { label: 'Missing' }]} />}
        />
        <EmptyState
          title="No formula found"
          description="The formula may have been deleted or the built-in content has not loaded yet."
          action={<Button onClick={() => navigate('/formulas')}>Back to formulas</Button>}
        />
      </div>
    )
  }

  async function saveNotes() {
    const currentFormula = formula!
    const currentDraft = draft!
    const current = await db.formulas.get(currentFormula.id)
    const next = withUpdated<Formula>({
      ...(current ?? currentFormula),
      personalNotes: currentDraft.personalNotes,
    })
    await db.formulas.put(next)
    await logActivity('formula', `Updated notes for ${next.name}`, {
      type: 'formula',
      id: next.id,
    })
    setRefresh((v) => v + 1)
  }

  async function savePersonalFormula() {
    const currentDraft = draft!
    if (currentDraft.isBuiltIn) return
    const next = withUpdated<Formula>({
      ...currentDraft,
      name: currentDraft.name.trim() || 'Untitled formula',
    })
    await db.formulas.put(next)
    await logActivity('formula', `Updated formula ${next.name}`, {
      type: 'formula',
      id: next.id,
    })
    setRefresh((v) => v + 1)
  }

  async function duplicateBuiltIn() {
    const currentFormula = formula!
    const currentDraft = draft!
    const copy: Formula = {
      ...currentFormula,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      recordVersion: 1,
      name: `${currentFormula.name} (personal copy)`,
      isBuiltIn: false,
      personalNotes: currentDraft.personalNotes,
    }
    await db.formulas.add(copy)
    await logActivity('formula', `Duplicated formula ${currentFormula.name}`, {
      type: 'formula',
      id: copy.id,
    })
    navigate(`/formulas/${copy.id}`)
  }

  async function deletePersonalFormula() {
    const currentFormula = formula!
    if (currentFormula.isBuiltIn) return
    await db.formulas.delete(currentFormula.id)
    await logActivity('formula', `Deleted formula ${currentFormula.name}`)
    navigate('/formulas')
  }

  return (
    <div className="page stack">
      <PageHeader
        title={formula.name}
        subtitle={`${formula.category} · ${formula.subcategory}`}
        breadcrumbs={<Breadcrumbs items={[{ label: 'Formulas', to: '/formulas' }, { label: formula.name }]} />}
        actions={
          <div className="row-wrap">
            <Badge tone={formula.isBuiltIn ? 'builtin' : 'accent'}>
              {formula.isBuiltIn ? 'Built-in' : 'Personal'}
            </Badge>
            {formula.isBuiltIn ? (
              <Button onClick={() => void duplicateBuiltIn()}>Make personal copy</Button>
            ) : (
              <Button variant="danger" onClick={() => setDeleteOpen(true)}>
                Delete
              </Button>
            )}
          </div>
        }
      />

      <div className="grid-2">
        <Panel title="Formula">
          <div className="stack">
            {draft.isBuiltIn ? (
              <>
                <p className="mono" style={{ color: 'var(--accent)' }}>
                  {formula.syntax}
                </p>
                <p>{formula.description}</p>
              </>
            ) : (
              <>
                <Field label="Name">
                  <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
                </Field>
                <div className="grid-2">
                  <Field label="Category">
                    <Select
                      value={draft.category}
                      onChange={(e) =>
                        setDraft({ ...draft, category: e.target.value as Formula['category'] })
                      }
                    >
                      <option value="Excel">Excel</option>
                      <option value="Statistics">Statistics</option>
                      <option value="Other">Other</option>
                    </Select>
                  </Field>
                  <Field label="Difficulty">
                    <Select
                      value={draft.difficulty}
                      onChange={(e) => setDraft({ ...draft, difficulty: e.target.value as Difficulty })}
                    >
                      {DIFFICULTIES.map((difficulty) => (
                        <option key={difficulty} value={difficulty}>
                          {difficulty}
                        </option>
                      ))}
                    </Select>
                  </Field>
                </div>
                <Field label="Subcategory">
                  <Input
                    value={draft.subcategory}
                    onChange={(e) => setDraft({ ...draft, subcategory: e.target.value })}
                  />
                </Field>
                <Field label="Syntax">
                  <Textarea value={draft.syntax} onChange={(e) => setDraft({ ...draft, syntax: e.target.value })} />
                </Field>
                <Field label="Description">
                  <Textarea
                    value={draft.description}
                    onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                  />
                </Field>
              </>
            )}
            <div className="row-wrap">
              <Badge>{formula.difficulty}</Badge>
              {(formula.tags ?? []).map((tag) => (
                <Badge key={tag}>{tag}</Badge>
              ))}
            </div>
          </div>
        </Panel>

        <Panel title="Personal notes">
          <div className="stack">
            <Textarea
              value={draft.personalNotes}
              onChange={(event) => setDraft({ ...draft, personalNotes: event.target.value })}
              placeholder="How you use this formula, edge cases, or examples from your work."
            />
            <Button variant="primary" onClick={() => void saveNotes()}>
              Save notes
            </Button>
          </div>
        </Panel>
      </div>

      <Panel title="Usage guide">
        <div className="grid-2">
          <div>
            <h3>Purpose</h3>
            <p>{draft.purpose || 'Add a purpose for this personal formula.'}</p>
          </div>
          <div>
            <h3>When to use</h3>
            <p>{draft.whenToUse || 'Add usage guidance.'}</p>
          </div>
          <div>
            <h3>Example</h3>
            {draft.isBuiltIn ? (
              <p>{draft.example}</p>
            ) : (
              <Textarea value={draft.example} onChange={(e) => setDraft({ ...draft, example: e.target.value })} />
            )}
          </div>
          <div>
            <h3>Common mistakes</h3>
            {draft.isBuiltIn ? (
              <p>{draft.commonMistakes}</p>
            ) : (
              <Textarea
                value={draft.commonMistakes}
                onChange={(e) => setDraft({ ...draft, commonMistakes: e.target.value })}
              />
            )}
          </div>
        </div>
        {!draft.isBuiltIn ? (
          <div className="stack" style={{ marginTop: 16 }}>
            <Field label="Related formula IDs (comma-separated)">
              <Input
                value={joinList(draft.relatedFormulaIds)}
                onChange={(e) => setDraft({ ...draft, relatedFormulaIds: splitList(e.target.value) })}
              />
            </Field>
            <Button variant="primary" onClick={() => void savePersonalFormula()}>
              Save formula
            </Button>
          </div>
        ) : null}
      </Panel>

      {formula.relatedFormulaIds.length > 0 ? (
        <Panel title="Related formulas">
          <div className="list">
            {formula.relatedFormulaIds.map((relatedId) => (
              <Link key={relatedId} to={`/formulas/${relatedId}`} className="list-item">
                {relatedId}
              </Link>
            ))}
          </div>
        </Panel>
      ) : null}

      <ConfirmDialog
        open={deleteOpen}
        title="Delete formula?"
        message="This permanently deletes your personal formula."
        confirmLabel="Delete"
        danger
        onConfirm={() => void deletePersonalFormula()}
        onClose={() => setDeleteOpen(false)}
      />
    </div>
  )
}
