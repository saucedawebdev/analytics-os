import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Button } from '@/components/ui/Button'
import { Field, Input, Textarea } from '@/components/ui/Field'
import { ConfirmDialog } from '@/components/ui/Modal'
import { Badge, EmptyState, PageHeader, Panel } from '@/components/ui/Panel'
import { db } from '@/db'
import { useUiStore } from '@/lib/ui-store'
import type { ThinkingAnswers, ThinkingSession } from '@/types'
import { createId, formatDate, nowIso, touchUpdated } from '@/utils'
import {
  createNote,
  createProject,
  createThinkingSession,
  runSave,
  thinkingPlan,
} from '@/pages/pageUtils'
import { linkRecords, logActivity, trackRecent } from '@/services/data-service'

type AnswerKey = keyof ThinkingAnswers
type Step = { title: string; description: string; fields: Array<{ key: AnswerKey; label: string }> }

const STEPS: Step[] = [
  {
    title: '1. Request',
    description: 'Clarify what was requested and who needs it.',
    fields: [
      { key: 'requested', label: 'What was requested?' },
      { key: 'whoRequested', label: 'Who requested this?' },
      { key: 'decisionSupported', label: 'What decision should this support?' },
      { key: 'actionFollow', label: 'What action may follow from the analysis?' },
    ],
  },
  {
    title: '2. Question',
    description: 'Turn the request into answerable questions.',
    fields: [
      { key: 'primaryQuestion', label: 'Primary question' },
      { key: 'supportingQuestions', label: 'Supporting questions' },
      { key: 'successMeaning', label: 'What would success mean?' },
      { key: 'ambiguousTerms', label: 'Ambiguous terms to define' },
    ],
  },
  {
    title: '3. Definitions',
    description: 'Define metrics, population, and boundaries.',
    fields: [
      { key: 'metricDefinitions', label: 'Metric definitions' },
      { key: 'populationIncluded', label: 'Population included' },
      { key: 'populationExcluded', label: 'Population excluded' },
      { key: 'timeframe', label: 'Timeframe' },
      { key: 'detailLevel', label: 'Required detail level' },
      { key: 'inclusions', label: 'Other inclusions' },
    ],
  },
  {
    title: '4. Data',
    description: 'List data sources, columns, joins, and gaps.',
    fields: [
      { key: 'datasetsNeeded', label: 'Datasets needed' },
      { key: 'columnsNeeded', label: 'Columns needed' },
      { key: 'joinsRequired', label: 'Joins required' },
      { key: 'missingData', label: 'Missing data concerns' },
    ],
  },
  {
    title: '5. Risks',
    description: 'Name assumptions and ways the analysis could mislead.',
    fields: [
      { key: 'assumptions', label: 'Assumptions' },
      { key: 'biasRisks', label: 'Bias risks' },
      { key: 'seasonality', label: 'Seasonality' },
      { key: 'duplicateRisk', label: 'Duplicate risk' },
      { key: 'misleadingMetric', label: 'Potentially misleading metric' },
    ],
  },
  {
    title: '6. Analysis',
    description: 'Plan calculations, SQL patterns, comparisons, and validation.',
    fields: [
      { key: 'calculations', label: 'Calculations' },
      { key: 'sqlPatterns', label: 'SQL patterns' },
      { key: 'comparisons', label: 'Comparisons' },
      { key: 'validationChecks', label: 'Validation checks' },
    ],
  },
  {
    title: '7. Communication',
    description: 'Choose audience, chart types, and recommendation shape.',
    fields: [
      { key: 'audience', label: 'Audience' },
      { key: 'audienceNeeds', label: 'Audience needs' },
      { key: 'chartTypes', label: 'Chart types' },
      { key: 'recommendation', label: 'Likely recommendation or decision options' },
    ],
  },
  {
    title: '8. Plan',
    description: 'Review the structured plan generated only from your answers.',
    fields: [],
  },
]

export default function ThinkingSessionPage() {
  const { id = 'new' } = useParams()
  const navigate = useNavigate()
  const setSaveStatus = useUiStore((s) => s.setSaveStatus)
  const [session, setSession] = useState<ThinkingSession>(() => createThinkingSession())
  const [missing, setMissing] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const isNew = id === 'new'

  const load = useCallback(async () => {
    if (isNew) {
      setSession(createThinkingSession())
      setMissing(false)
      return
    }
    const row = await db.thinkingSessions.get(id)
    if (!row) {
      setMissing(true)
      return
    }
    setSession(row)
    setMissing(false)
    await trackRecent('thinking_session', row.id, row.title)
  }, [id, isNew])

  useEffect(() => {
    void load()
  }, [load])

  const currentStep = Math.min(Math.max(session.currentStep, 0), STEPS.length - 1)
  const step = (STEPS[currentStep] ?? STEPS[0])!
  const plan = useMemo(() => thinkingPlan(session), [session])
  const progress = Math.round(((currentStep + 1) / STEPS.length) * 100)

  function patchSession(patch: Partial<ThinkingSession>) {
    setSession((current) => ({ ...current, ...patch }))
  }

  function patchAnswer(key: AnswerKey, value: string) {
    setSession((current) => ({
      ...current,
      answers: {
        ...current.answers,
        [key]: value,
      },
    }))
  }

  async function saveSession(patch: Partial<ThinkingSession> = {}) {
    await runSave(setSaveStatus, async () => {
      const merged = { ...session, ...patch }
      const next = isNew ? merged : touchUpdated(merged)
      await db.thinkingSessions.put(next)
      await logActivity(isNew ? 'thinking.created' : 'thinking.saved', `Saved thinking session: ${next.title}`, {
        type: 'thinking_session',
        id: next.id,
      })
      await trackRecent('thinking_session', next.id, next.title)
      if (isNew) navigate(`/thinking/${next.id}`, { replace: true })
      else setSession(next)
    })
  }

  async function moveStep(nextStep: number) {
    const bounded = Math.min(Math.max(nextStep, 0), STEPS.length - 1)
    patchSession({ currentStep: bounded })
    await saveSession({ currentStep: bounded })
  }

  async function completeSession() {
    await saveSession({ completed: true, currentStep: STEPS.length - 1 })
  }

  async function convertToProject() {
    await runSave(setSaveStatus, async () => {
      const now = nowIso()
      const project = {
        ...createProject('custom'),
        id: createId(),
        title: session.title,
        summary: session.answers.requested,
        originalRequest: session.answers.requested,
        businessDecision: session.answers.decisionSupported,
        primaryQuestion: session.answers.primaryQuestion,
        supportingQuestions: session.answers.supportingQuestions.split('\n').filter(Boolean),
        assumptions: session.answers.assumptions.split('\n').filter(Boolean),
        requiredFields: session.answers.columnsNeeded,
        missingData: session.answers.missingData,
        calculations: session.answers.calculations,
        validationSteps: session.answers.validationChecks,
        audience: session.answers.audience,
        chartNotes: session.answers.chartTypes,
        recommendations: session.answers.recommendation,
        createdAt: now,
        updatedAt: now,
      }
      await db.projects.add(project)
      const next = touchUpdated({ ...session, projectId: project.id })
      await db.thinkingSessions.put(next)
      await linkRecords({ type: 'thinking_session', id: session.id }, { type: 'project', id: project.id }, 'converted_to_project')
      await logActivity('thinking.converted_project', `Converted thinking session to project: ${project.title}`, {
        type: 'project',
        id: project.id,
      })
      await trackRecent('project', project.id, project.title)
      setSession(next)
      navigate(`/projects/${project.id}`)
    })
  }

  async function convertToNote() {
    await runSave(setSaveStatus, async () => {
      const now = nowIso()
      const note = {
        ...createNote('project_decision'),
        id: createId(),
        title: `${session.title} plan`,
        content: plan,
        createdAt: now,
        updatedAt: now,
      }
      await db.notes.add(note)
      const next = touchUpdated({ ...session, noteId: note.id })
      await db.thinkingSessions.put(next)
      await linkRecords({ type: 'thinking_session', id: session.id }, { type: 'note', id: note.id }, 'converted_to_note')
      await logActivity('thinking.converted_note', `Converted thinking session to note: ${note.title}`, {
        type: 'note',
        id: note.id,
      })
      await trackRecent('note', note.id, note.title)
      setSession(next)
      navigate(`/notes/${note.id}`)
    })
  }

  async function deleteSession() {
    await runSave(setSaveStatus, async () => {
      await db.thinkingSessions.delete(session.id)
      await logActivity('thinking.deleted', `Deleted thinking session: ${session.title}`)
      navigate('/thinking')
    })
  }

  if (missing) {
    return (
      <div className="page">
        <PageHeader title="Thinking session not found" actions={<Link to="/thinking">Back to Thinking Mode</Link>} />
        <EmptyState title="Missing session" description="This session was deleted or is unavailable." />
      </div>
    )
  }

  return (
    <div className="page">
      <PageHeader
        title={isNew ? 'New thinking session' : session.title}
        subtitle={isNew ? 'Answer each step to create a structured plan.' : `Updated ${formatDate(session.updatedAt)}`}
        breadcrumbs={<Breadcrumbs items={[{ label: 'Thinking Mode', to: '/thinking' }, { label: isNew ? 'New' : session.title }]} />}
        actions={
          <div className="row-wrap no-print">
            <Button variant="ghost" onClick={() => window.print()}>
              Print
            </Button>
            {!isNew ? (
              <Button variant="danger" onClick={() => setDeleteOpen(true)}>
                Delete
              </Button>
            ) : null}
            <Button variant="primary" onClick={() => void saveSession()}>
              Save session
            </Button>
          </div>
        }
      />

      <Panel title="Progress">
        <Field label="Session title" htmlFor="title">
          <Input id="title" value={session.title} onChange={(event) => patchSession({ title: event.target.value })} />
        </Field>
        <div style={{ height: 10, background: 'var(--bg-input)', borderRadius: 999, overflow: 'hidden' }}>
          <div style={{ width: `${progress}%`, height: '100%', background: 'var(--accent)' }} />
        </div>
        <div className="tabs no-print" style={{ marginTop: 12 }}>
          {STEPS.map((item, index) => (
            <Button
              key={item.title}
              size="sm"
              variant={index === currentStep ? 'primary' : 'ghost'}
              onClick={() => void moveStep(index)}
            >
              {index + 1}
            </Button>
          ))}
        </div>
        <div className="row-wrap" style={{ marginTop: 12 }}>
          <Badge tone={session.completed ? 'success' : 'warning'}>
            {session.completed ? 'Completed' : 'In progress'}
          </Badge>
          <Badge>{progress}%</Badge>
        </div>
      </Panel>

      <Panel title={step.title}>
        <p className="page-subtitle">{step.description}</p>
        {step.fields.length === 0 ? (
          <Textarea value={plan} readOnly rows={22} />
        ) : (
          <div className="grid-2">
            {step.fields.map((field) => (
              <Field key={field.key} label={field.label}>
                <Textarea
                  value={session.answers[field.key]}
                  onChange={(event) => patchAnswer(field.key, event.target.value)}
                  rows={5}
                />
              </Field>
            ))}
          </div>
        )}
      </Panel>

      <div className="row-wrap no-print">
        <Button onClick={() => void moveStep(currentStep - 1)} disabled={currentStep === 0}>
          Back
        </Button>
        {currentStep < STEPS.length - 1 ? (
          <Button variant="primary" onClick={() => void moveStep(currentStep + 1)}>
            Save and continue
          </Button>
        ) : (
          <Button variant="primary" onClick={() => void completeSession()}>
            Complete plan
          </Button>
        )}
        <Button onClick={() => void convertToProject()} disabled={!session.completed}>
          Convert to project
        </Button>
        <Button onClick={() => void convertToNote()} disabled={!session.completed}>
          Convert to note
        </Button>
      </div>

      <Panel title="Structured plan">
        <Textarea value={plan} readOnly rows={18} />
      </Panel>

      <ConfirmDialog
        open={deleteOpen}
        title="Delete thinking session?"
        message="This removes the session and its answers from local storage."
        confirmLabel="Delete"
        danger
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => void deleteSession()}
      />
    </div>
  )
}
