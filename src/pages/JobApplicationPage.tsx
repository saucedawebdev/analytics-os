import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Button } from '@/components/ui/Button'
import { Field, Input, Select, Textarea } from '@/components/ui/Field'
import { EmptyState, PageHeader, Panel } from '@/components/ui/Panel'
import { ConfirmDialog } from '@/components/ui/Modal'
import { db } from '@/db'
import { useLiveQuery } from '@/hooks/useLiveQuery'
import { logActivity, trackRecent } from '@/services/data-service'
import type { JobApplication, JobStatus, Project } from '@/types'
import { joinList, newJobApplication, splitList, withUpdated } from '@/pages/page-utils'

const JOB_STATUSES: JobStatus[] = [
  'saved',
  'preparing',
  'applied',
  'screening',
  'interviewing',
  'final_round',
  'offer',
  'rejected',
  'withdrawn',
  'archived',
]

type JobContext = {
  job: JobApplication | null
  projects: Project[]
}

export default function JobApplicationPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const [refresh, setRefresh] = useState(0)
  const [draft, setDraft] = useState<JobApplication | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const loadContext = useCallback(async (): Promise<JobContext> => {
    const job = id === 'new' ? newJobApplication() : (await db.jobApplications.get(id)) ?? null
    const projects = await db.projects.orderBy('updatedAt').reverse().toArray()
    return { job, projects }
  }, [id, refresh])
  const context = useLiveQuery(loadContext, [], { job: null, projects: [] })

  useEffect(() => {
    setDraft(context.job)
    if (context.job && id !== 'new') {
      void trackRecent('job_application', context.job.id, `${context.job.jobTitle} @ ${context.job.company}`)
    }
  }, [context.job, id])

  if (!draft) {
    return (
      <div className="page stack">
        <PageHeader
          title="Job application not found"
          breadcrumbs={<Breadcrumbs items={[{ label: 'Career Hub', to: '/career' }, { label: 'Missing' }]} />}
        />
        <EmptyState
          title="No application found"
          description="Create an application from Career Hub."
          action={<Button onClick={() => navigate('/career')}>Back to Career Hub</Button>}
        />
      </div>
    )
  }

  async function save() {
    const currentDraft = draft!
    const next = withUpdated<JobApplication>({
      ...currentDraft,
      company: currentDraft.company.trim(),
      jobTitle: currentDraft.jobTitle.trim() || 'Untitled role',
    })
    await db.jobApplications.put(next)
    await logActivity('career', `Saved application ${next.jobTitle} @ ${next.company || 'Unknown company'}`, {
      type: 'job_application',
      id: next.id,
    })
    if (id === 'new') navigate(`/career/jobs/${next.id}`, { replace: true })
    setRefresh((v) => v + 1)
  }

  async function deleteJob() {
    const currentDraft = draft!
    await db.jobApplications.delete(currentDraft.id)
    await logActivity('career', `Deleted application ${currentDraft.jobTitle}`)
    navigate('/career')
  }

  return (
    <div className="page stack">
      <PageHeader
        title={`${draft.jobTitle || 'Untitled role'} @ ${draft.company || 'Unknown company'}`}
        subtitle="Job application and offer comparison"
        breadcrumbs={<Breadcrumbs items={[{ label: 'Career Hub', to: '/career' }, { label: draft.jobTitle || 'Job' }]} />}
        actions={
          <div className="row-wrap">
            <Button variant="danger" onClick={() => setDeleteOpen(true)}>
              Delete
            </Button>
            <Button variant="primary" onClick={() => void save()}>
              Save application
            </Button>
          </div>
        }
      />

      <Panel title="Application details">
        <div className="grid-2">
          <Field label="Company">
            <Input value={draft.company} onChange={(e) => setDraft({ ...draft, company: e.target.value })} />
          </Field>
          <Field label="Job title">
            <Input value={draft.jobTitle} onChange={(e) => setDraft({ ...draft, jobTitle: e.target.value })} />
          </Field>
          <Field label="Job URL">
            <Input value={draft.jobUrl} onChange={(e) => setDraft({ ...draft, jobUrl: e.target.value })} />
          </Field>
          <Field label="Location">
            <Input value={draft.location} onChange={(e) => setDraft({ ...draft, location: e.target.value })} />
          </Field>
          <Field label="Remote status">
            <Select
              value={draft.remoteStatus}
              onChange={(e) => setDraft({ ...draft, remoteStatus: e.target.value as JobApplication['remoteStatus'] })}
            >
              <option value="onsite">Onsite</option>
              <option value="hybrid">Hybrid</option>
              <option value="remote">Remote</option>
            </Select>
          </Field>
          <Field label="Salary range">
            <Input value={draft.salaryRange} onChange={(e) => setDraft({ ...draft, salaryRange: e.target.value })} />
          </Field>
          <Field label="Application date">
            <Input
              type="date"
              value={draft.applicationDate ?? ''}
              onChange={(e) => setDraft({ ...draft, applicationDate: e.target.value })}
            />
          </Field>
          <Field label="Status">
            <Select value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value as JobStatus })}>
              {JOB_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status.replace(/_/g, ' ')}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Contact">
            <Input value={draft.contact} onChange={(e) => setDraft({ ...draft, contact: e.target.value })} />
          </Field>
          <Field label="Follow-up date">
            <Input
              type="date"
              value={draft.followUpDate ?? ''}
              onChange={(e) => setDraft({ ...draft, followUpDate: e.target.value })}
            />
          </Field>
          <Field label="Interview dates">
            <Textarea
              value={draft.interviewDates}
              onChange={(e) => setDraft({ ...draft, interviewDates: e.target.value })}
            />
          </Field>
          <Field label="Notes">
            <Textarea value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} />
          </Field>
          <Field label="Resume version">
            <Input
              value={draft.resumeVersion}
              onChange={(e) => setDraft({ ...draft, resumeVersion: e.target.value })}
            />
          </Field>
          <Field label="Portfolio project IDs (comma-separated)">
            <Input
              value={joinList(draft.portfolioProjectIds)}
              onChange={(e) => setDraft({ ...draft, portfolioProjectIds: splitList(e.target.value) })}
            />
          </Field>
        </div>
        {context.projects.length > 0 ? (
          <div className="row-wrap" style={{ marginTop: 16 }}>
            {context.projects.slice(0, 12).map((project) => (
              <Button
                key={project.id}
                size="sm"
                variant={draft.portfolioProjectIds.includes(project.id) ? 'primary' : 'secondary'}
                onClick={() => {
                  const exists = draft.portfolioProjectIds.includes(project.id)
                  setDraft({
                    ...draft,
                    portfolioProjectIds: exists
                      ? draft.portfolioProjectIds.filter((item) => item !== project.id)
                      : [...draft.portfolioProjectIds, project.id],
                  })
                }}
              >
                {project.title}
              </Button>
            ))}
          </div>
        ) : null}
      </Panel>

      <Panel title="Offer comparison">
        <div className="grid-2">
          <Field label="Offer salary">
            <Input value={draft.offerSalary ?? ''} onChange={(e) => setDraft({ ...draft, offerSalary: e.target.value })} />
          </Field>
          <Field label="Benefits">
            <Textarea
              value={draft.offerBenefits ?? ''}
              onChange={(e) => setDraft({ ...draft, offerBenefits: e.target.value })}
            />
          </Field>
          <Field label="Remote / office">
            <Input value={draft.offerRemote ?? ''} onChange={(e) => setDraft({ ...draft, offerRemote: e.target.value })} />
          </Field>
          <Field label="Schedule">
            <Input
              value={draft.offerSchedule ?? ''}
              onChange={(e) => setDraft({ ...draft, offerSchedule: e.target.value })}
            />
          </Field>
          <Field label="Growth">
            <Textarea value={draft.offerGrowth ?? ''} onChange={(e) => setDraft({ ...draft, offerGrowth: e.target.value })} />
          </Field>
          <Field label="Stability">
            <Textarea
              value={draft.offerStability ?? ''}
              onChange={(e) => setDraft({ ...draft, offerStability: e.target.value })}
            />
          </Field>
          <Field label="Commute">
            <Input
              value={draft.offerCommute ?? ''}
              onChange={(e) => setDraft({ ...draft, offerCommute: e.target.value })}
            />
          </Field>
          <Field label="Overall rating (1-10)">
            <Input
              type="number"
              min="0"
              max="10"
              value={draft.offerOverallRating ?? 0}
              onChange={(e) => setDraft({ ...draft, offerOverallRating: Number(e.target.value) })}
            />
          </Field>
        </div>
      </Panel>

      <ConfirmDialog
        open={deleteOpen}
        title="Delete job application?"
        message="This permanently deletes this job application."
        confirmLabel="Delete"
        danger
        onConfirm={() => void deleteJob()}
        onClose={() => setDeleteOpen(false)}
      />
    </div>
  )
}
