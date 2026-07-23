import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Field'
import { Badge, EmptyState, PageHeader, Panel } from '@/components/ui/Panel'
import { db } from '@/db'
import { useLiveQuery } from '@/hooks/useLiveQuery'
import { logActivity } from '@/services/data-service'
import type { CaptureType, QuickCapture, RecordType } from '@/types'
import { timestamps } from '@/utils'
import {
  focusTypeLabel,
  formulaFromCapture,
  interviewQuestionFromCapture,
  kpiFromCapture,
  noteFromCapture,
  projectFromCapture,
  sqlFromCapture,
} from '@/pages/page-utils'

const CAPTURE_TYPES: CaptureType[] = [
  'note',
  'sql_query',
  'business_definition',
  'dataset_issue',
  'insight',
  'interview_question',
  'task',
  'project_idea',
  'formula',
  'kpi',
]

const CONVERT_TYPES: RecordType[] = [
  'note',
  'sql_query',
  'project',
  'formula',
  'kpi',
  'interview_question',
  'focus_item',
]

export default function CaptureInboxPage() {
  const [refresh, setRefresh] = useState(0)
  const [convertAs, setConvertAs] = useState<Record<string, RecordType>>({})
  const loadCaptures = useCallback(
    async () =>
      (
        await db.quickCaptures
          .where('processed')
          .equals(0)
          .toArray()
          .catch(async () => db.quickCaptures.filter((capture) => !capture.processed).toArray())
      )
        .filter((capture) => !capture.archivedAt)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [refresh],
  )
  const captures = useLiveQuery(loadCaptures, [], [] as QuickCapture[])

  async function categorize(capture: QuickCapture, type: CaptureType) {
    await db.quickCaptures.update(capture.id, { type, updatedAt: new Date().toISOString() })
    await logActivity('capture', `Categorized capture as ${type}`, { type: 'quick_capture', id: capture.id })
    setRefresh((v) => v + 1)
  }

  async function archive(capture: QuickCapture) {
    await db.quickCaptures.update(capture.id, {
      archivedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    await logActivity('capture', `Archived capture ${capture.title}`, { type: 'quick_capture', id: capture.id })
    setRefresh((v) => v + 1)
  }

  async function deleteCapture(capture: QuickCapture) {
    await db.quickCaptures.delete(capture.id)
    await logActivity('capture', `Deleted capture ${capture.title}`)
    setRefresh((v) => v + 1)
  }

  async function convert(capture: QuickCapture) {
    const targetType = convertAs[capture.id] ?? defaultConvertType(capture.type)
    let targetId = ''
    if (targetType === 'note') {
      const record = noteFromCapture(capture)
      targetId = record.id
      await db.notes.add(record)
    } else if (targetType === 'sql_query') {
      const record = sqlFromCapture(capture)
      targetId = record.id
      await db.sqlQueries.add(record)
    } else if (targetType === 'project') {
      const record = projectFromCapture(capture)
      targetId = record.id
      await db.projects.add(record)
    } else if (targetType === 'formula') {
      const record = formulaFromCapture(capture)
      targetId = record.id
      await db.formulas.add(record)
    } else if (targetType === 'kpi') {
      const record = kpiFromCapture(capture)
      targetId = record.id
      await db.kpis.add(record)
    } else if (targetType === 'interview_question') {
      const record = interviewQuestionFromCapture(capture)
      targetId = record.id
      await db.interviewQuestions.add(record)
    } else {
      const record = {
        ...timestamps(),
        text: `${capture.title}${capture.body ? ` — ${capture.body}` : ''}`,
        completed: false,
        completedAt: null,
        order: 0,
        carriedForward: false,
        tags: capture.tags,
      }
      targetId = record.id
      await db.focusItems.add(record)
    }
    await db.quickCaptures.update(capture.id, {
      processed: true,
      convertedToType: targetType,
      convertedToId: targetId,
      updatedAt: new Date().toISOString(),
    })
    await logActivity('capture', `Converted capture to ${targetType}`, {
      type: targetType,
      id: targetId,
    })
    setRefresh((v) => v + 1)
  }

  return (
    <div className="page stack">
      <PageHeader
        title="Capture Inbox"
        subtitle="Review unprocessed quick captures, categorize them, or convert them into records."
        breadcrumbs={<Breadcrumbs items={[{ label: 'Capture Inbox' }]} />}
      />

      <Panel title={`${captures.length} unprocessed capture${captures.length === 1 ? '' : 's'}`}>
        {captures.length === 0 ? (
          <EmptyState
            title="Inbox is clear"
            description="New quick captures will appear here until they are archived, deleted, or converted."
          />
        ) : (
          <div className="list">
            {captures.map((capture) => {
              const targetType = convertAs[capture.id] ?? defaultConvertType(capture.type)
              return (
                <div key={capture.id} className="list-item">
                  <div className="spacer">
                    <div className="row-wrap">
                      <h3 className="list-item-title">{capture.title}</h3>
                      <Badge>{capture.type}</Badge>
                    </div>
                    <p className="list-item-meta">{capture.body || 'No details'}</p>
                  </div>
                  <div className="row-wrap" style={{ justifyContent: 'flex-end' }}>
                    <Select value={capture.type} onChange={(e) => void categorize(capture, e.target.value as CaptureType)}>
                      {CAPTURE_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {focusTypeLabel(type)}
                        </option>
                      ))}
                    </Select>
                    <Select
                      value={targetType}
                      onChange={(e) => setConvertAs({ ...convertAs, [capture.id]: e.target.value as RecordType })}
                    >
                      {CONVERT_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {focusTypeLabel(type)}
                        </option>
                      ))}
                    </Select>
                    <Button variant="primary" size="sm" onClick={() => void convert(capture)}>
                      Convert
                    </Button>
                    <Button size="sm" onClick={() => void archive(capture)}>
                      Archive
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => void deleteCapture(capture)}>
                      Delete
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Panel>

      <Panel title="Converted records">
        <p className="list-item-meta">
          Converted captures open through their destination modules: <Link to="/notes">notes</Link>,{' '}
          <Link to="/sql">SQL</Link>, <Link to="/projects">projects</Link>, <Link to="/formulas">formulas</Link>,{' '}
          <Link to="/kpis">KPIs</Link>, and <Link to="/interview">Interview Lab</Link>.
        </p>
      </Panel>
    </div>
  )
}

function defaultConvertType(type: CaptureType): RecordType {
  if (type === 'sql_query') return 'sql_query'
  if (type === 'project_idea') return 'project'
  if (type === 'formula') return 'formula'
  if (type === 'kpi') return 'kpi'
  if (type === 'interview_question') return 'interview_question'
  if (type === 'task') return 'focus_item'
  return 'note'
}
