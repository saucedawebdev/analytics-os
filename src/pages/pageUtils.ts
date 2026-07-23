import type {
  ConfidenceLevel,
  Dataset,
  DatasetColumn,
  DatasetTransformation,
  Difficulty,
  FocusItem,
  ISODate,
  KnowledgeAnnotation,
  Note,
  NoteType,
  PersonalKnowledgeEntry,
  Project,
  ProjectPriority,
  ProjectStatus,
  ProjectType,
  QualityStatus,
  Sensitivity,
  SQLQuery,
  SqlDialect,
  ThinkingAnswers,
  ThinkingSession,
} from '@/types'
import { KNOWLEDGE_CATEGORIES } from '@/types'
import { createId, nowIso, timestamps, toCsv } from '@/utils'

export const PROJECT_STATUSES: ProjectStatus[] = [
  'planning',
  'active',
  'blocked',
  'completed',
  'archived',
]

export const PROJECT_PRIORITIES: ProjectPriority[] = ['low', 'medium', 'high', 'critical']

export const PROJECT_TYPES: ProjectType[] = [
  'eda',
  'sales',
  'churn',
  'funnel',
  'retention',
  'operations',
  'inventory',
  'financial',
  'dashboard',
  'sql_portfolio',
  'custom',
]

export const SQL_DIALECTS: SqlDialect[] = [
  'ansi',
  'postgresql',
  'mysql',
  'sqlite',
  'sqlserver',
  'bigquery',
  'snowflake',
]

export const DIFFICULTIES: Difficulty[] = ['beginner', 'intermediate', 'advanced']
export const CONFIDENCE_LEVELS: ConfidenceLevel[] = [
  'not_confident',
  'developing',
  'comfortable',
  'strong',
]
export const REVIEW_STATUSES = ['not_started', 'in_progress', 'reviewed', 'mastered'] as const
export const NOTE_TYPES: NoteType[] = [
  'general',
  'sql',
  'excel_formula',
  'dashboard',
  'meeting',
  'business_definition',
  'data_quality',
  'insight',
  'lesson_learned',
  'interview_answer',
  'project_decision',
  'research',
]
export const QUALITY_STATUSES: QualityStatus[] = ['unknown', 'good', 'needs_attention', 'poor']
export const SENSITIVITIES: Sensitivity[] = ['public', 'internal', 'confidential', 'restricted']
export const KNOWLEDGE_CATEGORY_ORDER = KNOWLEDGE_CATEGORIES

export type SaveStatusSetter = (status: 'idle' | 'saving' | 'saved' | 'error') => void

export function splitLines(value: string): string[] {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

export function splitCsv(value: string): string[] {
  return value
    .split(',')
    .map((line) => line.trim())
    .filter(Boolean)
}

export function joinLines(values: string[] | undefined): string {
  return (values ?? []).join('\n')
}

export function joinCsv(values: string[] | undefined): string {
  return (values ?? []).join(', ')
}

export function dateInput(iso?: string | null): string {
  return iso ? iso.slice(0, 10) : ''
}

export async function runSave<T>(setSaveStatus: SaveStatusSetter, action: () => Promise<T>): Promise<T> {
  setSaveStatus('saving')
  try {
    const result = await action()
    setSaveStatus('saved')
    window.setTimeout(() => setSaveStatus('idle'), 1400)
    return result
  } catch (error) {
    setSaveStatus('error')
    throw error
  }
}

export function makeChecklist(items: string[]): { id: string; text: string; done: boolean }[] {
  return items.map((text) => ({ id: createId(), text, done: false }))
}

export function emptyThinkingAnswers(): ThinkingAnswers {
  return {
    requested: '',
    whoRequested: '',
    decisionSupported: '',
    actionFollow: '',
    primaryQuestion: '',
    supportingQuestions: '',
    successMeaning: '',
    ambiguousTerms: '',
    metricDefinitions: '',
    populationIncluded: '',
    populationExcluded: '',
    timeframe: '',
    detailLevel: '',
    inclusions: '',
    datasetsNeeded: '',
    columnsNeeded: '',
    joinsRequired: '',
    missingData: '',
    assumptions: '',
    biasRisks: '',
    seasonality: '',
    duplicateRisk: '',
    misleadingMetric: '',
    calculations: '',
    sqlPatterns: '',
    comparisons: '',
    validationChecks: '',
    audience: '',
    audienceNeeds: '',
    chartTypes: '',
    recommendation: '',
  }
}

export function createFocusItem(text: string, order: number): FocusItem {
  return {
    ...timestamps(),
    text,
    completed: false,
    completedAt: null,
    order,
    carriedForward: false,
  }
}

export function createProject(type: ProjectType = 'custom'): Project {
  const defaults = projectTemplate(type)
  return {
    ...timestamps(),
    title: defaults.title,
    status: 'planning',
    priority: 'medium',
    startDate: dateInput(nowIso()),
    targetDate: '',
    completionDate: '',
    projectType: type,
    businessArea: '',
    toolsUsed: [],
    summary: defaults.summary,
    originalRequest: '',
    businessDecision: '',
    stakeholders: '',
    scope: '',
    outOfScope: '',
    successCriteria: '',
    primaryQuestion: defaults.primaryQuestion,
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
    portfolioCaseStudyId: null,
    interviewStoryId: null,
    milestones: [],
    checklist: makeChecklist(defaults.checklist),
    statusUpdates: [],
    activityLog: [],
  }
}

export function projectTemplate(type: ProjectType): {
  title: string
  summary: string
  primaryQuestion: string
  checklist: string[]
} {
  const shared = ['Confirm business question', 'Inventory data sources', 'Validate results', 'Document recommendation']
  const templates: Record<ProjectType, { title: string; summary: string; primaryQuestion: string; checklist: string[] }> = {
    eda: {
      title: 'New exploratory analysis',
      summary: 'Explore patterns, outliers, and drivers in a dataset.',
      primaryQuestion: 'What patterns or risks should stakeholders know about?',
      checklist: [...shared, 'Profile columns', 'Segment key metrics'],
    },
    sales: {
      title: 'New sales analysis',
      summary: 'Analyze sales performance, mix, trend, and opportunities.',
      primaryQuestion: 'Where is sales performance changing and why?',
      checklist: [...shared, 'Define revenue metrics', 'Compare segments'],
    },
    churn: {
      title: 'New churn analysis',
      summary: 'Identify churn patterns, risk factors, and retention opportunities.',
      primaryQuestion: 'Which customers are most likely to churn?',
      checklist: [...shared, 'Define churn event', 'Compare retained vs churned cohorts'],
    },
    funnel: {
      title: 'New funnel analysis',
      summary: 'Measure conversion drop-offs across a business funnel.',
      primaryQuestion: 'Where do users drop off and what can improve conversion?',
      checklist: [...shared, 'Map funnel stages', 'Calculate stage conversion'],
    },
    retention: {
      title: 'New retention analysis',
      summary: 'Track repeat behavior and cohort health over time.',
      primaryQuestion: 'How does retention vary by cohort?',
      checklist: [...shared, 'Define cohort date', 'Build retention matrix'],
    },
    operations: {
      title: 'New operations analysis',
      summary: 'Review process performance, bottlenecks, and service levels.',
      primaryQuestion: 'Which process constraints create the biggest impact?',
      checklist: [...shared, 'Map process stages', 'Quantify cycle time'],
    },
    inventory: {
      title: 'New inventory analysis',
      summary: 'Assess inventory levels, stockouts, turns, and planning risk.',
      primaryQuestion: 'Which products need inventory action?',
      checklist: [...shared, 'Define SKU grain', 'Calculate stockout and overstock risk'],
    },
    financial: {
      title: 'New financial analysis',
      summary: 'Analyze financial performance, variance, and forecast signals.',
      primaryQuestion: 'What explains financial variance from plan?',
      checklist: [...shared, 'Confirm accounting definitions', 'Reconcile totals'],
    },
    dashboard: {
      title: 'New dashboard project',
      summary: 'Design a decision-ready dashboard with trusted KPIs.',
      primaryQuestion: 'What decisions should this dashboard support?',
      checklist: [...shared, 'Define audience', 'Sketch dashboard layout'],
    },
    sql_portfolio: {
      title: 'New SQL portfolio project',
      summary: 'Build a polished SQL analysis suitable for portfolio review.',
      primaryQuestion: 'What business story will the SQL analysis prove?',
      checklist: [...shared, 'Write reusable SQL', 'Prepare README narrative'],
    },
    custom: {
      title: 'New analysis project',
      summary: '',
      primaryQuestion: '',
      checklist: shared,
    },
  }
  return templates[type]
}

export function createSqlQuery(): SQLQuery {
  return {
    ...timestamps(),
    title: 'Untitled query',
    dialect: 'sqlite',
    sql: '-- Write SQL here\nSELECT 1 AS example;',
    explanation: '',
    businessQuestion: '',
    tablesUsed: [],
    columnsUsed: [],
    difficulty: 'beginner',
    projectIds: [],
    datasetIds: [],
    relatedTopicIds: [],
    expectedOutput: '',
    notes: '',
    commonMistakes: '',
    lastUsedAt: null,
    isTemplate: false,
    favorite: false,
    tags: [],
  }
}

export function createNote(type: NoteType = 'general'): Note {
  return {
    ...timestamps(),
    title: noteTemplateTitle(type),
    type,
    content: noteTemplateContent(type),
    source: '',
    relatedProjectId: null,
    relatedDatasetId: null,
    relatedQueryId: null,
    relatedKpiId: null,
    relatedSkill: null,
    relatedBuiltinId: null,
    checklist: [],
    favorite: false,
    pinned: false,
    tags: [],
  }
}

export function noteTemplateTitle(type: NoteType): string {
  const labels: Record<NoteType, string> = {
    general: 'Untitled note',
    sql: 'SQL note',
    excel_formula: 'Excel formula note',
    dashboard: 'Dashboard note',
    meeting: 'Meeting notes',
    business_definition: 'Business definition',
    data_quality: 'Data quality note',
    insight: 'Insight note',
    lesson_learned: 'Lesson learned',
    interview_answer: 'Interview answer',
    project_decision: 'Project decision',
    research: 'Research note',
  }
  return labels[type]
}

export function noteTemplateContent(type: NoteType): string {
  const templates: Record<NoteType, string> = {
    general: '',
    sql: '## Query intent\n\n## Tables\n\n## Caveats\n',
    excel_formula: '## Formula\n\n## When to use\n\n## Example\n',
    dashboard: '## Audience\n\n## Metrics\n\n## Layout notes\n',
    meeting: '## Attendees\n\n## Decisions\n\n## Action items\n',
    business_definition: '## Definition\n\n## Owner\n\n## Examples\n',
    data_quality: '## Issue\n\n## Impact\n\n## Fix\n',
    insight: '## Observation\n\n## Evidence\n\n## Recommendation\n',
    lesson_learned: '## Context\n\n## Lesson\n\n## Next time\n',
    interview_answer: '## Question\n\n## Answer\n\n## Evidence\n',
    project_decision: '## Decision\n\n## Rationale\n\n## Follow-up\n',
    research: '## Question\n\n## Sources\n\n## Findings\n',
  }
  return templates[type]
}

export function createDataset(): Dataset {
  return {
    ...timestamps(),
    name: 'Untitled dataset',
    description: '',
    source: '',
    owner: '',
    fileType: 'csv',
    location: '',
    dateRangeStart: '',
    dateRangeEnd: '',
    refreshFrequency: '',
    rowCount: 0,
    columnCount: 0,
    grain: '',
    primaryKey: '',
    relatedTables: [],
    sensitivity: 'internal',
    qualityStatus: 'unknown',
    knownIssues: '',
    notes: '',
    columns: [],
    cleaningLog: [],
    transformations: [],
    projectIds: [],
    queryIds: [],
    dashboardIds: [],
    profileSummary: '',
    csvPreview: '',
    tags: [],
  }
}

export function createThinkingSession(): ThinkingSession {
  return {
    ...timestamps(),
    title: 'New thinking session',
    currentStep: 0,
    completed: false,
    answers: emptyThinkingAnswers(),
    projectId: null,
    noteId: null,
    tags: [],
  }
}

export function createAnnotation(knowledgeId: string): KnowledgeAnnotation {
  const now = nowIso()
  return {
    id: knowledgeId,
    knowledgeId,
    personalNotes: '',
    confidence: 'not_confident',
    reviewStatus: 'not_started',
    favorite: false,
    tags: [],
    createdAt: now,
    updatedAt: now,
  }
}

export function duplicateKnowledge(entry: {
  id: string
  title: string
  category: PersonalKnowledgeEntry['category']
  subcategory: string
  difficulty: Difficulty
  summary: string
  whatItDoes: string
  whyItMatters: string
  whenToUse: string
  syntaxOrFormula: string
  businessExample: string
  workedExample: string
  commonMistakes: string
  bestPractices: string
  relatedTopicIds: string[]
  practicePrompt: string
  interviewQuestion: string
}): PersonalKnowledgeEntry {
  return {
    ...timestamps(),
    title: `${entry.title} (personal copy)`,
    category: entry.category,
    subcategory: entry.subcategory,
    difficulty: entry.difficulty,
    summary: entry.summary,
    whatItDoes: entry.whatItDoes,
    whyItMatters: entry.whyItMatters,
    whenToUse: entry.whenToUse,
    syntaxOrFormula: entry.syntaxOrFormula,
    businessExample: entry.businessExample,
    workedExample: entry.workedExample,
    commonMistakes: entry.commonMistakes,
    bestPractices: entry.bestPractices,
    relatedTopicIds: entry.relatedTopicIds,
    practicePrompt: entry.practicePrompt,
    interviewQuestion: entry.interviewQuestion,
    personalNotes: '',
    confidence: 'developing',
    reviewStatus: 'in_progress',
    duplicatedFromId: entry.id,
    isBuiltIn: false,
    tags: [],
    favorite: false,
  }
}

export function projectToMarkdown(project: Project): string {
  const section = (title: string, body: string) => `## ${title}\n\n${body || '_Not documented_'}\n`
  return [
    `# ${project.title}`,
    `Status: ${project.status}`,
    `Priority: ${project.priority}`,
    section('Summary', project.summary),
    section('Business decision', project.businessDecision),
    section('Primary question', project.primaryQuestion),
    section('Supporting questions', joinLines(project.supportingQuestions)),
    section('Data', `Datasets: ${joinCsv(project.datasetIds)}\n\nRequired fields: ${project.requiredFields}`),
    section('Analysis', `${project.excelWork}\n\n${project.pythonWork}\n\n${project.calculations}`),
    section('Findings', project.findings.map((f) => `- ${f.title}: ${f.detail} Impact: ${f.impact}`).join('\n')),
    section('Recommendations', project.recommendations),
    section('Next steps', project.nextSteps),
  ].join('\n')
}

export function thinkingPlan(session: ThinkingSession): string {
  const a = session.answers
  return [
    `# ${session.title}`,
    '## Request',
    a.requested,
    '## Decision supported',
    a.decisionSupported,
    '## Primary question',
    a.primaryQuestion,
    '## Scope',
    `Included: ${a.populationIncluded}\nExcluded: ${a.populationExcluded}\nTimeframe: ${a.timeframe}\nDetail level: ${a.detailLevel}\nOther inclusions: ${a.inclusions}`,
    '## Data plan',
    `Datasets: ${a.datasetsNeeded}\nColumns: ${a.columnsNeeded}\nJoins: ${a.joinsRequired}\nMissing data: ${a.missingData}`,
    '## Risk checks',
    `Assumptions: ${a.assumptions}\nBias risks: ${a.biasRisks}\nSeasonality: ${a.seasonality}\nDuplicates: ${a.duplicateRisk}\nMisleading metrics: ${a.misleadingMetric}`,
    '## Analysis plan',
    `Calculations: ${a.calculations}\nSQL patterns: ${a.sqlPatterns}\nComparisons: ${a.comparisons}\nValidation: ${a.validationChecks}`,
    '## Communication',
    `Audience: ${a.audience}\nNeeds: ${a.audienceNeeds}\nCharts: ${a.chartTypes}\nRecommendation: ${a.recommendation}`,
  ].join('\n\n')
}

export type CsvProfile = {
  columns: DatasetColumn[]
  summary: string
  rowCount: number
  columnCount: number
}

export function profileCsv(headers: string[], rows: string[][]): CsvProfile {
  const sampleRows = rows.slice(0, 500)
  const columns = headers.map((name, index) => {
    const values = sampleRows.map((row) => row[index] ?? '')
    const nonMissing = values.filter((value) => value.trim() !== '')
    const numeric = nonMissing.map((value) => Number(value)).filter((value) => Number.isFinite(value))
    const type =
      nonMissing.length > 0 && numeric.length === nonMissing.length
        ? 'number'
        : nonMissing.every((value) => !Number.isNaN(Date.parse(value)))
          ? 'date'
          : 'text'
    const unique = new Set(nonMissing).size
    const missing = values.length - nonMissing.length
    const numericSummary =
      numeric.length > 0
        ? ` min ${Math.min(...numeric).toFixed(2)}, max ${Math.max(...numeric).toFixed(2)}, avg ${(
            numeric.reduce((sum, value) => sum + value, 0) / numeric.length
          ).toFixed(2)}`
        : ''
    return {
      id: createId(),
      name: name || `column_${index + 1}`,
      dataType: type,
      description: '',
      businessMeaning: '',
      exampleValue: nonMissing[0] ?? '',
      allowedValues: unique <= 12 ? Array.from(new Set(nonMissing)).join(', ') : '',
      nullable: missing > 0,
      isKey: unique === rows.length && missing === 0,
      knownIssues: missing > 0 ? `${missing} missing values` : '',
      missingCount: missing,
      uniqueCount: unique,
      numericSummary,
    }
  })

  const summary = [
    `${rows.length} rows, ${headers.length} columns profiled from CSV.`,
    ...columns.map((column) => {
      const extra = 'numericSummary' in column ? (column as DatasetColumn & { numericSummary?: string }).numericSummary : ''
      return `- ${column.name}: ${column.dataType}, ${column.missingCount ?? 0} missing, ${column.uniqueCount ?? 0} unique${extra ?? ''}`
    }),
  ].join('\n')

  return { columns, summary, rowCount: rows.length, columnCount: headers.length }
}

export function csvRowsToObjects(headers: string[], rows: string[][]): Record<string, string>[] {
  return rows.map((row) =>
    headers.reduce<Record<string, string>>((acc, header, index) => {
      acc[header || `column_${index + 1}`] = row[index] ?? ''
      return acc
    }, {}),
  )
}

export function objectsToCsv(rows: Record<string, string>[]): string {
  return toCsv(rows)
}

export function transformation(type: DatasetTransformation['type'], params: DatasetTransformation['params'] = {}): DatasetTransformation {
  return {
    id: createId(),
    type,
    params,
    appliedAt: nowIso(),
    reversible: false,
  }
}

export function withUpdatedAt<T extends { updatedAt: ISODate; recordVersion?: number }>(record: T): T {
  return {
    ...record,
    updatedAt: nowIso(),
    recordVersion: (record.recordVersion ?? 1) + 1,
  }
}
