/** AnalystOS schema version — bump when storage shape changes */
export const SCHEMA_VERSION = 1
export const BACKUP_VERSION = 1
export const BUILTIN_CONTENT_VERSION = 1

export type ID = string
export type ISODate = string

export type ThemeMode = 'dark' | 'light' | 'system'
export type AccentColor = 'cyan' | 'blue' | 'teal' | 'indigo'
export type Density = 'comfortable' | 'compact'
export type FontSize = 'sm' | 'md' | 'lg'
export type SqlDialect = 'ansi' | 'postgresql' | 'mysql' | 'sqlite' | 'sqlserver' | 'bigquery' | 'snowflake'

export type Difficulty = 'beginner' | 'intermediate' | 'advanced'
export type ConfidenceLevel = 'not_confident' | 'developing' | 'comfortable' | 'strong'
export type ReviewStatus = 'not_started' | 'in_progress' | 'reviewed' | 'mastered'

export type KnowledgeCategory =
  | 'SQL'
  | 'Excel'
  | 'Tableau'
  | 'Power BI'
  | 'Python'
  | 'Statistics'
  | 'Business Analysis'
  | 'Data Visualization'
  | 'Communication'
  | 'Career and Interviews'

export const KNOWLEDGE_CATEGORIES: KnowledgeCategory[] = [
  'SQL',
  'Excel',
  'Tableau',
  'Power BI',
  'Python',
  'Statistics',
  'Business Analysis',
  'Data Visualization',
  'Communication',
  'Career and Interviews',
]

export type NoteType =
  | 'general'
  | 'sql'
  | 'excel_formula'
  | 'dashboard'
  | 'meeting'
  | 'business_definition'
  | 'data_quality'
  | 'insight'
  | 'lesson_learned'
  | 'interview_answer'
  | 'project_decision'
  | 'research'

export type ProjectStatus = 'planning' | 'active' | 'blocked' | 'completed' | 'archived'
export type ProjectPriority = 'low' | 'medium' | 'high' | 'critical'
export type ProjectType =
  | 'eda'
  | 'sales'
  | 'churn'
  | 'funnel'
  | 'retention'
  | 'operations'
  | 'inventory'
  | 'financial'
  | 'dashboard'
  | 'sql_portfolio'
  | 'custom'

export type JobStatus =
  | 'saved'
  | 'preparing'
  | 'applied'
  | 'screening'
  | 'interviewing'
  | 'final_round'
  | 'offer'
  | 'rejected'
  | 'withdrawn'
  | 'archived'

export type QualityStatus = 'unknown' | 'good' | 'needs_attention' | 'poor'
export type Sensitivity = 'public' | 'internal' | 'confidential' | 'restricted'

export type CaptureType =
  | 'note'
  | 'sql_query'
  | 'business_definition'
  | 'dataset_issue'
  | 'insight'
  | 'interview_question'
  | 'task'
  | 'project_idea'
  | 'formula'
  | 'kpi'

export type RecordType =
  | 'builtin_knowledge'
  | 'personal_knowledge'
  | 'note'
  | 'sql_query'
  | 'dataset'
  | 'project'
  | 'thinking_session'
  | 'kpi'
  | 'formula'
  | 'dashboard_plan'
  | 'portfolio_case_study'
  | 'interview_question'
  | 'star_story'
  | 'career_goal'
  | 'job_application'
  | 'learning_record'
  | 'skill_record'
  | 'quick_capture'
  | 'tag'
  | 'focus_item'

export type EntityRef = {
  type: RecordType
  id: ID
}

export type BaseRecord = {
  id: ID
  createdAt: ISODate
  updatedAt: ISODate
  archivedAt?: ISODate | null
  schemaVersion: number
  recordVersion?: number
  isDemo?: boolean
  tags?: string[]
  favorite?: boolean
  pinned?: boolean
}

export type UserPreferences = {
  id: 'preferences'
  displayName: string
  theme: ThemeMode
  accent: AccentColor
  density: Density
  fontSize: FontSize
  reducedMotion: boolean
  defaultLandingPage: string
  dateFormat: string
  sqlDialect: SqlDialect
  backupReminderDays: number
  lastBackupAt?: ISODate | null
  demoDataInstalled: boolean
  onboarded: boolean
  schemaVersion: number
  updatedAt: ISODate
}

export type BuiltInKnowledgeEntry = BaseRecord & {
  title: string
  category: KnowledgeCategory
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
  isBuiltIn: true
  contentVersion: number
}

export type PersonalKnowledgeEntry = BaseRecord & {
  title: string
  category: KnowledgeCategory
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
  personalNotes: string
  confidence: ConfidenceLevel
  reviewStatus: ReviewStatus
  duplicatedFromId?: string | null
  isBuiltIn: false
}

export type KnowledgeAnnotation = {
  id: ID
  knowledgeId: ID
  personalNotes: string
  confidence: ConfidenceLevel
  reviewStatus: ReviewStatus
  favorite: boolean
  tags: string[]
  createdAt: ISODate
  updatedAt: ISODate
}

export type Note = BaseRecord & {
  title: string
  type: NoteType
  content: string
  source?: string
  relatedProjectId?: ID | null
  relatedDatasetId?: ID | null
  relatedQueryId?: ID | null
  relatedKpiId?: ID | null
  relatedSkill?: string | null
  relatedBuiltinId?: ID | null
  checklist?: { id: ID; text: string; done: boolean }[]
  isBuiltIn?: boolean
}

export type SQLQuery = BaseRecord & {
  title: string
  dialect: SqlDialect
  sql: string
  explanation: string
  businessQuestion: string
  tablesUsed: string[]
  columnsUsed: string[]
  difficulty: Difficulty
  projectIds: ID[]
  datasetIds: ID[]
  relatedTopicIds: string[]
  expectedOutput: string
  notes: string
  commonMistakes: string
  lastUsedAt?: ISODate | null
  isTemplate?: boolean
}

export type SQLQueryVersion = {
  id: ID
  queryId: ID
  sql: string
  note: string
  createdAt: ISODate
}

export type DatasetColumn = {
  id: ID
  name: string
  dataType: string
  description: string
  businessMeaning: string
  exampleValue: string
  allowedValues: string
  nullable: boolean
  isKey: boolean
  knownIssues: string
  missingCount?: number
  uniqueCount?: number
}

export type DatasetTransformation = {
  id: ID
  type:
    | 'trim'
    | 'capitalize'
    | 'lowercase'
    | 'uppercase'
    | 'remove_duplicates'
    | 'blank_to_null'
    | 'rename_column'
    | 'change_type'
    | 'standardize_date'
    | 'filter_rows'
    | 'remove_column'
  params: Record<string, string | number | boolean>
  appliedAt: ISODate
  reversible: boolean
}

export type Dataset = BaseRecord & {
  name: string
  description: string
  source: string
  owner: string
  fileType: string
  location: string
  dateRangeStart?: string
  dateRangeEnd?: string
  refreshFrequency: string
  rowCount: number
  columnCount: number
  grain: string
  primaryKey: string
  relatedTables: string[]
  sensitivity: Sensitivity
  qualityStatus: QualityStatus
  knownIssues: string
  notes: string
  columns: DatasetColumn[]
  cleaningLog: string[]
  transformations: DatasetTransformation[]
  projectIds: ID[]
  queryIds: ID[]
  dashboardIds: ID[]
  profileSummary?: string
  csvPreview?: string
}

export type ProjectMilestone = {
  id: ID
  title: string
  dueDate?: string
  completed: boolean
  completedAt?: ISODate | null
}

export type ProjectFinding = {
  id: ID
  title: string
  detail: string
  impact: string
  createdAt: ISODate
}

export type Project = BaseRecord & {
  title: string
  status: ProjectStatus
  priority: ProjectPriority
  startDate?: string
  targetDate?: string
  completionDate?: string
  projectType: ProjectType
  businessArea: string
  toolsUsed: string[]
  summary: string
  originalRequest: string
  businessDecision: string
  stakeholders: string
  scope: string
  outOfScope: string
  successCriteria: string
  primaryQuestion: string
  supportingQuestions: string[]
  hypotheses: string[]
  assumptions: string[]
  risks: string[]
  limitations: string[]
  datasetIds: ID[]
  requiredFields: string
  missingData: string
  qualityIssues: string
  cleaningPlan: string
  cleaningLog: string
  queryIds: ID[]
  excelWork: string
  pythonWork: string
  calculations: string
  kpiIds: ID[]
  findings: ProjectFinding[]
  validationSteps: string
  dashboardIds: ID[]
  chartNotes: string
  designNotes: string
  filters: string
  audience: string
  keyInsights: string
  recommendations: string
  expectedImpact: string
  nextSteps: string
  openQuestions: string
  lessonsLearned: string
  decisions: string
  meetingNotes: string
  relatedKnowledgeIds: string[]
  portfolioCaseStudyId?: ID | null
  interviewStoryId?: ID | null
  milestones: ProjectMilestone[]
  checklist: { id: ID; text: string; done: boolean }[]
  statusUpdates: { id: ID; text: string; createdAt: ISODate }[]
  activityLog: { id: ID; text: string; createdAt: ISODate }[]
}

export type ThinkingAnswers = {
  requested: string
  whoRequested: string
  decisionSupported: string
  actionFollow: string
  primaryQuestion: string
  supportingQuestions: string
  successMeaning: string
  ambiguousTerms: string
  metricDefinitions: string
  populationIncluded: string
  populationExcluded: string
  timeframe: string
  detailLevel: string
  inclusions: string
  datasetsNeeded: string
  columnsNeeded: string
  joinsRequired: string
  missingData: string
  assumptions: string
  biasRisks: string
  seasonality: string
  duplicateRisk: string
  misleadingMetric: string
  calculations: string
  sqlPatterns: string
  comparisons: string
  validationChecks: string
  audience: string
  audienceNeeds: string
  chartTypes: string
  recommendation: string
}

export type ThinkingSession = BaseRecord & {
  title: string
  currentStep: number
  completed: boolean
  answers: ThinkingAnswers
  projectId?: ID | null
  noteId?: ID | null
}

export type KPI = BaseRecord & {
  name: string
  definition: string
  formula: string
  purpose: string
  whenToUse: string
  interpretation: string
  example: string
  relatedCharts: string
  commonMistakes: string
  relatedKpiIds: string[]
  industry: string
  personalNotes: string
  isBuiltIn: boolean
  category: string
}

export type Formula = BaseRecord & {
  name: string
  category: 'Excel' | 'Statistics' | 'Other'
  subcategory: string
  syntax: string
  description: string
  purpose: string
  whenToUse: string
  example: string
  commonMistakes: string
  relatedFormulaIds: string[]
  personalNotes: string
  isBuiltIn: boolean
  difficulty: Difficulty
}

export type DashboardBlockType =
  | 'kpi_card'
  | 'line_chart'
  | 'bar_chart'
  | 'table'
  | 'filter'
  | 'text'
  | 'insight'
  | 'recommendation'

export type DashboardBlock = {
  id: ID
  type: DashboardBlockType
  title: string
  notes: string
  row: number
  col: number
  width: number
  height: number
}

export type DashboardPlan = BaseRecord & {
  name: string
  projectId?: ID | null
  audience: string
  decisionSupported: string
  primaryQuestion: string
  kpiIds: ID[]
  charts: string
  filters: string
  dataSources: string
  refreshFrequency: string
  layoutNotes: string
  colorNotes: string
  accessibilityNotes: string
  knownLimitations: string
  publicationLocation: string
  screenshots: string[]
  blocks: DashboardBlock[]
  checklist: { id: ID; text: string; done: boolean }[]
  queryIds: ID[]
}

export type PortfolioCaseStudy = BaseRecord & {
  title: string
  projectId?: ID | null
  oneSentenceSummary: string
  businessProblem: string
  dataset: string
  tools: string
  process: string
  dataCleaning: string
  analysis: string
  dashboard: string
  keyFindings: string
  recommendations: string
  challenges: string
  lessonsLearned: string
  screenshots: string[]
  links: string
  resumeAction: string
  resumeMethod: string
  resumeScope: string
  resumeResult: string
  resumeImpact: string
  githubReadme: string
  webpageCopy: string
  resumeBullets: string
  linkedinDescription: string
  starStory: string
}

export type InterviewQuestion = BaseRecord & {
  question: string
  category: string
  difficulty: Difficulty
  evaluating: string
  keyConcepts: string
  exampleOutline: string
  commonMistakes: string
  personalAnswer: string
  confidence: ConfidenceLevel
  lastPracticedAt?: ISODate | null
  practiceCount: number
  relatedProjectId?: ID | null
  relatedKnowledgeIds: string[]
  isBuiltIn: boolean
}

export type InterviewPractice = {
  id: ID
  questionId: ID
  mode: 'flashcard' | 'written' | 'timed' | 'self_rating'
  response: string
  selfRating: ConfidenceLevel
  durationSeconds?: number
  createdAt: ISODate
}

export type STARStory = BaseRecord & {
  title: string
  situation: string
  task: string
  action: string
  result: string
  lessonsLearned: string
  relatedProjectId?: ID | null
  skillsDemonstrated: string[]
}

export type CareerGoal = BaseRecord & {
  targetRole: string
  targetSalary: string
  targetApplicationDate?: string
  targetEmploymentDate?: string
  skillsToDevelop: string[]
  portfolioGoals: string
  educationGoals: string
  notes: string
}

export type JobApplication = BaseRecord & {
  company: string
  jobTitle: string
  jobUrl: string
  location: string
  remoteStatus: 'onsite' | 'hybrid' | 'remote'
  salaryRange: string
  applicationDate?: string
  status: JobStatus
  contact: string
  followUpDate?: string
  interviewDates: string
  notes: string
  resumeVersion: string
  portfolioProjectIds: ID[]
  offerSalary?: string
  offerBenefits?: string
  offerRemote?: string
  offerSchedule?: string
  offerGrowth?: string
  offerStability?: string
  offerCommute?: string
  offerOverallRating?: number
}

export type LearningRecord = BaseRecord & {
  title: string
  type: 'course' | 'book' | 'certificate' | 'other'
  subject: string
  status: 'planned' | 'in_progress' | 'completed' | 'paused'
  startDate?: string
  completionDate?: string
  notes: string
  relatedSkills: string[]
}

export type SkillRecord = BaseRecord & {
  skill: string
  confidence: ConfidenceLevel
  evidence: string
  relatedProjectIds: ID[]
  lastPracticedAt?: ISODate | null
  nextAction: string
}

export type QuickCapture = BaseRecord & {
  type: CaptureType
  title: string
  body: string
  processed: boolean
  convertedToType?: RecordType | null
  convertedToId?: ID | null
  projectId?: ID | null
}

export type Tag = {
  id: ID
  name: string
  color?: string
  createdAt: ISODate
  usageCount: number
}

export type Relationship = {
  id: ID
  fromType: RecordType
  fromId: ID
  toType: RecordType
  toId: ID
  label?: string
  createdAt: ISODate
}

export type ActivityRecord = {
  id: ID
  type: string
  summary: string
  entityType?: RecordType
  entityId?: ID
  createdAt: ISODate
}

export type FocusItem = BaseRecord & {
  text: string
  completed: boolean
  completedAt?: ISODate | null
  order: number
  carriedForward: boolean
}

export type RecentItem = {
  id: ID
  type: RecordType
  title: string
  openedAt: ISODate
}

export type BackupManifest = {
  backupVersion: number
  schemaVersion: number
  exportedAt: ISODate
  appName: string
  appVersion: string
  recordCounts: Record<string, number>
}

export type AnalystOSBackup = {
  manifest: BackupManifest
  preferences: UserPreferences
  personalKnowledge: PersonalKnowledgeEntry[]
  knowledgeAnnotations: KnowledgeAnnotation[]
  notes: Note[]
  sqlQueries: SQLQuery[]
  sqlQueryVersions: SQLQueryVersion[]
  datasets: Dataset[]
  projects: Project[]
  thinkingSessions: ThinkingSession[]
  kpis: KPI[]
  formulas: Formula[]
  dashboardPlans: DashboardPlan[]
  portfolioCaseStudies: PortfolioCaseStudy[]
  interviewQuestions: InterviewQuestion[]
  interviewPractices: InterviewPractice[]
  starStories: STARStory[]
  careerGoals: CareerGoal[]
  jobApplications: JobApplication[]
  learningRecords: LearningRecord[]
  skillRecords: SkillRecord[]
  quickCaptures: QuickCapture[]
  tags: Tag[]
  relationships: Relationship[]
  activities: ActivityRecord[]
  focusItems: FocusItem[]
  recentItems: RecentItem[]
}
