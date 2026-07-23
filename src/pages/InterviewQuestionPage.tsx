import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Button } from '@/components/ui/Button'
import { Field, Select, Textarea } from '@/components/ui/Field'
import { Badge, EmptyState, PageHeader, Panel } from '@/components/ui/Panel'
import { db } from '@/db'
import { builtinInterviewQuestions } from '@/data/builtin'
import { useLiveQuery } from '@/hooks/useLiveQuery'
import { logActivity, trackRecent } from '@/services/data-service'
import type { ConfidenceLevel, InterviewPractice, InterviewQuestion } from '@/types'
import { CONFIDENCE_LEVELS, copyText, withUpdated } from '@/pages/page-utils'
import { confidenceLabel, nowIso } from '@/utils'

type PracticeMode = 'flashcard' | 'written' | 'timed'

export default function InterviewQuestionPage() {
  const { id = '' } = useParams()
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const [refresh, setRefresh] = useState(0)
  const [draft, setDraft] = useState<InterviewQuestion | null>(null)
  const [showAnswer, setShowAnswer] = useState(false)
  const [response, setResponse] = useState('')
  const [rating, setRating] = useState<ConfidenceLevel>('developing')
  const [secondsLeft, setSecondsLeft] = useState(120)
  const mode = (params.get('mode') as PracticeMode | null) ?? 'flashcard'
  const loadQuestion = useCallback(async () => {
    const stored = await db.interviewQuestions.get(id)
    return stored ?? builtinInterviewQuestions.find((question) => question.id === id) ?? null
  }, [id, refresh])
  const question = useLiveQuery(loadQuestion, [], null as InterviewQuestion | null)

  useEffect(() => {
    setDraft(question)
    if (question) void trackRecent('interview_question', question.id, question.question)
  }, [question])

  useEffect(() => {
    if (mode !== 'timed' || secondsLeft <= 0) return
    const timer = window.setTimeout(() => setSecondsLeft((value) => Math.max(0, value - 1)), 1000)
    return () => window.clearTimeout(timer)
  }, [mode, secondsLeft])

  useEffect(() => {
    setShowAnswer(false)
    setResponse('')
    setSecondsLeft(120)
  }, [mode, id])

  if (!question || !draft) {
    return (
      <div className="page stack">
        <PageHeader
          title="Question not found"
          breadcrumbs={<Breadcrumbs items={[{ label: 'Interview Lab', to: '/interview' }, { label: 'Missing' }]} />}
        />
        <EmptyState
          title="No question found"
          description="The question may have been deleted or built-in content has not loaded yet."
          action={<Button onClick={() => navigate('/interview')}>Back to Interview Lab</Button>}
        />
      </div>
    )
  }

  async function saveQuestion() {
    const currentDraft = draft!
    const next = withUpdated<InterviewQuestion>(currentDraft)
    await db.interviewQuestions.put(next)
    await logActivity('interview', 'Updated interview question', {
      type: 'interview_question',
      id: next.id,
    })
    setRefresh((v) => v + 1)
  }

  async function savePractice(practiceMode: PracticeMode) {
    const currentQuestion = question!
    const currentDraft = draft!
    const durationSeconds = practiceMode === 'timed' ? 120 - secondsLeft : undefined
    const practice: InterviewPractice = {
      id: crypto.randomUUID(),
      questionId: currentQuestion.id,
      mode: practiceMode,
      response: practiceMode === 'flashcard' ? '' : response,
      selfRating: rating,
      durationSeconds,
      createdAt: nowIso(),
    }
    const next = withUpdated<InterviewQuestion>({
      ...currentDraft,
      confidence: rating,
      practiceCount: (currentDraft.practiceCount ?? 0) + 1,
      lastPracticedAt: nowIso(),
    })
    await db.transaction('rw', [db.interviewPractices, db.interviewQuestions], async () => {
      await db.interviewPractices.add(practice)
      await db.interviewQuestions.put(next)
    })
    await logActivity('interview', `Practiced question: ${currentQuestion.question}`, {
      type: 'interview_question',
      id: currentQuestion.id,
    })
    setDraft(next)
    setRefresh((v) => v + 1)
  }

  return (
    <div className="page stack">
      <PageHeader
        title="Interview question"
        subtitle={`${question.category} · ${question.difficulty}`}
        breadcrumbs={
          <Breadcrumbs items={[{ label: 'Interview Lab', to: '/interview' }, { label: question.category }]} />
        }
        actions={
          <div className="row-wrap">
            <Badge tone={question.isBuiltIn ? 'builtin' : 'accent'}>
              {question.isBuiltIn ? 'Built-in' : 'Personal'}
            </Badge>
            <Badge>{question.practiceCount} practices</Badge>
            <Button onClick={() => void copyText(question.question)}>Copy question</Button>
            <Button variant="primary" onClick={() => void saveQuestion()}>
              Save
            </Button>
          </div>
        }
      />

      <Panel title={question.question}>
        <div className="grid-2">
          <div>
            <h3>Evaluating</h3>
            <p>{question.evaluating || 'Add what this question evaluates.'}</p>
            <h3>Key concepts</h3>
            <p>{question.keyConcepts || 'Add key concepts.'}</p>
          </div>
          <div>
            <h3>Example outline</h3>
            <p>{question.exampleOutline || 'Add an outline.'}</p>
            <h3>Common mistakes</h3>
            <p>{question.commonMistakes || 'Add common mistakes.'}</p>
          </div>
        </div>
      </Panel>

      <div className="grid-2">
        <Panel title="Your answer">
          <div className="stack">
            <Textarea
              value={draft.personalAnswer}
              onChange={(event) => setDraft({ ...draft, personalAnswer: event.target.value })}
              placeholder="Draft your answer in your own words."
            />
            <Field label="Confidence">
              <Select
                value={draft.confidence}
                onChange={(event) => setDraft({ ...draft, confidence: event.target.value as ConfidenceLevel })}
              >
                {CONFIDENCE_LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {confidenceLabel(level)}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        </Panel>

        <Panel title="Practice mode">
          <div className="stack">
            <div className="row-wrap">
              {(['flashcard', 'written', 'timed'] as PracticeMode[]).map((item) => (
                <Button
                  key={item}
                  variant={mode === item ? 'primary' : 'secondary'}
                  onClick={() => setParams({ mode: item })}
                >
                  {item}
                </Button>
              ))}
            </div>

            {mode === 'flashcard' ? (
              <div className="stack">
                <p>{showAnswer ? question.exampleOutline || draft.personalAnswer || 'No answer saved yet.' : question.question}</p>
                <Button onClick={() => setShowAnswer((value) => !value)}>
                  {showAnswer ? 'Hide answer' : 'Show answer'}
                </Button>
                <Field label="Self-rating">
                  <Select value={rating} onChange={(event) => setRating(event.target.value as ConfidenceLevel)}>
                    {CONFIDENCE_LEVELS.map((level) => (
                      <option key={level} value={level}>
                        {confidenceLabel(level)}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Button variant="primary" onClick={() => void savePractice('flashcard')}>
                  Save flashcard practice
                </Button>
              </div>
            ) : null}

            {mode === 'written' ? (
              <div className="stack">
                <Textarea
                  value={response}
                  onChange={(event) => setResponse(event.target.value)}
                  placeholder="Write your response, then rate it."
                />
                <Field label="Self-rating">
                  <Select value={rating} onChange={(event) => setRating(event.target.value as ConfidenceLevel)}>
                    {CONFIDENCE_LEVELS.map((level) => (
                      <option key={level} value={level}>
                        {confidenceLabel(level)}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Button variant="primary" disabled={!response.trim()} onClick={() => void savePractice('written')}>
                  Save written practice
                </Button>
              </div>
            ) : null}

            {mode === 'timed' ? (
              <div className="stack">
                <Badge tone={secondsLeft === 0 ? 'danger' : 'warning'}>
                  {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, '0')}
                </Badge>
                <Textarea
                  value={response}
                  disabled={secondsLeft === 0}
                  onChange={(event) => setResponse(event.target.value)}
                  placeholder="Answer before the timer runs out."
                />
                <Field label="Self-rating">
                  <Select value={rating} onChange={(event) => setRating(event.target.value as ConfidenceLevel)}>
                    {CONFIDENCE_LEVELS.map((level) => (
                      <option key={level} value={level}>
                        {confidenceLabel(level)}
                      </option>
                    ))}
                  </Select>
                </Field>
                <div className="row-wrap">
                  <Button onClick={() => setSecondsLeft(120)}>Restart timer</Button>
                  <Button variant="primary" onClick={() => void savePractice('timed')}>
                    Save timed practice
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        </Panel>
      </div>
    </div>
  )
}
