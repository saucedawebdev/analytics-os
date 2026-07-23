import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Button } from '@/components/ui/Button'
import { Input, Select, Textarea } from '@/components/ui/Field'
import { Badge, EmptyState, PageHeader, Panel } from '@/components/ui/Panel'
import { allBuiltinKnowledge } from '@/data/builtin'
import { db } from '@/db'
import { useUiStore } from '@/lib/ui-store'
import type { KnowledgeAnnotation, ReviewStatus } from '@/types'
import { confidenceLabel, formatDate, statusLabel, touchUpdated } from '@/utils'
import {
  CONFIDENCE_LEVELS,
  createAnnotation,
  duplicateKnowledge,
  REVIEW_STATUSES,
  runSave,
  splitCsv,
  joinCsv,
} from '@/pages/pageUtils'
import { linkRecords, logActivity, trackRecent } from '@/services/data-service'

export default function KnowledgeDetailPage() {
  const { id = '' } = useParams()
  const setSaveStatus = useUiStore((s) => s.setSaveStatus)
  const knowledge = useMemo(() => allBuiltinKnowledge(), [])
  const entry = knowledge.find((item) => item.id === id)
  const related = entry ? knowledge.filter((item) => entry.relatedTopicIds.includes(item.id)) : []
  const [annotation, setAnnotation] = useState<KnowledgeAnnotation>(() => createAnnotation(id))
  const [message, setMessage] = useState('')

  const load = useCallback(async () => {
    if (!entry) return
    const existing = await db.knowledgeAnnotations.where('knowledgeId').equals(entry.id).first()
    setAnnotation(existing ?? createAnnotation(entry.id))
    await trackRecent('builtin_knowledge', entry.id, entry.title)
  }, [entry])

  useEffect(() => {
    void load()
  }, [load])

  if (!entry) {
    return (
      <div className="page">
        <PageHeader title="Knowledge not found" actions={<Link to="/library">Back to library</Link>} />
        <EmptyState title="Missing entry" description="This built-in topic is not available." />
      </div>
    )
  }

  const currentEntry = entry

  function patchAnnotation(patch: Partial<KnowledgeAnnotation>) {
    setAnnotation((current) => ({ ...current, ...patch }))
  }

  async function saveAnnotation() {
    await runSave(setSaveStatus, async () => {
      const next = annotation.createdAt ? touchUpdated(annotation) : createAnnotation(currentEntry.id)
      await db.knowledgeAnnotations.put(next)
      await logActivity('knowledge.annotated', `Updated knowledge notes: ${currentEntry.title}`, {
        type: 'builtin_knowledge',
        id: currentEntry.id,
      })
      setAnnotation(next)
      setMessage('Annotation saved.')
    })
  }

  async function duplicateToPersonal() {
    await runSave(setSaveStatus, async () => {
      const copy = duplicateKnowledge(currentEntry)
      copy.personalNotes = annotation.personalNotes
      copy.confidence = annotation.confidence
      copy.reviewStatus = annotation.reviewStatus
      copy.favorite = annotation.favorite
      copy.tags = annotation.tags
      await db.personalKnowledge.add(copy)
      await linkRecords(
        { type: 'builtin_knowledge', id: currentEntry.id },
        { type: 'personal_knowledge', id: copy.id },
        'duplicated_to_personal',
      )
      await logActivity('knowledge.duplicated', `Duplicated built-in knowledge: ${currentEntry.title}`, {
        type: 'personal_knowledge',
        id: copy.id,
      })
      setMessage(`Created personal copy "${copy.title}".`)
    })
  }

  return (
    <div className="page">
      <PageHeader
        title={currentEntry.title}
        subtitle={`${currentEntry.category} · ${currentEntry.subcategory} · ${statusLabel(currentEntry.difficulty)}`}
        breadcrumbs={<Breadcrumbs items={[{ label: 'Library', to: '/library' }, { label: currentEntry.title }]} />}
        actions={
          <div className="row-wrap">
            <Button onClick={() => patchAnnotation({ favorite: !annotation.favorite })}>
              {annotation.favorite ? 'Unfavorite' : 'Favorite'}
            </Button>
            <Button variant="primary" onClick={() => void saveAnnotation()}>
              Save annotation
            </Button>
            <Button variant="secondary" onClick={() => void duplicateToPersonal()}>
              Duplicate to personal
            </Button>
          </div>
        }
      />

      {message ? <p className="list-item-meta">{message}</p> : null}

      <div className="grid-2">
        <Panel title="Reference">
          <Section title="Summary" body={currentEntry.summary} />
          <Section title="What it does" body={currentEntry.whatItDoes} />
          <Section title="Why it matters" body={currentEntry.whyItMatters} />
          <Section title="When to use" body={currentEntry.whenToUse} />
          <Section title="Syntax or formula" body={currentEntry.syntaxOrFormula} mono />
          <Section title="Business example" body={currentEntry.businessExample} />
          <Section title="Worked example" body={currentEntry.workedExample} />
          <Section title="Common mistakes" body={currentEntry.commonMistakes} />
          <Section title="Best practices" body={currentEntry.bestPractices} />
          <Section title="Practice prompt" body={currentEntry.practicePrompt} />
          <Section title="Interview question" body={currentEntry.interviewQuestion} />
        </Panel>

        <div>
          <Panel title="Your annotation">
            <div className="grid-2">
              <label className="field">
                <span className="label">Confidence</span>
                <Select
                  value={annotation.confidence}
                  onChange={(event) => patchAnnotation({ confidence: event.target.value as KnowledgeAnnotation['confidence'] })}
                >
                  {CONFIDENCE_LEVELS.map((value) => (
                    <option key={value} value={value}>
                      {confidenceLabel(value)}
                    </option>
                  ))}
                </Select>
              </label>
              <label className="field">
                <span className="label">Review status</span>
                <Select
                  value={annotation.reviewStatus}
                  onChange={(event) => patchAnnotation({ reviewStatus: event.target.value as ReviewStatus })}
                >
                  {REVIEW_STATUSES.map((value) => (
                    <option key={value} value={value}>
                      {statusLabel(value)}
                    </option>
                  ))}
                </Select>
              </label>
            </div>
            <label className="field">
              <span className="label">Tags</span>
              <Input value={joinCsv(annotation.tags)} onChange={(event) => patchAnnotation({ tags: splitCsv(event.target.value) })} />
            </label>
            <label className="field">
              <span className="label">Notes</span>
              <Textarea value={annotation.personalNotes} onChange={(event) => patchAnnotation({ personalNotes: event.target.value })} rows={10} />
            </label>
            <p className="list-item-meta">Updated {formatDate(annotation.updatedAt)}</p>
          </Panel>

          <Panel title="Related topics">
            {related.length === 0 ? (
              <EmptyState title="No related topics" description="This entry has no built-in related topics." />
            ) : (
              <div className="list">
                {related.map((item) => (
                  <Link key={item.id} className="list-item" to={`/library/${item.id}`}>
                    <div className="spacer">
                      <p className="list-item-title">{item.title}</p>
                      <p className="list-item-meta">{item.summary}</p>
                    </div>
                    <Badge>{statusLabel(item.difficulty)}</Badge>
                  </Link>
                ))}
              </div>
            )}
          </Panel>
        </div>
      </div>
    </div>
  )
}

function Section({ title, body, mono }: { title: string; body: string; mono?: boolean }) {
  if (!body) return null
  return (
    <section style={{ marginBottom: 18 }}>
      <h3 style={{ marginBottom: 6 }}>{title}</h3>
      <p className={mono ? 'mono' : undefined} style={{ whiteSpace: 'pre-wrap' }}>
        {body}
      </p>
    </section>
  )
}
