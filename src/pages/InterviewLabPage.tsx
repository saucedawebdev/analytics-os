import { useCallback, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Button } from '@/components/ui/Button'
import { Field, Input, Select } from '@/components/ui/Field'
import { Badge, EmptyState, PageHeader, Panel } from '@/components/ui/Panel'
import { db } from '@/db'
import { builtinInterviewQuestions } from '@/data/builtin'
import { useLiveQuery } from '@/hooks/useLiveQuery'
import { logActivity } from '@/services/data-service'
import type { Difficulty, InterviewQuestion } from '@/types'
import { includesText, newInterviewQuestion } from '@/pages/page-utils'
import { confidenceLabel } from '@/utils'

type SourceFilter = 'all' | 'builtin' | 'personal'
type DifficultyFilter = 'all' | Difficulty

export default function InterviewLabPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [difficulty, setDifficulty] = useState<DifficultyFilter>('all')
  const [source, setSource] = useState<SourceFilter>('all')
  const [refresh, setRefresh] = useState(0)
  const loadQuestions = useCallback(async () => {
    const stored = await db.interviewQuestions.toArray()
    const byId = new Map<string, InterviewQuestion>()
    for (const question of builtinInterviewQuestions) byId.set(question.id, question)
    for (const question of stored) byId.set(question.id, question)
    return Array.from(byId.values()).sort((a, b) => a.category.localeCompare(b.category))
  }, [refresh])
  const questions = useLiveQuery(loadQuestions, [], builtinInterviewQuestions)

  const categories = useMemo(
    () => ['All', ...Array.from(new Set(questions.map((question) => question.category))).sort()],
    [questions],
  )
  const filtered = useMemo(
    () =>
      questions.filter(
        (question) =>
          (category === 'All' || question.category === category) &&
          (difficulty === 'all' || question.difficulty === difficulty) &&
          (source === 'all' || (source === 'builtin' ? question.isBuiltIn : !question.isBuiltIn)) &&
          includesText(
            search,
            question.question,
            question.category,
            question.keyConcepts,
            question.evaluating,
            ...(question.tags ?? []),
          ),
      ),
    [category, difficulty, questions, search, source],
  )

  async function createQuestion() {
    const text = window.prompt('Interview question')
    if (!text?.trim()) return
    const question = newInterviewQuestion(text.trim())
    await db.interviewQuestions.add(question)
    await logActivity('interview', 'Created interview question', {
      type: 'interview_question',
      id: question.id,
    })
    setRefresh((v) => v + 1)
    navigate(`/interview/${question.id}`)
  }

  return (
    <div className="page stack">
      <PageHeader
        title="Interview Lab"
        subtitle="Question bank, confidence tracking, and local practice sessions."
        breadcrumbs={<Breadcrumbs items={[{ label: 'Interview Lab' }]} />}
        actions={
          <div className="row-wrap">
            <Link to="/star-stories" className="btn btn-secondary">
              STAR stories
            </Link>
            <Button variant="primary" onClick={() => void createQuestion()}>
              New question
            </Button>
          </div>
        }
      />

      <Panel>
        <div className="grid-4">
          <Field label="Search questions">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search SQL, dashboard, behavioral..."
            />
          </Field>
          <Field label="Category">
            <Select value={category} onChange={(event) => setCategory(event.target.value)}>
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Difficulty">
            <Select value={difficulty} onChange={(event) => setDifficulty(event.target.value as DifficultyFilter)}>
              <option value="all">All</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </Select>
          </Field>
          <Field label="Source">
            <Select value={source} onChange={(event) => setSource(event.target.value as SourceFilter)}>
              <option value="all">All</option>
              <option value="builtin">Built-in</option>
              <option value="personal">Personal</option>
            </Select>
          </Field>
        </div>
      </Panel>

      <Panel title={`${filtered.length} question${filtered.length === 1 ? '' : 's'}`}>
        {filtered.length === 0 ? (
          <EmptyState
            title="No questions found"
            description="Adjust your filters or create a personal question."
            action={<Button onClick={() => void createQuestion()}>Create question</Button>}
          />
        ) : (
          <div className="list">
            {filtered.map((question) => (
              <div key={question.id} className="list-item">
                <Link to={`/interview/${question.id}`} className="spacer">
                  <h3 className="list-item-title">{question.question}</h3>
                  <p className="list-item-meta">
                    {question.category} · {question.difficulty} · {confidenceLabel(question.confidence)}
                  </p>
                </Link>
                <div className="row-wrap" style={{ justifyContent: 'flex-end' }}>
                  <Badge tone={question.isBuiltIn ? 'builtin' : 'accent'}>
                    {question.isBuiltIn ? 'Built-in' : 'Personal'}
                  </Badge>
                  <Link to={`/interview/${question.id}?mode=flashcard`} className="btn btn-sm btn-secondary">
                    Flashcard
                  </Link>
                  <Link to={`/interview/${question.id}?mode=written`} className="btn btn-sm btn-secondary">
                    Written
                  </Link>
                  <Link to={`/interview/${question.id}?mode=timed`} className="btn btn-sm btn-secondary">
                    Timed
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  )
}
