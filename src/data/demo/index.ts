import type {
  Dataset,
  DatasetColumn,
  InterviewQuestion,
  KPI,
  Note,
  PortfolioCaseStudy,
  Project,
  SQLQuery,
  STARStory,
  DashboardPlan,
  SkillRecord,
} from '@/types'
import { SCHEMA_VERSION } from '@/types'
import { db } from '@/db'
import { createId, nowIso, timestamps } from '@/utils'
import { linkRecords, logActivity } from '@/services/data-service'

const DEMO_TAG = 'demo:northstar'

function base<T extends Record<string, unknown>>(extra: T) {
  return {
    ...timestamps(),
    isDemo: true,
    tags: [DEMO_TAG],
    favorite: false,
    pinned: false,
    schemaVersion: SCHEMA_VERSION,
    ...extra,
  }
}

export async function removeDemoData(): Promise<void> {
  const filterDemo = <T extends { isDemo?: boolean; tags?: string[] }>(rows: T[]) =>
    rows.filter((r) => r.isDemo || r.tags?.includes(DEMO_TAG))

  await db.transaction(
    'rw',
    [
      db.projects,
      db.datasets,
      db.sqlQueries,
      db.notes,
      db.kpis,
      db.dashboardPlans,
      db.portfolioCaseStudies,
      db.starStories,
      db.interviewQuestions,
      db.skillRecords,
      db.relationships,
      db.focusItems,
    ],
    async () => {
      const projects = filterDemo(await db.projects.toArray())
      const datasets = filterDemo(await db.datasets.toArray())
      const queries = filterDemo(await db.sqlQueries.toArray())
      const notes = filterDemo(await db.notes.toArray())
      const kpis = filterDemo(await db.kpis.filter((k) => !k.isBuiltIn).toArray())
      const dashboards = filterDemo(await db.dashboardPlans.toArray())
      const portfolio = filterDemo(await db.portfolioCaseStudies.toArray())
      const stars = filterDemo(await db.starStories.toArray())
      const questions = filterDemo(await db.interviewQuestions.filter((q) => !q.isBuiltIn).toArray())
      const skills = filterDemo(await db.skillRecords.toArray())

      await db.projects.bulkDelete(projects.map((p) => p.id))
      await db.datasets.bulkDelete(datasets.map((d) => d.id))
      await db.sqlQueries.bulkDelete(queries.map((q) => q.id))
      await db.notes.bulkDelete(notes.map((n) => n.id))
      await db.kpis.bulkDelete(kpis.map((k) => k.id))
      await db.dashboardPlans.bulkDelete(dashboards.map((d) => d.id))
      await db.portfolioCaseStudies.bulkDelete(portfolio.map((p) => p.id))
      await db.starStories.bulkDelete(stars.map((s) => s.id))
      await db.interviewQuestions.bulkDelete(questions.map((q) => q.id))
      await db.skillRecords.bulkDelete(skills.map((s) => s.id))

      const demoIds = new Set([
        ...projects,
        ...datasets,
        ...queries,
        ...notes,
        ...kpis,
        ...dashboards,
        ...portfolio,
        ...stars,
        ...questions,
      ].map((r) => r.id))

      const rels = await db.relationships.toArray()
      await db.relationships.bulkDelete(
        rels.filter((r) => demoIds.has(r.fromId) || demoIds.has(r.toId)).map((r) => r.id),
      )
    },
  )
}

export async function createDemoData(): Promise<void> {
  const existing = await db.projects.filter((p) => Boolean(p.isDemo)).count()
  if (existing > 0) return

  const now = nowIso()
  const projectId = createId()
  const datasetId = createId()
  const queryId = createId()
  const queryId2 = createId()
  const kpiId = createId()
  const dashboardId = createId()
  const portfolioId = createId()
  const starId = createId()
  const noteId = createId()

  const columns: DatasetColumn[] = [
    {
      id: createId(),
      name: 'order_id',
      dataType: 'text',
      description: 'Unique order identifier',
      businessMeaning: 'Primary key for retail orders',
      exampleValue: 'ORD-100245',
      allowedValues: '',
      nullable: false,
      isKey: true,
      knownIssues: '',
      missingCount: 0,
      uniqueCount: 125_430,
    },
    {
      id: createId(),
      name: 'order_date',
      dataType: 'date',
      description: 'Order placement date',
      businessMeaning: 'Transaction date in local store time',
      exampleValue: '2025-11-03',
      allowedValues: '',
      nullable: false,
      isKey: false,
      knownIssues: '',
    },
    {
      id: createId(),
      name: 'customer_id',
      dataType: 'text',
      description: 'Customer identifier',
      businessMeaning: 'Links to customer dimension',
      exampleValue: 'CUST-8821',
      allowedValues: '',
      nullable: false,
      isKey: false,
      knownIssues: 'Some historical guest checkouts use CUST-GUEST',
    },
    {
      id: createId(),
      name: 'product_category',
      dataType: 'text',
      description: 'Product category',
      businessMeaning: 'Merchandising hierarchy level 1',
      exampleValue: 'Apparel',
      allowedValues: 'Apparel, Home, Electronics, Beauty, Grocery',
      nullable: false,
      isKey: false,
      knownIssues: '',
    },
    {
      id: createId(),
      name: 'net_revenue',
      dataType: 'number',
      description: 'Net revenue after discounts and returns',
      businessMeaning: 'Primary revenue metric for sales analysis',
      exampleValue: '84.50',
      allowedValues: '',
      nullable: false,
      isKey: false,
      knownIssues: 'Returns appear as negative values',
    },
  ]

  const dataset: Dataset = base({
    id: datasetId,
    name: 'Northstar Retail Orders',
    description:
      'Order-level retail transactions for Northstar stores and ecommerce channels covering FY2024–FY2025.',
    source: 'Northstar Data Warehouse · sales.fact_orders',
    owner: 'Analytics (demo)',
    fileType: 'warehouse table / CSV extract',
    location: 'local demo metadata',
    dateRangeStart: '2024-01-01',
    dateRangeEnd: '2025-12-31',
    refreshFrequency: 'Daily',
    rowCount: 125_430,
    columnCount: columns.length,
    grain: 'One row per order line',
    primaryKey: 'order_id + line_id',
    relatedTables: ['dim_customer', 'dim_product', 'dim_store'],
    sensitivity: 'internal',
    qualityStatus: 'good',
    knownIssues: 'Guest checkout customer_id is shared; exclude from customer-level retention unless mapped.',
    notes: 'Demo dataset metadata for AnalystOS walkthrough.',
    columns,
    cleaningLog: [
      'Excluded voided orders (status = VOID)',
      'Standardized product_category casing',
      'Validated net_revenue sign for returns',
    ],
    transformations: [],
    projectIds: [projectId],
    queryIds: [queryId, queryId2],
    dashboardIds: [dashboardId],
    profileSummary: '125,430 rows · 5 documented columns · date span 2024-01-01 to 2025-12-31',
  }) as Dataset

  const query1: SQLQuery = base({
    id: queryId,
    title: 'Monthly net revenue by category',
    dialect: 'ansi',
    sql: `SELECT
  DATE_TRUNC('month', order_date) AS month,
  product_category,
  SUM(net_revenue) AS net_revenue
FROM sales.fact_orders
WHERE order_date >= DATE '2025-01-01'
  AND order_status <> 'VOID'
GROUP BY 1, 2
ORDER BY 1, 3 DESC;`,
    explanation: 'Aggregates net revenue by month and product category for the current year.',
    businessQuestion: 'Which categories are driving monthly revenue growth?',
    tablesUsed: ['sales.fact_orders'],
    columnsUsed: ['order_date', 'product_category', 'net_revenue', 'order_status'],
    difficulty: 'beginner',
    projectIds: [projectId],
    datasetIds: [datasetId],
    relatedTopicIds: ['builtin-sql-group-by', 'builtin-sql-sum'],
    expectedOutput: 'One row per month-category with summed net revenue',
    notes: 'Use store local dates; fiscal calendar mapping is out of scope for V1 demo.',
    commonMistakes: 'Including VOID orders; summing gross instead of net revenue',
    lastUsedAt: now,
  }) as SQLQuery

  const query2: SQLQuery = base({
    id: queryId2,
    title: 'Customer retention by cohort month',
    dialect: 'ansi',
    sql: `WITH first_order AS (
  SELECT customer_id, DATE_TRUNC('month', MIN(order_date)) AS cohort_month
  FROM sales.fact_orders
  WHERE customer_id <> 'CUST-GUEST'
  GROUP BY 1
), activity AS (
  SELECT DISTINCT customer_id, DATE_TRUNC('month', order_date) AS activity_month
  FROM sales.fact_orders
  WHERE customer_id <> 'CUST-GUEST'
)
SELECT
  f.cohort_month,
  a.activity_month,
  COUNT(DISTINCT a.customer_id) AS active_customers
FROM first_order f
JOIN activity a ON f.customer_id = a.customer_id
GROUP BY 1, 2
ORDER BY 1, 2;`,
    explanation: 'Builds monthly cohorts and counts active customers in later months.',
    businessQuestion: 'How well do new customer cohorts retain over time?',
    tablesUsed: ['sales.fact_orders'],
    columnsUsed: ['customer_id', 'order_date'],
    difficulty: 'advanced',
    projectIds: [projectId],
    datasetIds: [datasetId],
    relatedTopicIds: ['builtin-sql-cte', 'builtin-sql-retention'],
    expectedOutput: 'Cohort × activity month active customer counts',
    notes: 'Excludes guest checkouts.',
    commonMistakes: 'Including guest IDs; counting orders instead of distinct customers',
    lastUsedAt: now,
  }) as SQLQuery

  const kpi: KPI = base({
    id: kpiId,
    name: 'Northstar Net Revenue',
    definition: 'Sum of net_revenue after discounts and returns, excluding voided orders.',
    formula: 'SUM(net_revenue) WHERE order_status <> VOID',
    purpose: 'Track core top-line retail performance for category and channel reviews.',
    whenToUse: 'Monthly business reviews, category deep-dives, dashboard scorecards.',
    interpretation: 'Rising net revenue with stable margin usually signals healthy demand.',
    example: 'Apparel net revenue was $1.2M in Nov 2025, +8% MoM.',
    relatedCharts: 'Trend line, category bar, waterfall for returns impact',
    commonMistakes: 'Using gross sales; including voids; mixing fiscal and calendar months',
    relatedKpiIds: [],
    industry: 'Retail',
    personalNotes: 'Primary KPI for the Northstar demo project.',
    isBuiltIn: false,
    category: 'Sales',
  }) as KPI

  const dashboard: DashboardPlan = base({
    id: dashboardId,
    name: 'Northstar Sales Pulse',
    projectId,
    audience: 'Retail leadership and category managers',
    decisionSupported: 'Where to focus merchandising and promo investment next month',
    primaryQuestion: 'How is net revenue trending by category, and where is retention weakening?',
    kpiIds: [kpiId],
    charts: 'Monthly revenue trend, category rank, cohort retention heatmap',
    filters: 'Date range, channel, category, region',
    dataSources: 'Northstar Retail Orders',
    refreshFrequency: 'Daily',
    layoutNotes: 'KPI strip on top, trend left, category right, retention below',
    colorNotes: 'Use brand navy + single cyan accent; avoid red/green only encoding',
    accessibilityNotes: 'Include value labels; do not rely on color alone for retention bands',
    knownLimitations: 'Guest checkout excluded from retention; no margin data in V1',
    publicationLocation: 'Demo / local only',
    screenshots: [],
    blocks: [
      { id: createId(), type: 'kpi_card', title: 'Net Revenue', notes: 'MTD', row: 0, col: 0, width: 3, height: 1 },
      { id: createId(), type: 'kpi_card', title: 'MoM Growth', notes: '%', row: 0, col: 3, width: 3, height: 1 },
      { id: createId(), type: 'line_chart', title: 'Revenue trend', notes: '12 months', row: 1, col: 0, width: 8, height: 2 },
      { id: createId(), type: 'bar_chart', title: 'Category rank', notes: 'Top 5', row: 1, col: 8, width: 4, height: 2 },
      { id: createId(), type: 'insight', title: 'Key insight', notes: 'Retention soft in Beauty cohort', row: 3, col: 0, width: 12, height: 1 },
    ],
    checklist: [
      { id: createId(), text: 'Is the purpose clear?', done: true },
      { id: createId(), text: 'Is the most important KPI visible first?', done: true },
      { id: createId(), text: 'Are chart titles specific?', done: true },
      { id: createId(), text: 'Are colors used consistently?', done: false },
      { id: createId(), text: 'Are sources and refresh dates included?', done: true },
    ],
    queryIds: [queryId, queryId2],
  }) as DashboardPlan

  const project: Project = base({
    id: projectId,
    title: 'Northstar Retail Sales Analysis',
    status: 'active',
    priority: 'high',
    startDate: '2025-10-01',
    targetDate: '2026-01-15',
    projectType: 'sales',
    businessArea: 'Retail / Merchandising',
    toolsUsed: ['SQL', 'Excel', 'Tableau'],
    summary:
      'Analyze Northstar retail net revenue trends, category performance, and customer retention to guide merchandising priorities.',
    originalRequest:
      'Leadership asked for a clear view of where revenue growth is concentrating and which new customer cohorts are retaining.',
    businessDecision: 'Allocate Q1 promo and inventory focus across categories.',
    stakeholders: 'VP Retail, Category Directors, Finance partner',
    scope: 'FY2025 orders, US channels, net revenue and retention',
    outOfScope: 'Margin optimization, supply chain, international stores',
    successCriteria: 'Dashboard + briefing with prioritized category recommendations',
    primaryQuestion: 'Which categories and cohorts should receive Q1 focus?',
    supportingQuestions: [
      'Which categories grew fastest MoM?',
      'Where is retention weakest after first purchase?',
      'How large is the guest-checkout blind spot?',
    ],
    hypotheses: [
      'Apparel growth is promo-driven and may not retain',
      'Beauty cohorts under-retain after month 1',
    ],
    assumptions: ['Net revenue definition matches Finance', 'Guest IDs excluded from retention'],
    risks: ['Incomplete customer identity', 'Holiday seasonality'],
    limitations: ['No margin fields in extract', 'Channel attribution limited'],
    datasetIds: [datasetId],
    requiredFields: 'order_date, product_category, net_revenue, customer_id, order_status',
    missingData: 'Gross margin, campaign ID',
    qualityIssues: 'Shared guest customer id',
    cleaningPlan: 'Exclude voids; standardize categories; flag guest customers',
    cleaningLog: 'Completed void exclusion and category casing cleanup',
    queryIds: [queryId, queryId2],
    excelWork: 'Category bridge and MoM variance table',
    pythonWork: '',
    calculations: 'MoM growth, cohort retention rates',
    kpiIds: [kpiId],
    findings: [
      {
        id: createId(),
        title: 'Apparel leads growth',
        detail: 'Apparel contributed 42% of Nov net revenue growth.',
        impact: 'Supports continued inventory depth in key apparel subclasses.',
        createdAt: now,
      },
      {
        id: createId(),
        title: 'Beauty retention soft',
        detail: 'Month-1 Beauty cohort retention is 9pp below Apparel.',
        impact: 'Suggests post-purchase nurture experiment before increasing Beauty acquisition spend.',
        createdAt: now,
      },
    ],
    validationSteps: 'Reconciled monthly totals to Finance flash within 0.4%',
    dashboardIds: [dashboardId],
    chartNotes: 'Retention as heatmap; avoid dual axes',
    designNotes: 'Leadership wants one-page pulse + appendix',
    filters: 'Month, category, channel',
    audience: 'Retail leadership',
    keyInsights:
      'Growth is concentrated in Apparel; Beauty acquisition is less efficient due to weaker early retention.',
    recommendations:
      '1) Protect Apparel inventory on top SKUs. 2) Pilot Beauty win-back offer at day 21. 3) Improve customer identity for guest checkout.',
    expectedImpact: 'Clearer Q1 allocation and reduced wasted acquisition spend in soft-retention categories.',
    nextSteps: 'Finalize dashboard QA and present briefing',
    openQuestions: 'Can CRM map a subset of guest orders post-account creation?',
    lessonsLearned: 'Define guest handling before retention work begins.',
    decisions: 'Use net revenue; exclude guest from retention',
    meetingNotes: 'Kickoff 2025-10-03 with VP Retail',
    relatedKnowledgeIds: ['builtin-sql-retention', 'builtin-sql-mom-growth'],
    portfolioCaseStudyId: portfolioId,
    interviewStoryId: starId,
    milestones: [
      { id: createId(), title: 'Data contract signed', dueDate: '2025-10-10', completed: true, completedAt: '2025-10-09T00:00:00.000Z' },
      { id: createId(), title: 'Retention prototype', dueDate: '2025-11-20', completed: true, completedAt: '2025-11-18T00:00:00.000Z' },
      { id: createId(), title: 'Leadership briefing', dueDate: '2026-01-10', completed: false, completedAt: null },
    ],
    checklist: [
      { id: createId(), text: 'Confirm metric definitions with Finance', done: true },
      { id: createId(), text: 'Build category MoM view', done: true },
      { id: createId(), text: 'Validate retention logic', done: true },
      { id: createId(), text: 'Draft recommendations', done: false },
    ],
    statusUpdates: [
      { id: createId(), text: 'Prototype dashboard shared with category managers', createdAt: now },
    ],
    activityLog: [
      { id: createId(), text: 'Demo project created in AnalystOS', createdAt: now },
    ],
    pinned: true,
  }) as Project

  const portfolio: PortfolioCaseStudy = base({
    id: portfolioId,
    title: 'Northstar Retail Sales Analysis — Case Study',
    projectId,
    oneSentenceSummary:
      'Built a retail sales and retention analysis that redirected Q1 merchandising focus toward high-growth, high-retention categories.',
    businessProblem: 'Leadership lacked a shared view of category growth quality and cohort retention.',
    dataset: 'Northstar retail orders (125k+ transactions)',
    tools: 'SQL, Excel, Tableau',
    process: 'Framed questions → defined net revenue → profiled data → analyzed MoM and cohorts → dashboarded → recommended actions',
    dataCleaning: 'Removed voids, standardized categories, excluded guest IDs from retention',
    analysis: 'Category contribution, MoM growth, cohort retention curves',
    dashboard: 'Northstar Sales Pulse',
    keyFindings: 'Apparel drove growth; Beauty early retention lagged by 9pp',
    recommendations: 'Protect Apparel depth; Beauty nurture pilot; improve identity resolution',
    challenges: 'Guest checkout diluted customer grain',
    lessonsLearned: 'Retention definitions must be agreed before dashboard design',
    screenshots: [],
    links: '',
    resumeAction: 'Analyzed',
    resumeMethod: 'SQL cohort analysis and executive dashboarding',
    resumeScope: '125k+ retail orders across categories and channels',
    resumeResult: 'Identified 9pp retention gap and growth concentration in Apparel',
    resumeImpact: 'Informed Q1 promo and inventory prioritization for retail leadership',
    githubReadme: '',
    webpageCopy: '',
    resumeBullets: '',
    linkedinDescription: '',
    starStory: '',
  }) as PortfolioCaseStudy

  const star: STARStory = base({
    id: starId,
    title: 'Redirected retail focus with retention-aware sales analysis',
    situation: 'Northstar retail leadership needed clarity on whether category growth was durable.',
    task: 'Deliver an analysis and dashboard that separated growth volume from retention quality.',
    action:
      'Defined net revenue with Finance, excluded guest noise, built MoM and cohort SQL, and packaged a one-page leadership pulse.',
    result:
      'Highlighted Apparel as durable growth and a 9pp Beauty retention gap, shaping Q1 investment conversations.',
    lessonsLearned: 'Metric contracts and identity rules prevent late-stage rework.',
    relatedProjectId: projectId,
    skillsDemonstrated: ['SQL', 'Business thinking', 'Communication', 'Tableau'],
  }) as STARStory

  const note: Note = base({
    id: noteId,
    title: 'Northstar: decision log',
    type: 'project_decision',
    content: `## Decisions
- Net revenue excludes voids and is after discounts/returns
- Retention excludes CUST-GUEST
- Calendar months for V1 (fiscal mapping later)

## Open
- Identity resolution for guest conversions`,
    relatedProjectId: projectId,
    relatedDatasetId: datasetId,
    relatedQueryId: queryId2,
    source: 'Demo',
  }) as Note

  const personalInterview: InterviewQuestion = base({
    id: createId(),
    question: 'Walk me through how you measured retention for Northstar.',
    category: 'Portfolio walkthrough',
    difficulty: 'intermediate',
    evaluating: 'Ability to explain metric definition, exclusions, and business implication',
    keyConcepts: 'Cohorts, distinct customers, guest checkout bias',
    exampleOutline: 'Define cohort → exclude guests → activity months → compare Beauty vs Apparel → recommendation',
    commonMistakes: 'Counting orders instead of customers; ignoring guest IDs',
    personalAnswer:
      'I defined first-order month as cohort, excluded shared guest IDs, and measured distinct active customers by subsequent month...',
    confidence: 'comfortable',
    lastPracticedAt: now,
    practiceCount: 2,
    relatedProjectId: projectId,
    relatedKnowledgeIds: ['builtin-sql-retention'],
    isBuiltIn: false,
  }) as InterviewQuestion

  const skills: SkillRecord[] = [
    base({
      id: createId(),
      skill: 'SQL',
      confidence: 'strong',
      evidence: 'Built cohort retention and category MoM queries for Northstar',
      relatedProjectIds: [projectId],
      lastPracticedAt: now,
      nextAction: 'Add window-function practice set',
    }) as SkillRecord,
    base({
      id: createId(),
      skill: 'Business thinking',
      confidence: 'comfortable',
      evidence: 'Tied retention gap to acquisition efficiency recommendation',
      relatedProjectIds: [projectId],
      lastPracticedAt: now,
      nextAction: 'Practice recommendation framing in Interview Lab',
    }) as SkillRecord,
  ]

  await db.transaction(
    'rw',
    [
      db.projects,
      db.datasets,
      db.sqlQueries,
      db.notes,
      db.kpis,
      db.dashboardPlans,
      db.portfolioCaseStudies,
      db.starStories,
      db.interviewQuestions,
      db.skillRecords,
      db.focusItems,
    ],
    async () => {
      await db.projects.put(project)
      await db.datasets.put(dataset)
      await db.sqlQueries.bulkPut([query1, query2])
      await db.notes.put(note)
      await db.kpis.put(kpi)
      await db.dashboardPlans.put(dashboard)
      await db.portfolioCaseStudies.put(portfolio)
      await db.starStories.put(star)
      await db.interviewQuestions.put(personalInterview)
      await db.skillRecords.bulkPut(skills)
      await db.focusItems.bulkPut([
        {
          ...timestamps(),
          text: 'Finish Northstar recommendation draft',
          completed: false,
          order: 0,
          carriedForward: false,
          tags: [DEMO_TAG],
          isDemo: true,
        },
        {
          ...timestamps(),
          text: 'Practice portfolio walkthrough question',
          completed: false,
          order: 1,
          carriedForward: false,
          tags: [DEMO_TAG],
          isDemo: true,
        },
      ])
    },
  )

  await linkRecords({ type: 'project', id: projectId }, { type: 'dataset', id: datasetId })
  await linkRecords({ type: 'project', id: projectId }, { type: 'sql_query', id: queryId })
  await linkRecords({ type: 'project', id: projectId }, { type: 'sql_query', id: queryId2 })
  await linkRecords({ type: 'project', id: projectId }, { type: 'dashboard_plan', id: dashboardId })
  await linkRecords(
    { type: 'project', id: projectId },
    { type: 'portfolio_case_study', id: portfolioId },
  )
  await logActivity('demo', 'Loaded Northstar Retail Sales Analysis demo data', {
    type: 'project',
    id: projectId,
  })
}
