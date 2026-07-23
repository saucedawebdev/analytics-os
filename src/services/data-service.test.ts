import { describe, expect, it, beforeEach } from 'vitest'
import { db, ensurePreferences, defaultPreferences } from '@/db'
import { buildBackup, restoreBackup, validateBackup, linkRecords, getRelated, clearPersonalData } from '@/services/data-service'
import { timestamps } from '@/utils'
import type { Project } from '@/types'
import { SCHEMA_VERSION } from '@/types'

describe('database and backup', () => {
  beforeEach(async () => {
    await db.delete()
    await db.open()
    await ensurePreferences()
  })

  it('creates default preferences', async () => {
    const prefs = await ensurePreferences()
    expect(prefs.id).toBe('preferences')
    expect(prefs.theme).toBe(defaultPreferences().theme)
  })

  it('links records and returns relationships', async () => {
    const a = timestamps().id
    const b = timestamps().id
    await linkRecords({ type: 'project', id: a }, { type: 'sql_query', id: b }, 'uses')
    const rels = await getRelated({ type: 'project', id: a })
    expect(rels).toHaveLength(1)
    expect(rels[0]?.toId).toBe(b)
  })

  it('exports and restores a backup', async () => {
    const project = {
      ...timestamps(),
      title: 'Test Project',
      status: 'active',
      priority: 'medium',
      projectType: 'custom',
      businessArea: 'Test',
      toolsUsed: ['SQL'],
      summary: 'Summary',
      originalRequest: '',
      businessDecision: '',
      stakeholders: '',
      scope: '',
      outOfScope: '',
      successCriteria: '',
      primaryQuestion: 'What?',
      supportingQuestions: [],
      hypotheses: [],
      assumptions: [],
      risks: [],
      limitations: [],
      datasetIds: [],
      requiredFields: '',
      missingData: '',
      qualityIssues: '',
      cleaningPlan: '',
      cleaningLog: '',
      queryIds: [],
      excelWork: '',
      pythonWork: '',
      calculations: '',
      kpiIds: [],
      findings: [],
      validationSteps: '',
      dashboardIds: [],
      chartNotes: '',
      designNotes: '',
      filters: '',
      audience: '',
      keyInsights: '',
      recommendations: '',
      expectedImpact: '',
      nextSteps: '',
      openQuestions: '',
      lessonsLearned: '',
      decisions: '',
      meetingNotes: '',
      relatedKnowledgeIds: [],
      milestones: [],
      checklist: [],
      statusUpdates: [],
      activityLog: [],
      tags: [],
      favorite: false,
      pinned: false,
      schemaVersion: SCHEMA_VERSION,
    } satisfies Project

    await db.projects.put(project)
    const backup = await buildBackup()
    expect(validateBackup(backup)).toBe(true)
    expect(backup.projects).toHaveLength(1)

    await clearPersonalData()
    expect(await db.projects.count()).toBe(0)

    await restoreBackup(backup, 'replace')
    expect(await db.projects.count()).toBe(1)
    const restored = await db.projects.toArray()
    expect(restored[0]?.title).toBe('Test Project')
  })

  it('rejects invalid backup payloads', () => {
    expect(validateBackup(null)).toBe(false)
    expect(validateBackup({ hello: 'world' })).toBe(false)
  })
})
