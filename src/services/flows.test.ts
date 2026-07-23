import { describe, expect, it, beforeEach } from 'vitest'
import { db, ensurePreferences } from '@/db'
import { createDemoData, removeDemoData } from '@/data/demo'
import { timestamps } from '@/utils'
import { logActivity } from '@/services/data-service'
import type { Note, SQLQuery } from '@/types'

describe('critical flows', () => {
  beforeEach(async () => {
    await db.delete()
    await db.open()
    await ensurePreferences()
  })

  it('creates a project and links a query and dataset via demo data', async () => {
    await createDemoData()
    const projects = await db.projects.toArray()
    const queries = await db.sqlQueries.toArray()
    const datasets = await db.datasets.toArray()
    expect(projects.length).toBeGreaterThan(0)
    expect(queries.length).toBeGreaterThan(0)
    expect(datasets.length).toBeGreaterThan(0)
    expect(projects[0]?.queryIds.length).toBeGreaterThan(0)
    expect(projects[0]?.datasetIds.length).toBeGreaterThan(0)
  })

  it('creates a note and sql query personally', async () => {
    const note: Note = {
      ...timestamps(),
      title: 'Assumption log',
      type: 'general',
      content: 'Customers are unique by customer_id',
      tags: ['assumptions'],
    }
    const query: SQLQuery = {
      ...timestamps(),
      title: 'Count customers',
      dialect: 'ansi',
      sql: 'SELECT COUNT(*) FROM customers;',
      explanation: 'Simple count',
      businessQuestion: 'How many customers?',
      tablesUsed: ['customers'],
      columnsUsed: [],
      difficulty: 'beginner',
      projectIds: [],
      datasetIds: [],
      relatedTopicIds: [],
      expectedOutput: 'One number',
      notes: '',
      commonMistakes: '',
    }
    await db.notes.put(note)
    await db.sqlQueries.put(query)
    await logActivity('create', 'Created note', { type: 'note', id: note.id })
    expect(await db.notes.count()).toBe(1)
    expect(await db.sqlQueries.count()).toBe(1)
    expect(await db.activities.count()).toBe(1)
  })

  it('removes demo data without wiping preferences', async () => {
    await createDemoData()
    await removeDemoData()
    expect(await db.projects.filter((p) => Boolean(p.isDemo)).count()).toBe(0)
    const prefs = await db.preferences.get('preferences')
    expect(prefs).toBeTruthy()
  })
})
