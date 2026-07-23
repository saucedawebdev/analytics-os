import Dexie, { type Table } from 'dexie'
import type {
  ActivityRecord,
  CareerGoal,
  DashboardPlan,
  Dataset,
  FocusItem,
  Formula,
  InterviewPractice,
  InterviewQuestion,
  JobApplication,
  KnowledgeAnnotation,
  KPI,
  LearningRecord,
  Note,
  PersonalKnowledgeEntry,
  PortfolioCaseStudy,
  Project,
  QuickCapture,
  RecentItem,
  Relationship,
  SkillRecord,
  SQLQuery,
  SQLQueryVersion,
  STARStory,
  Tag,
  ThinkingSession,
  UserPreferences,
} from '@/types'
import { SCHEMA_VERSION } from '@/types'
import { nowIso } from '@/utils'

export class AnalystOSDatabase extends Dexie {
  preferences!: Table<UserPreferences, string>
  personalKnowledge!: Table<PersonalKnowledgeEntry, string>
  knowledgeAnnotations!: Table<KnowledgeAnnotation, string>
  notes!: Table<Note, string>
  sqlQueries!: Table<SQLQuery, string>
  sqlQueryVersions!: Table<SQLQueryVersion, string>
  datasets!: Table<Dataset, string>
  projects!: Table<Project, string>
  thinkingSessions!: Table<ThinkingSession, string>
  kpis!: Table<KPI, string>
  formulas!: Table<Formula, string>
  dashboardPlans!: Table<DashboardPlan, string>
  portfolioCaseStudies!: Table<PortfolioCaseStudy, string>
  interviewQuestions!: Table<InterviewQuestion, string>
  interviewPractices!: Table<InterviewPractice, string>
  starStories!: Table<STARStory, string>
  careerGoals!: Table<CareerGoal, string>
  jobApplications!: Table<JobApplication, string>
  learningRecords!: Table<LearningRecord, string>
  skillRecords!: Table<SkillRecord, string>
  quickCaptures!: Table<QuickCapture, string>
  tags!: Table<Tag, string>
  relationships!: Table<Relationship, string>
  activities!: Table<ActivityRecord, string>
  focusItems!: Table<FocusItem, string>
  recentItems!: Table<RecentItem, string>
  meta!: Table<{ key: string; value: string }, string>

  constructor() {
    super('AnalystOS')
    this.version(1).stores({
      preferences: 'id',
      personalKnowledge: 'id, category, updatedAt, favorite, *tags',
      knowledgeAnnotations: 'id, knowledgeId, updatedAt',
      notes: 'id, type, updatedAt, favorite, pinned, relatedProjectId, *tags',
      sqlQueries: 'id, dialect, updatedAt, favorite, lastUsedAt, *tags, *projectIds',
      sqlQueryVersions: 'id, queryId, createdAt',
      datasets: 'id, name, updatedAt, qualityStatus, *tags, *projectIds',
      projects: 'id, status, priority, updatedAt, favorite, pinned, *tags',
      thinkingSessions: 'id, completed, updatedAt, projectId',
      kpis: 'id, name, industry, category, isBuiltIn, updatedAt, *tags',
      formulas: 'id, name, category, isBuiltIn, updatedAt, *tags',
      dashboardPlans: 'id, projectId, updatedAt, *tags',
      portfolioCaseStudies: 'id, projectId, updatedAt',
      interviewQuestions: 'id, category, difficulty, confidence, isBuiltIn, favorite, *tags',
      interviewPractices: 'id, questionId, createdAt',
      starStories: 'id, relatedProjectId, updatedAt',
      careerGoals: 'id, updatedAt',
      jobApplications: 'id, status, company, updatedAt, applicationDate',
      learningRecords: 'id, status, type, updatedAt',
      skillRecords: 'id, skill, confidence, updatedAt',
      quickCaptures: 'id, type, processed, createdAt, *tags',
      tags: 'id, name',
      relationships: 'id, fromType, fromId, toType, toId, createdAt',
      activities: 'id, type, createdAt, entityType, entityId',
      focusItems: 'id, completed, order, updatedAt',
      recentItems: 'id, type, openedAt',
      meta: 'key',
    })
  }
}

export const db = new AnalystOSDatabase()

export function defaultPreferences(): UserPreferences {
  return {
    id: 'preferences',
    displayName: '',
    theme: 'dark',
    accent: 'cyan',
    density: 'comfortable',
    fontSize: 'md',
    reducedMotion: false,
    defaultLandingPage: '/',
    dateFormat: 'MMM d, yyyy',
    sqlDialect: 'ansi',
    backupReminderDays: 7,
    lastBackupAt: null,
    demoDataInstalled: false,
    onboarded: false,
    schemaVersion: SCHEMA_VERSION,
    updatedAt: nowIso(),
  }
}

export async function ensurePreferences(): Promise<UserPreferences> {
  const existing = await db.preferences.get('preferences')
  if (existing) return existing
  const prefs = defaultPreferences()
  await db.preferences.put(prefs)
  return prefs
}

export async function getMeta(key: string): Promise<string | undefined> {
  const row = await db.meta.get(key)
  return row?.value
}

export async function setMeta(key: string, value: string): Promise<void> {
  await db.meta.put({ key, value })
}

export async function runMigrations(): Promise<void> {
  const current = await getMeta('schemaVersion')
  if (!current) {
    await setMeta('schemaVersion', String(SCHEMA_VERSION))
    await setMeta('builtinContentVersion', '0')
    return
  }
  const version = Number(current)
  // Future migrations go here — never wipe personal tables
  if (version < SCHEMA_VERSION) {
    await setMeta('schemaVersion', String(SCHEMA_VERSION))
  }
}
