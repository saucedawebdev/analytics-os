import type {
  ActivityRecord,
  AnalystOSBackup,
  BackupManifest,
  EntityRef,
  RecordType,
  Relationship,
} from '@/types'
import { BACKUP_VERSION, SCHEMA_VERSION } from '@/types'
import { db } from '@/db'
import { createId, nowIso } from '@/utils'

export async function logActivity(
  type: string,
  summary: string,
  entity?: EntityRef,
): Promise<void> {
  const record: ActivityRecord = {
    id: createId(),
    type,
    summary,
    entityType: entity?.type,
    entityId: entity?.id,
    createdAt: nowIso(),
  }
  await db.activities.add(record)
  const count = await db.activities.count()
  if (count > 500) {
    const old = await db.activities.orderBy('createdAt').limit(count - 500).toArray()
    await db.activities.bulkDelete(old.map((o) => o.id))
  }
}

export async function trackRecent(type: RecordType, id: string, title: string): Promise<void> {
  await db.recentItems.put({
    id: `${type}:${id}`,
    type,
    title,
    openedAt: nowIso(),
  })
  const all = await db.recentItems.orderBy('openedAt').reverse().toArray()
  if (all.length > 40) {
    await db.recentItems.bulkDelete(all.slice(40).map((r) => r.id))
  }
}

export async function linkRecords(
  from: EntityRef,
  to: EntityRef,
  label?: string,
): Promise<Relationship> {
  const existing = await db.relationships
    .where({ fromType: from.type, fromId: from.id, toType: to.type, toId: to.id })
    .first()
  if (existing) return existing
  const rel: Relationship = {
    id: createId(),
    fromType: from.type,
    fromId: from.id,
    toType: to.type,
    toId: to.id,
    label,
    createdAt: nowIso(),
  }
  await db.relationships.add(rel)
  return rel
}

export async function unlinkRecords(from: EntityRef, to: EntityRef): Promise<void> {
  const rows = await db.relationships
    .filter(
      (r) =>
        (r.fromType === from.type &&
          r.fromId === from.id &&
          r.toType === to.type &&
          r.toId === to.id) ||
        (r.fromType === to.type &&
          r.fromId === to.id &&
          r.toType === from.type &&
          r.toId === from.id),
    )
    .toArray()
  await db.relationships.bulkDelete(rows.map((r) => r.id))
}

export async function getRelated(entity: EntityRef): Promise<Relationship[]> {
  const all = await db.relationships.toArray()
  return all.filter(
    (r) =>
      (r.fromType === entity.type && r.fromId === entity.id) ||
      (r.toType === entity.type && r.toId === entity.id),
  )
}

export async function buildBackup(): Promise<AnalystOSBackup> {
  const [
    preferences,
    personalKnowledge,
    knowledgeAnnotations,
    notes,
    sqlQueries,
    sqlQueryVersions,
    datasets,
    projects,
    thinkingSessions,
    kpis,
    formulas,
    dashboardPlans,
    portfolioCaseStudies,
    interviewQuestions,
    interviewPractices,
    starStories,
    careerGoals,
    jobApplications,
    learningRecords,
    skillRecords,
    quickCaptures,
    tags,
    relationships,
    activities,
    focusItems,
    recentItems,
  ] = await Promise.all([
    db.preferences.toArray(),
    db.personalKnowledge.toArray(),
    db.knowledgeAnnotations.toArray(),
    db.notes.filter((n) => !n.isBuiltIn).toArray(),
    db.sqlQueries.toArray(),
    db.sqlQueryVersions.toArray(),
    db.datasets.toArray(),
    db.projects.toArray(),
    db.thinkingSessions.toArray(),
    db.kpis.filter((k) => !k.isBuiltIn).toArray(),
    db.formulas.filter((f) => !f.isBuiltIn).toArray(),
    db.dashboardPlans.toArray(),
    db.portfolioCaseStudies.toArray(),
    db.interviewQuestions.filter((q) => !q.isBuiltIn).toArray(),
    db.interviewPractices.toArray(),
    db.starStories.toArray(),
    db.careerGoals.toArray(),
    db.jobApplications.toArray(),
    db.learningRecords.toArray(),
    db.skillRecords.toArray(),
    db.quickCaptures.toArray(),
    db.tags.toArray(),
    db.relationships.toArray(),
    db.activities.toArray(),
    db.focusItems.toArray(),
    db.recentItems.toArray(),
  ])

  const prefs = preferences[0]
  if (!prefs) throw new Error('Preferences missing')

  const manifest: BackupManifest = {
    backupVersion: BACKUP_VERSION,
    schemaVersion: SCHEMA_VERSION,
    exportedAt: nowIso(),
    appName: 'AnalystOS',
    appVersion: '1.0.0',
    recordCounts: {
      personalKnowledge: personalKnowledge.length,
      notes: notes.length,
      sqlQueries: sqlQueries.length,
      datasets: datasets.length,
      projects: projects.length,
      thinkingSessions: thinkingSessions.length,
      kpis: kpis.length,
      formulas: formulas.length,
      dashboardPlans: dashboardPlans.length,
      portfolioCaseStudies: portfolioCaseStudies.length,
      interviewQuestions: interviewQuestions.length,
      starStories: starStories.length,
      careerGoals: careerGoals.length,
      jobApplications: jobApplications.length,
      learningRecords: learningRecords.length,
      skillRecords: skillRecords.length,
      quickCaptures: quickCaptures.length,
      relationships: relationships.length,
    },
  }

  return {
    manifest,
    preferences: prefs,
    personalKnowledge,
    knowledgeAnnotations,
    notes,
    sqlQueries,
    sqlQueryVersions,
    datasets,
    projects,
    thinkingSessions,
    kpis,
    formulas,
    dashboardPlans,
    portfolioCaseStudies,
    interviewQuestions,
    interviewPractices,
    starStories,
    careerGoals,
    jobApplications,
    learningRecords,
    skillRecords,
    quickCaptures,
    tags,
    relationships,
    activities,
    focusItems,
    recentItems,
  }
}

export function validateBackup(data: unknown): data is AnalystOSBackup {
  if (!data || typeof data !== 'object') return false
  const b = data as AnalystOSBackup
  return Boolean(b.manifest && b.preferences && Array.isArray(b.projects) && Array.isArray(b.notes))
}

export async function restoreBackup(
  backup: AnalystOSBackup,
  mode: 'replace' | 'merge' = 'replace',
): Promise<void> {
  if (mode === 'replace') {
    await clearPersonalData(false)
  }
  await db.transaction(
    'rw',
    [
      db.preferences,
      db.personalKnowledge,
      db.knowledgeAnnotations,
      db.notes,
      db.sqlQueries,
      db.sqlQueryVersions,
      db.datasets,
      db.projects,
      db.thinkingSessions,
      db.kpis,
      db.formulas,
      db.dashboardPlans,
      db.portfolioCaseStudies,
      db.interviewQuestions,
      db.interviewPractices,
      db.starStories,
      db.careerGoals,
      db.jobApplications,
      db.learningRecords,
      db.skillRecords,
      db.quickCaptures,
      db.tags,
      db.relationships,
      db.activities,
      db.focusItems,
      db.recentItems,
    ],
    async () => {
      await db.preferences.put(backup.preferences)
      const putAll = async <T>(table: { bulkPut: (items: T[]) => Promise<unknown> }, items: T[]) => {
        if (items.length) await table.bulkPut(items)
      }
      await putAll(db.personalKnowledge, backup.personalKnowledge)
      await putAll(db.knowledgeAnnotations, backup.knowledgeAnnotations)
      await putAll(db.notes, backup.notes)
      await putAll(db.sqlQueries, backup.sqlQueries)
      await putAll(db.sqlQueryVersions, backup.sqlQueryVersions)
      await putAll(db.datasets, backup.datasets)
      await putAll(db.projects, backup.projects)
      await putAll(db.thinkingSessions, backup.thinkingSessions)
      await putAll(db.kpis, backup.kpis)
      await putAll(db.formulas, backup.formulas)
      await putAll(db.dashboardPlans, backup.dashboardPlans)
      await putAll(db.portfolioCaseStudies, backup.portfolioCaseStudies)
      await putAll(db.interviewQuestions, backup.interviewQuestions)
      await putAll(db.interviewPractices, backup.interviewPractices)
      await putAll(db.starStories, backup.starStories)
      await putAll(db.careerGoals, backup.careerGoals)
      await putAll(db.jobApplications, backup.jobApplications)
      await putAll(db.learningRecords, backup.learningRecords)
      await putAll(db.skillRecords, backup.skillRecords)
      await putAll(db.quickCaptures, backup.quickCaptures)
      await putAll(db.tags, backup.tags)
      await putAll(db.relationships, backup.relationships)
      await putAll(db.activities, backup.activities)
      await putAll(db.focusItems, backup.focusItems)
      await putAll(db.recentItems, backup.recentItems)
    },
  )
}

export async function clearPersonalData(keepPreferences = true): Promise<void> {
  await db.transaction(
    'rw',
    [
      db.preferences,
      db.personalKnowledge,
      db.knowledgeAnnotations,
      db.notes,
      db.sqlQueries,
      db.sqlQueryVersions,
      db.datasets,
      db.projects,
      db.thinkingSessions,
      db.kpis,
      db.formulas,
      db.dashboardPlans,
      db.portfolioCaseStudies,
      db.interviewQuestions,
      db.interviewPractices,
      db.starStories,
      db.careerGoals,
      db.jobApplications,
      db.learningRecords,
      db.skillRecords,
      db.quickCaptures,
      db.tags,
      db.relationships,
      db.activities,
      db.focusItems,
      db.recentItems,
    ],
    async () => {
      await db.personalKnowledge.clear()
      await db.knowledgeAnnotations.clear()
      await db.notes.filter((n) => !n.isBuiltIn).delete()
      await db.sqlQueries.clear()
      await db.sqlQueryVersions.clear()
      await db.datasets.clear()
      await db.projects.clear()
      await db.thinkingSessions.clear()
      await db.kpis.filter((k) => !k.isBuiltIn).delete()
      await db.formulas.filter((f) => !f.isBuiltIn).delete()
      await db.dashboardPlans.clear()
      await db.portfolioCaseStudies.clear()
      await db.interviewQuestions.filter((q) => !q.isBuiltIn).delete()
      await db.interviewPractices.clear()
      await db.starStories.clear()
      await db.careerGoals.clear()
      await db.jobApplications.clear()
      await db.learningRecords.clear()
      await db.skillRecords.clear()
      await db.quickCaptures.clear()
      await db.tags.clear()
      await db.relationships.clear()
      await db.activities.clear()
      await db.focusItems.clear()
      await db.recentItems.clear()
      if (!keepPreferences) {
        // leave prefs table; caller may replace
      }
    },
  )
}
