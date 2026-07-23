import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Panel'
import type {
  CareerGoal,
  ConfidenceLevel,
  DashboardBlock,
  DashboardBlockType,
  DashboardPlan,
  Formula,
  InterviewQuestion,
  JobApplication,
  KPI,
  LearningRecord,
  Note,
  PortfolioCaseStudy,
  Project,
  QuickCapture,
  RecordType,
  SkillRecord,
  SQLQuery,
  STARStory,
} from '@/types'
import { timestamps, touchUpdated, truncate } from '@/utils'

export const CONFIDENCE_LEVELS: ConfidenceLevel[] = [
  'not_confident',
  'developing',
  'comfortable',
  'strong',
]

export const DASHBOARD_BLOCK_TYPES: DashboardBlockType[] = [
  'kpi_card',
  'line_chart',
  'bar_chart',
  'table',
  'filter',
  'text',
  'insight',
  'recommendation',
]

export const DEFAULT_DASHBOARD_CHECKLIST = [
  'Purpose and decision are clear',
  'Primary KPI is visible first',
  'Chart titles explain the takeaway',
  'Filters are necessary and labeled',
  'Refresh cadence and source are documented',
  'Colors and contrast are accessible',
]

export function splitList(text: string): string[] {
  return text
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

export function joinList(items: string[] | undefined): string {
  return (items ?? []).join(', ')
}

export function includesText(query: string, ...fields: Array<string | undefined | null>): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return fields.some((field) => (field ?? '').toLowerCase().includes(q))
}

export async function copyText(text: string): Promise<void> {
  if (navigator.clipboard) {
    await navigator.clipboard.writeText(text)
    return
  }
  const area = document.createElement('textarea')
  area.value = text
  document.body.append(area)
  area.select()
  document.execCommand('copy')
  area.remove()
}

export function DetailLink({
  to,
  title,
  meta,
  badges,
}: {
  to: string
  title: string
  meta?: string
  badges?: Array<{ label: string; tone?: Parameters<typeof Badge>[0]['tone'] }>
}) {
  return (
    <Link to={to} className="list-item">
      <div>
        <h3 className="list-item-title">{title}</h3>
        {meta ? <p className="list-item-meta">{truncate(meta, 180)}</p> : null}
      </div>
      <div className="row-wrap" style={{ justifyContent: 'flex-end' }}>
        {badges?.map((badge) => (
          <Badge key={badge.label} tone={badge.tone}>
            {badge.label}
          </Badge>
        ))}
      </div>
    </Link>
  )
}

export function PillButton({
  active,
  children,
  onClick,
}: {
  active: boolean
  children: string
  onClick: () => void
}) {
  return (
    <Button variant={active ? 'primary' : 'secondary'} size="sm" onClick={onClick}>
      {children}
    </Button>
  )
}

export function newDashboardPlan(name = 'Untitled dashboard plan'): DashboardPlan {
  return {
    ...timestamps(),
    name,
    projectId: null,
    audience: '',
    decisionSupported: '',
    primaryQuestion: '',
    kpiIds: [],
    charts: '',
    filters: '',
    dataSources: '',
    refreshFrequency: '',
    layoutNotes: '',
    colorNotes: '',
    accessibilityNotes: '',
    knownLimitations: '',
    publicationLocation: '',
    screenshots: [],
    blocks: [],
    checklist: DEFAULT_DASHBOARD_CHECKLIST.map((text) => ({
      id: timestamps().id,
      text,
      done: false,
    })),
    queryIds: [],
  }
}

export function newDashboardBlock(type: DashboardBlockType, count: number): DashboardBlock {
  return {
    id: timestamps().id,
    type,
    title: type.replace(/_/g, ' '),
    notes: '',
    row: Math.floor(count / 2),
    col: count % 2 === 0 ? 0 : 6,
    width: type === 'kpi_card' ? 3 : 6,
    height: type === 'kpi_card' ? 1 : 2,
  }
}

export function newPortfolioCaseStudy(title = 'Untitled case study'): PortfolioCaseStudy {
  return {
    ...timestamps(),
    title,
    projectId: null,
    oneSentenceSummary: '',
    businessProblem: '',
    dataset: '',
    tools: '',
    process: '',
    dataCleaning: '',
    analysis: '',
    dashboard: '',
    keyFindings: '',
    recommendations: '',
    challenges: '',
    lessonsLearned: '',
    screenshots: [],
    links: '',
    resumeAction: '',
    resumeMethod: '',
    resumeScope: '',
    resumeResult: '',
    resumeImpact: '',
    githubReadme: '',
    webpageCopy: '',
    resumeBullets: '',
    linkedinDescription: '',
    starStory: '',
  }
}

export function newInterviewQuestion(question = 'New interview question'): InterviewQuestion {
  return {
    ...timestamps(),
    question,
    category: 'Personal',
    difficulty: 'beginner',
    evaluating: '',
    keyConcepts: '',
    exampleOutline: '',
    commonMistakes: '',
    personalAnswer: '',
    confidence: 'not_confident',
    lastPracticedAt: null,
    practiceCount: 0,
    relatedProjectId: null,
    relatedKnowledgeIds: [],
    isBuiltIn: false,
  }
}

export function newStarStory(title = 'New STAR story'): STARStory {
  return {
    ...timestamps(),
    title,
    situation: '',
    task: '',
    action: '',
    result: '',
    lessonsLearned: '',
    relatedProjectId: null,
    skillsDemonstrated: [],
  }
}

export function newCareerGoal(): CareerGoal {
  return {
    ...timestamps(),
    targetRole: '',
    targetSalary: '',
    targetApplicationDate: '',
    targetEmploymentDate: '',
    skillsToDevelop: [],
    portfolioGoals: '',
    educationGoals: '',
    notes: '',
  }
}

export function newJobApplication(): JobApplication {
  return {
    ...timestamps(),
    company: '',
    jobTitle: '',
    jobUrl: '',
    location: '',
    remoteStatus: 'remote',
    salaryRange: '',
    applicationDate: '',
    status: 'saved',
    contact: '',
    followUpDate: '',
    interviewDates: '',
    notes: '',
    resumeVersion: '',
    portfolioProjectIds: [],
    offerSalary: '',
    offerBenefits: '',
    offerRemote: '',
    offerSchedule: '',
    offerGrowth: '',
    offerStability: '',
    offerCommute: '',
    offerOverallRating: 0,
  }
}

export function newLearningRecord(): LearningRecord {
  return {
    ...timestamps(),
    title: '',
    type: 'course',
    subject: '',
    status: 'planned',
    startDate: '',
    completionDate: '',
    notes: '',
    relatedSkills: [],
  }
}

export function newSkillRecord(): SkillRecord {
  return {
    ...timestamps(),
    skill: '',
    confidence: 'developing',
    evidence: '',
    relatedProjectIds: [],
    lastPracticedAt: null,
    nextAction: '',
  }
}

export function formulaFromCapture(capture: QuickCapture): Formula {
  return {
    ...timestamps(),
    name: capture.title,
    category: 'Other',
    subcategory: capture.type,
    syntax: capture.body,
    description: capture.body,
    purpose: '',
    whenToUse: '',
    example: '',
    commonMistakes: '',
    relatedFormulaIds: [],
    personalNotes: '',
    isBuiltIn: false,
    difficulty: 'beginner',
    tags: capture.tags,
  }
}

export function kpiFromCapture(capture: QuickCapture): KPI {
  return {
    ...timestamps(),
    name: capture.title,
    definition: capture.body,
    formula: '',
    purpose: '',
    whenToUse: '',
    interpretation: '',
    example: '',
    relatedCharts: '',
    commonMistakes: '',
    relatedKpiIds: [],
    industry: '',
    personalNotes: '',
    isBuiltIn: false,
    category: capture.type,
    tags: capture.tags,
  }
}

export function noteFromCapture(capture: QuickCapture): Note {
  return {
    ...timestamps(),
    title: capture.title,
    type: capture.type === 'business_definition' ? 'business_definition' : 'general',
    content: capture.body,
    source: 'Capture inbox',
    tags: capture.tags,
  }
}

export function sqlFromCapture(capture: QuickCapture): SQLQuery {
  return {
    ...timestamps(),
    title: capture.title,
    dialect: 'ansi',
    sql: capture.body,
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
    tags: capture.tags,
  }
}

export function interviewQuestionFromCapture(capture: QuickCapture): InterviewQuestion {
  return {
    ...newInterviewQuestion(capture.title),
    question: capture.title,
    exampleOutline: capture.body,
    tags: capture.tags,
  }
}

export function projectFromCapture(capture: QuickCapture): Project {
  return {
    ...timestamps(),
    title: capture.title,
    status: 'planning',
    priority: 'medium',
    startDate: '',
    targetDate: '',
    projectType: 'custom',
    businessArea: '',
    toolsUsed: [],
    summary: capture.body,
    originalRequest: capture.body,
    businessDecision: '',
    stakeholders: '',
    scope: '',
    outOfScope: '',
    successCriteria: '',
    primaryQuestion: '',
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
    checklist: [],
    statusUpdates: [],
    activityLog: [],
    tags: capture.tags,
  }
}

export function focusTypeLabel(type: RecordType | string): string {
  return type.replace(/_/g, ' ')
}

export function withUpdated<T extends { updatedAt: string; recordVersion?: number }>(record: T): T {
  return touchUpdated(record)
}
