import { useCallback, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Button } from '@/components/ui/Button'
import { Field, Input, Select, Textarea } from '@/components/ui/Field'
import { Badge, EmptyState, PageHeader, Panel } from '@/components/ui/Panel'
import { db } from '@/db'
import { useLiveQuery } from '@/hooks/useLiveQuery'
import { logActivity } from '@/services/data-service'
import type { CareerGoal, JobApplication, LearningRecord, SkillRecord } from '@/types'
import {
  CONFIDENCE_LEVELS,
  joinList,
  newCareerGoal,
  newJobApplication,
  newLearningRecord,
  newSkillRecord,
  splitList,
  withUpdated,
} from '@/pages/page-utils'
import { confidenceLabel, statusLabel } from '@/utils'

type CareerData = {
  goals: CareerGoal[]
  jobs: JobApplication[]
  learning: LearningRecord[]
  skills: SkillRecord[]
}

export default function CareerPage() {
  const navigate = useNavigate()
  const [refresh, setRefresh] = useState(0)
  const [goalDraft, setGoalDraft] = useState(newCareerGoal())
  const [learningDraft, setLearningDraft] = useState(newLearningRecord())
  const [skillDraft, setSkillDraft] = useState(newSkillRecord())
  const loadCareer = useCallback(async (): Promise<CareerData> => {
    const [goals, jobs, learning, skills] = await Promise.all([
      db.careerGoals.orderBy('updatedAt').reverse().toArray(),
      db.jobApplications.orderBy('updatedAt').reverse().toArray(),
      db.learningRecords.orderBy('updatedAt').reverse().toArray(),
      db.skillRecords.orderBy('updatedAt').reverse().toArray(),
    ])
    return { goals, jobs, learning, skills }
  }, [refresh])
  const data = useLiveQuery(loadCareer, [], { goals: [], jobs: [], learning: [], skills: [] })

  async function createJob() {
    const job = newJobApplication()
    await db.jobApplications.add(job)
    await logActivity('career', 'Created job application', { type: 'job_application', id: job.id })
    navigate(`/career/jobs/${job.id}`)
  }

  async function saveGoal() {
    if (!goalDraft.targetRole.trim()) return
    const goal = withUpdated(goalDraft)
    await db.careerGoals.put(goal)
    await logActivity('career', `Saved goal for ${goal.targetRole}`, { type: 'career_goal', id: goal.id })
    setGoalDraft(newCareerGoal())
    setRefresh((v) => v + 1)
  }

  async function saveLearning() {
    if (!learningDraft.title.trim()) return
    const record = withUpdated(learningDraft)
    await db.learningRecords.put(record)
    await logActivity('career', `Saved learning record ${record.title}`, {
      type: 'learning_record',
      id: record.id,
    })
    setLearningDraft(newLearningRecord())
    setRefresh((v) => v + 1)
  }

  async function saveSkill() {
    if (!skillDraft.skill.trim()) return
    const record = withUpdated(skillDraft)
    await db.skillRecords.put(record)
    await logActivity('career', `Saved skill ${record.skill}`, { type: 'skill_record', id: record.id })
    setSkillDraft(newSkillRecord())
    setRefresh((v) => v + 1)
  }

  return (
    <div className="page stack">
      <PageHeader
        title="Career Hub"
        subtitle="Goals, job applications, skills, and learning records."
        breadcrumbs={<Breadcrumbs items={[{ label: 'Career Hub' }]} />}
        actions={
          <Button variant="primary" onClick={() => void createJob()}>
            New job application
          </Button>
        }
      />

      <div className="grid-2">
        <Panel title="Career goals">
          <div className="stack">
            {data.goals.length === 0 ? (
              <EmptyState title="No goals yet" description="Add a target role and development plan." />
            ) : (
              <div className="list">
                {data.goals.map((goal) => (
                  <div key={goal.id} className="list-item">
                    <span>
                      <strong>{goal.targetRole}</strong>
                      <span className="list-item-meta">{goal.notes || goal.portfolioGoals}</span>
                    </span>
                    <Badge>{goal.targetSalary || 'No salary target'}</Badge>
                  </div>
                ))}
              </div>
            )}
            <Field label="Target role">
              <Input
                value={goalDraft.targetRole}
                onChange={(e) => setGoalDraft({ ...goalDraft, targetRole: e.target.value })}
              />
            </Field>
            <Field label="Skills to develop (comma-separated)">
              <Input
                value={joinList(goalDraft.skillsToDevelop)}
                onChange={(e) => setGoalDraft({ ...goalDraft, skillsToDevelop: splitList(e.target.value) })}
              />
            </Field>
            <Field label="Notes">
              <Textarea value={goalDraft.notes} onChange={(e) => setGoalDraft({ ...goalDraft, notes: e.target.value })} />
            </Field>
            <Button onClick={() => void saveGoal()}>Save goal</Button>
          </div>
        </Panel>

        <Panel title="Job applications">
          {data.jobs.length === 0 ? (
            <EmptyState
              title="No applications"
              description="Track roles, interview dates, follow-ups, and offer comparison fields."
              action={<Button onClick={() => void createJob()}>Create application</Button>}
            />
          ) : (
            <div className="list">
              {data.jobs.map((job) => (
                <Link key={job.id} className="list-item" to={`/career/jobs/${job.id}`}>
                  <span>
                    <strong>
                      {job.jobTitle || 'Untitled role'} @ {job.company || 'Unknown company'}
                    </strong>
                    <span className="list-item-meta">{job.location || job.notes}</span>
                  </span>
                  <Badge tone={job.status === 'offer' ? 'success' : 'default'}>{statusLabel(job.status)}</Badge>
                </Link>
              ))}
            </div>
          )}
        </Panel>
      </div>

      <div className="grid-2">
        <Panel title="Skills">
          <div className="stack">
            {data.skills.map((skill) => (
              <div key={skill.id} className="list-item">
                <span>
                  <strong>{skill.skill}</strong>
                  <span className="list-item-meta">{skill.evidence}</span>
                </span>
                <Badge>{confidenceLabel(skill.confidence)}</Badge>
              </div>
            ))}
            <Field label="Skill">
              <Input value={skillDraft.skill} onChange={(e) => setSkillDraft({ ...skillDraft, skill: e.target.value })} />
            </Field>
            <Field label="Confidence">
              <Select
                value={skillDraft.confidence}
                onChange={(e) => setSkillDraft({ ...skillDraft, confidence: e.target.value as SkillRecord['confidence'] })}
              >
                {CONFIDENCE_LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {confidenceLabel(level)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Evidence">
              <Textarea
                value={skillDraft.evidence}
                onChange={(e) => setSkillDraft({ ...skillDraft, evidence: e.target.value })}
              />
            </Field>
            <Button onClick={() => void saveSkill()}>Save skill</Button>
          </div>
        </Panel>

        <Panel title="Learning records">
          <div className="stack">
            {data.learning.map((record) => (
              <div key={record.id} className="list-item">
                <span>
                  <strong>{record.title}</strong>
                  <span className="list-item-meta">{record.subject}</span>
                </span>
                <Badge>{statusLabel(record.status)}</Badge>
              </div>
            ))}
            <Field label="Title">
              <Input
                value={learningDraft.title}
                onChange={(e) => setLearningDraft({ ...learningDraft, title: e.target.value })}
              />
            </Field>
            <div className="grid-2">
              <Field label="Type">
                <Select
                  value={learningDraft.type}
                  onChange={(e) => setLearningDraft({ ...learningDraft, type: e.target.value as LearningRecord['type'] })}
                >
                  <option value="course">Course</option>
                  <option value="book">Book</option>
                  <option value="certificate">Certificate</option>
                  <option value="other">Other</option>
                </Select>
              </Field>
              <Field label="Status">
                <Select
                  value={learningDraft.status}
                  onChange={(e) =>
                    setLearningDraft({ ...learningDraft, status: e.target.value as LearningRecord['status'] })
                  }
                >
                  <option value="planned">Planned</option>
                  <option value="in_progress">In progress</option>
                  <option value="completed">Completed</option>
                  <option value="paused">Paused</option>
                </Select>
              </Field>
            </div>
            <Field label="Subject">
              <Input
                value={learningDraft.subject}
                onChange={(e) => setLearningDraft({ ...learningDraft, subject: e.target.value })}
              />
            </Field>
            <Button onClick={() => void saveLearning()}>Save learning record</Button>
          </div>
        </Panel>
      </div>
    </div>
  )
}
