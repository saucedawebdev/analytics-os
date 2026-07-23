import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Field'
import { Badge, EmptyState, PageHeader, Panel } from '@/components/ui/Panel'
import { db } from '@/db'
import type { Project, ProjectPriority, ProjectStatus } from '@/types'
import { formatDate, statusLabel } from '@/utils'
import { PROJECT_PRIORITIES, PROJECT_STATUSES } from '@/pages/pageUtils'
import { trackRecent } from '@/services/data-service'

type StatusFilter = ProjectStatus | 'all'
type PriorityFilter = ProjectPriority | 'all'

function projectTone(status: ProjectStatus): 'default' | 'success' | 'warning' | 'danger' {
  if (status === 'completed') return 'success'
  if (status === 'blocked') return 'danger'
  if (status === 'active') return 'warning'
  return 'default'
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [status, setStatus] = useState<StatusFilter>('all')
  const [priority, setPriority] = useState<PriorityFilter>('all')

  const load = useCallback(async () => {
    const rows = await db.projects.orderBy('updatedAt').reverse().toArray()
    setProjects(rows)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const filtered = useMemo(
    () =>
      projects.filter(
        (project) =>
          (status === 'all' || project.status === status) &&
          (priority === 'all' || project.priority === priority),
      ),
    [priority, projects, status],
  )

  return (
    <div className="page">
      <PageHeader
        title="Projects"
        subtitle="Plan, execute, document, and archive analytics work."
        actions={
          <Button variant="primary" onClick={() => undefined}>
            <Link to="/projects/new">New project</Link>
          </Button>
        }
      />

      <Panel>
        <div className="row-wrap">
          <label className="field">
            <span className="label">Status</span>
            <Select value={status} onChange={(event) => setStatus(event.target.value as StatusFilter)}>
              <option value="all">All statuses</option>
              {PROJECT_STATUSES.map((value) => (
                <option key={value} value={value}>
                  {statusLabel(value)}
                </option>
              ))}
            </Select>
          </label>
          <label className="field">
            <span className="label">Priority</span>
            <Select
              value={priority}
              onChange={(event) => setPriority(event.target.value as PriorityFilter)}
            >
              <option value="all">All priorities</option>
              {PROJECT_PRIORITIES.map((value) => (
                <option key={value} value={value}>
                  {statusLabel(value)}
                </option>
              ))}
            </Select>
          </label>
        </div>
      </Panel>

      <Panel title={`${filtered.length} project${filtered.length === 1 ? '' : 's'}`}>
        {filtered.length === 0 ? (
          <EmptyState
            title="No matching projects"
            description="Create a project or adjust the filters."
            action={
              <Button variant="primary" onClick={() => undefined}>
                <Link to="/projects/new">Create project</Link>
              </Button>
            }
          />
        ) : (
          <div className="list">
            {filtered.map((project) => (
              <Link
                key={project.id}
                className="list-item"
                to={`/projects/${project.id}`}
                onClick={() => void trackRecent('project', project.id, project.title)}
              >
                <div className="spacer">
                  <div className="row-wrap">
                    <p className="list-item-title">{project.title}</p>
                    {project.favorite ? <Badge tone="accent">Favorite</Badge> : null}
                    {project.pinned ? <Badge>Pinned</Badge> : null}
                  </div>
                  <p className="list-item-meta">
                    {project.summary || project.primaryQuestion || 'No summary yet'}
                  </p>
                  <p className="list-item-meta">
                    {statusLabel(project.projectType)} · Updated {formatDate(project.updatedAt)}
                  </p>
                </div>
                <div className="row-wrap">
                  <Badge tone={projectTone(project.status)}>{statusLabel(project.status)}</Badge>
                  <Badge>{statusLabel(project.priority)}</Badge>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Panel>
    </div>
  )
}
