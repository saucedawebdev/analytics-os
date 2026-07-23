import { useCallback, useState } from 'react'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Button } from '@/components/ui/Button'
import { Field, Input, Textarea } from '@/components/ui/Field'
import { Badge, EmptyState, PageHeader, Panel } from '@/components/ui/Panel'
import { ConfirmDialog } from '@/components/ui/Modal'
import { db } from '@/db'
import { useLiveQuery } from '@/hooks/useLiveQuery'
import { logActivity } from '@/services/data-service'
import type { STARStory } from '@/types'
import { joinList, newStarStory, splitList, withUpdated } from '@/pages/page-utils'

export default function StarStoriesPage() {
  const [refresh, setRefresh] = useState(0)
  const [active, setActive] = useState<STARStory | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<STARStory | null>(null)
  const loadStories = useCallback(async () => db.starStories.orderBy('updatedAt').reverse().toArray(), [refresh])
  const stories = useLiveQuery(loadStories, [], [] as STARStory[])

  async function createStory() {
    const story = newStarStory(window.prompt('STAR story title', 'New STAR story') ?? 'New STAR story')
    await db.starStories.add(story)
    await logActivity('interview', `Created STAR story ${story.title}`, {
      type: 'star_story',
      id: story.id,
    })
    setActive(story)
    setRefresh((v) => v + 1)
  }

  async function saveStory() {
    if (!active) return
    const next = withUpdated({ ...active, title: active.title.trim() || 'Untitled STAR story' })
    await db.starStories.put(next)
    await logActivity('interview', `Saved STAR story ${next.title}`, {
      type: 'star_story',
      id: next.id,
    })
    setActive(next)
    setRefresh((v) => v + 1)
  }

  async function deleteStory() {
    if (!deleteTarget) return
    await db.starStories.delete(deleteTarget.id)
    await logActivity('interview', `Deleted STAR story ${deleteTarget.title}`)
    if (active?.id === deleteTarget.id) setActive(null)
    setRefresh((v) => v + 1)
  }

  return (
    <div className="page stack">
      <PageHeader
        title="STAR Stories"
        subtitle="Create and maintain behavioral interview stories."
        breadcrumbs={<Breadcrumbs items={[{ label: 'Interview Lab', to: '/interview' }, { label: 'STAR Stories' }]} />}
        actions={
          <Button variant="primary" onClick={() => void createStory()}>
            New STAR story
          </Button>
        }
      />

      <div className="grid-2">
        <Panel title={`${stories.length} stor${stories.length === 1 ? 'y' : 'ies'}`}>
          {stories.length === 0 ? (
            <EmptyState
              title="No STAR stories"
              description="Create stories for behavioral prompts using Situation, Task, Action, and Result."
              action={<Button onClick={() => void createStory()}>Create story</Button>}
            />
          ) : (
            <div className="list">
              {stories.map((story) => (
                <button key={story.id} type="button" className="list-item" onClick={() => setActive(story)}>
                  <span className="spacer">
                    <strong>{story.title}</strong>
                    <span className="list-item-meta">{story.result || story.action || 'No result yet'}</span>
                  </span>
                  <Badge>{story.skillsDemonstrated.length} skills</Badge>
                </button>
              ))}
            </div>
          )}
        </Panel>

        <Panel
          title={active ? 'Edit story' : 'Story editor'}
          action={
            active ? (
              <Button variant="danger" size="sm" onClick={() => setDeleteTarget(active)}>
                Delete
              </Button>
            ) : null
          }
        >
          {active ? (
            <div className="stack">
              <Field label="Title">
                <Input value={active.title} onChange={(e) => setActive({ ...active, title: e.target.value })} />
              </Field>
              <Field label="Situation">
                <Textarea value={active.situation} onChange={(e) => setActive({ ...active, situation: e.target.value })} />
              </Field>
              <Field label="Task">
                <Textarea value={active.task} onChange={(e) => setActive({ ...active, task: e.target.value })} />
              </Field>
              <Field label="Action">
                <Textarea value={active.action} onChange={(e) => setActive({ ...active, action: e.target.value })} />
              </Field>
              <Field label="Result">
                <Textarea value={active.result} onChange={(e) => setActive({ ...active, result: e.target.value })} />
              </Field>
              <Field label="Lessons learned">
                <Textarea
                  value={active.lessonsLearned}
                  onChange={(e) => setActive({ ...active, lessonsLearned: e.target.value })}
                />
              </Field>
              <Field label="Skills demonstrated (comma-separated)">
                <Input
                  value={joinList(active.skillsDemonstrated)}
                  onChange={(e) => setActive({ ...active, skillsDemonstrated: splitList(e.target.value) })}
                />
              </Field>
              <Button variant="primary" onClick={() => void saveStory()}>
                Save STAR story
              </Button>
            </div>
          ) : (
            <EmptyState title="Select a story" description="Choose a story from the list or create a new one." />
          )}
        </Panel>
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete STAR story?"
        message={`This permanently deletes ${deleteTarget?.title ?? 'this story'}.`}
        confirmLabel="Delete"
        danger
        onConfirm={() => void deleteStory()}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  )
}
