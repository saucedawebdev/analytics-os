import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Button } from '@/components/ui/Button'
import { Field, Input, Select, Textarea } from '@/components/ui/Field'
import { ConfirmDialog } from '@/components/ui/Modal'
import { Badge, EmptyState, PageHeader, Panel } from '@/components/ui/Panel'
import { db } from '@/db'
import type { Project, ProjectMilestone, ProjectType } from '@/types'
import {
  createId,
  downloadJson,
  downloadText,
  formatDate,
  nowIso,
  statusLabel,
  touchUpdated,
} from '@/utils'
import {
  createProject,
  dateInput,
  joinCsv,
  joinLines,
  PROJECT_PRIORITIES,
  PROJECT_STATUSES,
  PROJECT_TYPES,
  projectTemplate,
  projectToMarkdown,
  runSave,
  splitCsv,
  splitLines,
} from '@/pages/pageUtils'
import { useUiStore } from '@/lib/ui-store'
import { getRelated, logActivity, trackRecent } from '@/services/data-service'
import { RelationshipPanel } from '@/components/common/RelationshipPanel'

export default function ProjectDetailPage() {
  const { id = 'new' } = useParams()
  const navigate = useNavigate()
  const setSaveStatus = useUiStore((s) => s.setSaveStatus)
  const [project, setProject] = useState<Project>(() => createProject())
  const [missing, setMissing] = useState(false)
  const [archiveOpen, setArchiveOpen] = useState(false)
  const [relatedCount, setRelatedCount] = useState(0)
  const isNew = id === 'new'

  const load = useCallback(async () => {
    if (isNew) {
      setProject(createProject())
      setMissing(false)
      return
    }
    const row = await db.projects.get(id)
    if (!row) {
      setMissing(true)
      return
    }
    setProject(row)
    setMissing(false)
    setRelatedCount((await getRelated({ type: 'project', id: row.id })).length)
    await trackRecent('project', row.id, row.title)
  }, [id, isNew])

  useEffect(() => {
    void load()
  }, [load])

  function patchProject(patch: Partial<Project>) {
    setProject((current) => ({ ...current, ...patch }))
  }

  function changeProjectType(value: ProjectType) {
    const template = projectTemplate(value)
    setProject((current) => ({
      ...current,
      projectType: value,
      title: isNew || current.title.startsWith('New ') ? template.title : current.title,
      summary: current.summary || template.summary,
      primaryQuestion: current.primaryQuestion || template.primaryQuestion,
      checklist: current.checklist.length === 0 ? template.checklist.map((text) => ({ id: createId(), text, done: false })) : current.checklist,
    }))
  }

  async function saveProject() {
    await runSave(setSaveStatus, async () => {
      const next = isNew ? project : touchUpdated(project)
      await db.projects.put(next)
      await logActivity(isNew ? 'project.created' : 'project.saved', `Saved project: ${next.title}`, {
        type: 'project',
        id: next.id,
      })
      await trackRecent('project', next.id, next.title)
      if (isNew) navigate(`/projects/${next.id}`, { replace: true })
      else setProject(next)
    })
  }

  async function duplicateProject() {
    await runSave(setSaveStatus, async () => {
      const now = nowIso()
      const copy: Project = {
        ...project,
        id: createId(),
        title: `${project.title} (copy)`,
        status: 'planning',
        archivedAt: null,
        createdAt: now,
        updatedAt: now,
        recordVersion: 1,
        milestones: project.milestones.map((milestone) => ({ ...milestone, id: createId() })),
        checklist: project.checklist.map((item) => ({ ...item, id: createId() })),
        statusUpdates: [],
        activityLog: [],
      }
      await db.projects.add(copy)
      await logActivity('project.duplicated', `Duplicated project: ${project.title}`, {
        type: 'project',
        id: copy.id,
      })
      await trackRecent('project', copy.id, copy.title)
      navigate(`/projects/${copy.id}`)
    })
  }

  async function archiveProject() {
    await runSave(setSaveStatus, async () => {
      const next = touchUpdated({ ...project, status: 'archived' as const, archivedAt: nowIso() })
      await db.projects.put(next)
      await logActivity('project.archived', `Archived project: ${next.title}`, {
        type: 'project',
        id: next.id,
      })
      setProject(next)
    })
  }

  function addMilestone() {
    const milestone: ProjectMilestone = {
      id: createId(),
      title: 'New milestone',
      dueDate: '',
      completed: false,
      completedAt: null,
    }
    patchProject({ milestones: [...project.milestones, milestone] })
  }

  if (missing) {
    return (
      <div className="page">
        <PageHeader title="Project not found" actions={<Link to="/projects">Back to projects</Link>} />
        <EmptyState title="Missing project" description="This project was deleted or is unavailable." />
      </div>
    )
  }

  return (
    <div className="page">
      <PageHeader
        title={isNew ? 'New project' : project.title}
        subtitle={
          isNew
            ? 'Create a structured analytics project.'
            : `Updated ${formatDate(project.updatedAt)} · ${relatedCount} related record${relatedCount === 1 ? '' : 's'}`
        }
        breadcrumbs={<Breadcrumbs items={[{ label: 'Projects', to: '/projects' }, { label: isNew ? 'New' : project.title }]} />}
        actions={
          <div className="row-wrap">
            <Button variant="ghost" onClick={() => downloadText(`${project.title || 'project'}.md`, projectToMarkdown(project), 'text/markdown')}>
              Export Markdown
            </Button>
            <Button variant="ghost" onClick={() => downloadJson(`${project.title || 'project'}.json`, project)}>
              Export JSON
            </Button>
            {!isNew ? (
              <Button variant="secondary" onClick={() => void duplicateProject()}>
                Duplicate
              </Button>
            ) : null}
            {!isNew ? (
              <Button variant="danger" onClick={() => setArchiveOpen(true)}>
                Archive
              </Button>
            ) : null}
            <Button variant="primary" onClick={() => void saveProject()}>
              Save project
            </Button>
          </div>
        }
      />

      <Panel title="Overview">
        <div className="grid-2">
          <Field label="Title" htmlFor="title">
            <Input id="title" value={project.title} onChange={(event) => patchProject({ title: event.target.value })} />
          </Field>
          <Field label="Project type" htmlFor="projectType">
            <Select
              id="projectType"
              value={project.projectType}
              onChange={(event) => changeProjectType(event.target.value as ProjectType)}
            >
              {PROJECT_TYPES.map((value) => (
                <option key={value} value={value}>
                  {statusLabel(value)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Status" htmlFor="status">
            <Select
              id="status"
              value={project.status}
              onChange={(event) => patchProject({ status: event.target.value as Project['status'] })}
            >
              {PROJECT_STATUSES.map((value) => (
                <option key={value} value={value}>
                  {statusLabel(value)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Priority" htmlFor="priority">
            <Select
              id="priority"
              value={project.priority}
              onChange={(event) => patchProject({ priority: event.target.value as Project['priority'] })}
            >
              {PROJECT_PRIORITIES.map((value) => (
                <option key={value} value={value}>
                  {statusLabel(value)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Start date" htmlFor="startDate">
            <Input id="startDate" type="date" value={dateInput(project.startDate)} onChange={(event) => patchProject({ startDate: event.target.value })} />
          </Field>
          <Field label="Target date" htmlFor="targetDate">
            <Input id="targetDate" type="date" value={dateInput(project.targetDate)} onChange={(event) => patchProject({ targetDate: event.target.value })} />
          </Field>
          <Field label="Completion date" htmlFor="completionDate">
            <Input id="completionDate" type="date" value={dateInput(project.completionDate)} onChange={(event) => patchProject({ completionDate: event.target.value })} />
          </Field>
          <Field label="Tools used" htmlFor="toolsUsed">
            <Input id="toolsUsed" value={joinCsv(project.toolsUsed)} onChange={(event) => patchProject({ toolsUsed: splitCsv(event.target.value) })} placeholder="SQL, Excel, Tableau" />
          </Field>
        </div>
        <Field label="Summary" htmlFor="summary">
          <Textarea id="summary" value={project.summary} onChange={(event) => patchProject({ summary: event.target.value })} rows={4} />
        </Field>
      </Panel>

      <Panel title="Business">
        <div className="grid-2">
          <Field label="Business area" htmlFor="businessArea">
            <Input id="businessArea" value={project.businessArea} onChange={(event) => patchProject({ businessArea: event.target.value })} />
          </Field>
          <Field label="Stakeholders" htmlFor="stakeholders">
            <Input id="stakeholders" value={project.stakeholders} onChange={(event) => patchProject({ stakeholders: event.target.value })} />
          </Field>
        </div>
        <Field label="Original request" htmlFor="originalRequest">
          <Textarea id="originalRequest" value={project.originalRequest} onChange={(event) => patchProject({ originalRequest: event.target.value })} rows={3} />
        </Field>
        <Field label="Business decision supported" htmlFor="businessDecision">
          <Textarea id="businessDecision" value={project.businessDecision} onChange={(event) => patchProject({ businessDecision: event.target.value })} rows={3} />
        </Field>
        <div className="grid-2">
          <Field label="Scope" htmlFor="scope">
            <Textarea id="scope" value={project.scope} onChange={(event) => patchProject({ scope: event.target.value })} rows={4} />
          </Field>
          <Field label="Out of scope" htmlFor="outOfScope">
            <Textarea id="outOfScope" value={project.outOfScope} onChange={(event) => patchProject({ outOfScope: event.target.value })} rows={4} />
          </Field>
        </div>
        <Field label="Success criteria" htmlFor="successCriteria">
          <Textarea id="successCriteria" value={project.successCriteria} onChange={(event) => patchProject({ successCriteria: event.target.value })} rows={3} />
        </Field>
      </Panel>

      <Panel title="Questions">
        <Field label="Primary question" htmlFor="primaryQuestion">
          <Textarea id="primaryQuestion" value={project.primaryQuestion} onChange={(event) => patchProject({ primaryQuestion: event.target.value })} rows={3} />
        </Field>
        <div className="grid-2">
          <TextList label="Supporting questions" value={project.supportingQuestions} onChange={(value) => patchProject({ supportingQuestions: value })} />
          <TextList label="Hypotheses" value={project.hypotheses} onChange={(value) => patchProject({ hypotheses: value })} />
          <TextList label="Assumptions" value={project.assumptions} onChange={(value) => patchProject({ assumptions: value })} />
          <TextList label="Risks" value={project.risks} onChange={(value) => patchProject({ risks: value })} />
          <TextList label="Limitations" value={project.limitations} onChange={(value) => patchProject({ limitations: value })} />
        </div>
      </Panel>

      <Panel title="Data">
        <div className="grid-2">
          <Field label="Dataset IDs" htmlFor="datasetIds">
            <Input id="datasetIds" value={joinCsv(project.datasetIds)} onChange={(event) => patchProject({ datasetIds: splitCsv(event.target.value) })} />
          </Field>
          <Field label="Required fields" htmlFor="requiredFields">
            <Textarea id="requiredFields" value={project.requiredFields} onChange={(event) => patchProject({ requiredFields: event.target.value })} rows={3} />
          </Field>
          <Field label="Missing data" htmlFor="missingData">
            <Textarea id="missingData" value={project.missingData} onChange={(event) => patchProject({ missingData: event.target.value })} rows={3} />
          </Field>
          <Field label="Quality issues" htmlFor="qualityIssues">
            <Textarea id="qualityIssues" value={project.qualityIssues} onChange={(event) => patchProject({ qualityIssues: event.target.value })} rows={3} />
          </Field>
          <Field label="Cleaning plan" htmlFor="cleaningPlan">
            <Textarea id="cleaningPlan" value={project.cleaningPlan} onChange={(event) => patchProject({ cleaningPlan: event.target.value })} rows={4} />
          </Field>
          <TextList label="Cleaning log" value={splitLines(project.cleaningLog)} onChange={(value) => patchProject({ cleaningLog: joinLines(value) })} />
        </div>
      </Panel>

      <Panel title="Analysis">
        <div className="grid-2">
          <Field label="Query IDs" htmlFor="queryIds">
            <Input id="queryIds" value={joinCsv(project.queryIds)} onChange={(event) => patchProject({ queryIds: splitCsv(event.target.value) })} />
          </Field>
          <Field label="KPI IDs" htmlFor="kpiIds">
            <Input id="kpiIds" value={joinCsv(project.kpiIds)} onChange={(event) => patchProject({ kpiIds: splitCsv(event.target.value) })} />
          </Field>
          <Field label="Excel work" htmlFor="excelWork">
            <Textarea id="excelWork" value={project.excelWork} onChange={(event) => patchProject({ excelWork: event.target.value })} rows={4} />
          </Field>
          <Field label="Python work" htmlFor="pythonWork">
            <Textarea id="pythonWork" value={project.pythonWork} onChange={(event) => patchProject({ pythonWork: event.target.value })} rows={4} />
          </Field>
          <Field label="Calculations" htmlFor="calculations">
            <Textarea id="calculations" value={project.calculations} onChange={(event) => patchProject({ calculations: event.target.value })} rows={4} />
          </Field>
          <Field label="Validation steps" htmlFor="validationSteps">
            <Textarea id="validationSteps" value={project.validationSteps} onChange={(event) => patchProject({ validationSteps: event.target.value })} rows={4} />
          </Field>
        </div>
      </Panel>

      <Panel title="Visualization">
        <div className="grid-2">
          <Field label="Dashboard IDs" htmlFor="dashboardIds">
            <Input id="dashboardIds" value={joinCsv(project.dashboardIds)} onChange={(event) => patchProject({ dashboardIds: splitCsv(event.target.value) })} />
          </Field>
          <Field label="Audience" htmlFor="audience">
            <Input id="audience" value={project.audience} onChange={(event) => patchProject({ audience: event.target.value })} />
          </Field>
          <Field label="Chart notes" htmlFor="chartNotes">
            <Textarea id="chartNotes" value={project.chartNotes} onChange={(event) => patchProject({ chartNotes: event.target.value })} rows={4} />
          </Field>
          <Field label="Design notes" htmlFor="designNotes">
            <Textarea id="designNotes" value={project.designNotes} onChange={(event) => patchProject({ designNotes: event.target.value })} rows={4} />
          </Field>
          <Field label="Filters" htmlFor="filters">
            <Textarea id="filters" value={project.filters} onChange={(event) => patchProject({ filters: event.target.value })} rows={3} />
          </Field>
        </div>
      </Panel>

      <Panel title="Conclusions">
        <div className="grid-2">
          <Field label="Key insights" htmlFor="keyInsights">
            <Textarea id="keyInsights" value={project.keyInsights} onChange={(event) => patchProject({ keyInsights: event.target.value })} rows={4} />
          </Field>
          <Field label="Recommendations" htmlFor="recommendations">
            <Textarea id="recommendations" value={project.recommendations} onChange={(event) => patchProject({ recommendations: event.target.value })} rows={4} />
          </Field>
          <Field label="Expected impact" htmlFor="expectedImpact">
            <Textarea id="expectedImpact" value={project.expectedImpact} onChange={(event) => patchProject({ expectedImpact: event.target.value })} rows={3} />
          </Field>
          <Field label="Next steps" htmlFor="nextSteps">
            <Textarea id="nextSteps" value={project.nextSteps} onChange={(event) => patchProject({ nextSteps: event.target.value })} rows={3} />
          </Field>
          <Field label="Open questions" htmlFor="openQuestions">
            <Textarea id="openQuestions" value={project.openQuestions} onChange={(event) => patchProject({ openQuestions: event.target.value })} rows={3} />
          </Field>
          <Field label="Lessons learned" htmlFor="lessonsLearned">
            <Textarea id="lessonsLearned" value={project.lessonsLearned} onChange={(event) => patchProject({ lessonsLearned: event.target.value })} rows={3} />
          </Field>
        </div>
      </Panel>

      <Panel title="Docs">
        <div className="grid-2">
          <Field label="Decisions" htmlFor="decisions">
            <Textarea id="decisions" value={project.decisions} onChange={(event) => patchProject({ decisions: event.target.value })} rows={4} />
          </Field>
          <Field label="Meeting notes" htmlFor="meetingNotes">
            <Textarea id="meetingNotes" value={project.meetingNotes} onChange={(event) => patchProject({ meetingNotes: event.target.value })} rows={4} />
          </Field>
          <Field label="Related knowledge IDs" htmlFor="relatedKnowledgeIds">
            <Input id="relatedKnowledgeIds" value={joinCsv(project.relatedKnowledgeIds)} onChange={(event) => patchProject({ relatedKnowledgeIds: splitCsv(event.target.value) })} />
          </Field>
          <Field label="Tags" htmlFor="tags">
            <Input id="tags" value={joinCsv(project.tags)} onChange={(event) => patchProject({ tags: splitCsv(event.target.value) })} />
          </Field>
        </div>
      </Panel>

      <div className="grid-2">
        <Panel title="Milestones" action={<Button size="sm" onClick={addMilestone}>Add milestone</Button>}>
          {project.milestones.length === 0 ? (
            <EmptyState title="No milestones" description="Add checkpoints for delivery." />
          ) : (
            <div className="list">
              {project.milestones.map((milestone) => (
                <div key={milestone.id} className="list-item">
                  <input
                    type="checkbox"
                    checked={milestone.completed}
                    onChange={(event) =>
                      patchProject({
                        milestones: project.milestones.map((item) =>
                          item.id === milestone.id
                            ? { ...item, completed: event.target.checked, completedAt: event.target.checked ? nowIso() : null }
                            : item,
                        ),
                      })
                    }
                  />
                  <Input
                    value={milestone.title}
                    onChange={(event) =>
                      patchProject({
                        milestones: project.milestones.map((item) =>
                          item.id === milestone.id ? { ...item, title: event.target.value } : item,
                        ),
                      })
                    }
                  />
                  <Input
                    type="date"
                    value={dateInput(milestone.dueDate)}
                    onChange={(event) =>
                      patchProject({
                        milestones: project.milestones.map((item) =>
                          item.id === milestone.id ? { ...item, dueDate: event.target.value } : item,
                        ),
                      })
                    }
                  />
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => patchProject({ milestones: project.milestones.filter((item) => item.id !== milestone.id) })}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel
          title="Checklist"
          action={
            <Button
              size="sm"
              onClick={() => patchProject({ checklist: [...project.checklist, { id: createId(), text: 'New task', done: false }] })}
            >
              Add task
            </Button>
          }
        >
          {project.checklist.length === 0 ? (
            <EmptyState title="No checklist" description="Add repeatable project tasks." />
          ) : (
            <div className="list">
              {project.checklist.map((item) => (
                <div key={item.id} className="list-item">
                  <input
                    type="checkbox"
                    checked={item.done}
                    onChange={(event) =>
                      patchProject({
                        checklist: project.checklist.map((task) =>
                          task.id === item.id ? { ...task, done: event.target.checked } : task,
                        ),
                      })
                    }
                  />
                  <Input
                    value={item.text}
                    onChange={(event) =>
                      patchProject({
                        checklist: project.checklist.map((task) =>
                          task.id === item.id ? { ...task, text: event.target.value } : task,
                        ),
                      })
                    }
                  />
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => patchProject({ checklist: project.checklist.filter((task) => task.id !== item.id) })}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>

      <div className="row-wrap">
        <Badge>{statusLabel(project.status)}</Badge>
        <Badge>{statusLabel(project.priority)}</Badge>
        <Badge>{statusLabel(project.projectType)}</Badge>
      </div>

      {!isNew ? <RelationshipPanel entity={{ type: 'project', id: project.id }} /> : null}

      <ConfirmDialog
        open={archiveOpen}
        title="Archive project?"
        message="Archived projects stay in storage but are hidden from active project views."
        confirmLabel="Archive"
        danger
        onClose={() => setArchiveOpen(false)}
        onConfirm={() => void archiveProject()}
      />
    </div>
  )
}

function TextList({
  label,
  value,
  onChange,
}: {
  label: string
  value: string[]
  onChange: (value: string[]) => void
}) {
  return (
    <Field label={label}>
      <Textarea
        value={joinLines(value)}
        onChange={(event) => onChange(splitLines(event.target.value))}
        rows={5}
        placeholder="One item per line"
      />
    </Field>
  )
}
