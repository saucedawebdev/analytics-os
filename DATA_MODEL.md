# AnalystOS Data Model

The canonical model definitions live in `src/types/index.ts`. The Dexie store declarations live in `src/db/index.ts`.

## Version constants

```ts
export const SCHEMA_VERSION = 1
export const BACKUP_VERSION = 1
export const BUILTIN_CONTENT_VERSION = 1
```

- `SCHEMA_VERSION` marks the current IndexedDB record shape.
- `BACKUP_VERSION` marks the JSON export/import format.
- `BUILTIN_CONTENT_VERSION` controls built-in content reseeding.

The current Dexie database uses `version(1)`. `runMigrations()` records schema metadata and leaves space for future migrations. It explicitly should not wipe personal tables.

## Core scalar and union types

- `ID`: string identifier.
- `ISODate`: ISO timestamp string.
- UI preferences: `ThemeMode`, `AccentColor`, `Density`, `FontSize`.
- SQL: `SqlDialect`.
- Learning/review: `Difficulty`, `ConfidenceLevel`, `ReviewStatus`.
- Knowledge: `KnowledgeCategory`.
- Notes: `NoteType`.
- Projects: `ProjectStatus`, `ProjectPriority`, `ProjectType`.
- Career: `JobStatus`.
- Datasets: `QualityStatus`, `Sensitivity`.
- Captures: `CaptureType`.
- Polymorphic records: `RecordType`.

## Shared record shape

Most durable records extend `BaseRecord`:

```ts
type BaseRecord = {
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
```

`timestamps()` in `src/utils/index.ts` creates IDs and timestamps with the current schema version. `touchUpdated()` increments `recordVersion` when records are edited.

## Preferences

### `UserPreferences`

Singleton table row with `id: 'preferences'`.

Major fields:

- Display name.
- Theme, accent, density, font size, reduced motion.
- Default landing page.
- Date format.
- Default SQL dialect.
- Backup reminder interval and last backup timestamp.
- Demo data/onboarding flags.
- Schema version and update timestamp.

## Knowledge models

### `BuiltInKnowledgeEntry`

Shipped knowledge entry loaded from TypeScript modules. It extends `BaseRecord` and includes:

- Title, category, subcategory, difficulty.
- Summary and conceptual sections.
- Syntax/formula, business example, worked example.
- Common mistakes and best practices.
- Related topic IDs.
- Practice prompt and interview question.
- `isBuiltIn: true`.
- `contentVersion`.

Built-in knowledge is generally not persisted as full records in Dexie.

### `PersonalKnowledgeEntry`

Editable user-owned knowledge copy. It extends the knowledge fields and adds:

- `personalNotes`.
- `confidence`.
- `reviewStatus`.
- `duplicatedFromId`.
- `isBuiltIn: false`.

### `KnowledgeAnnotation`

User-owned overlay for a built-in knowledge item.

Relationships:

- `knowledgeId` references a built-in knowledge entry ID.
- Stores personal notes, confidence, review status, favorite flag, and tags.

## Notes and SQL

### `Note`

Extends `BaseRecord`.

Major fields:

- Title, note type, content, source.
- Optional related project, dataset, query, KPI, skill, or built-in knowledge ID.
- Checklist.
- Optional `isBuiltIn` for starter notes.

Relationships:

- Can link to projects, datasets, SQL queries, KPIs, skills, and built-in knowledge through direct IDs.
- Detail pages also create rows in `relationships` for selected direct links.

### `SQLQuery`

Extends `BaseRecord`.

Major fields:

- Title, dialect, SQL text.
- Explanation and business question.
- Tables and columns used.
- Difficulty.
- Project IDs, dataset IDs, related topic IDs.
- Expected output, notes, common mistakes.
- Last used timestamp.
- Optional template flag.

Relationships:

- Many-to-many with projects and datasets through ID arrays.
- Version history through `SQLQueryVersion`.

### `SQLQueryVersion`

Version snapshot for a query:

- `queryId` references `SQLQuery.id`.
- SQL text, note, created timestamp.

## Dataset models

### `Dataset`

Extends `BaseRecord`.

Major fields:

- Name, description, source, owner.
- File type, location, date range, refresh frequency.
- Row/column counts, grain, primary key, related tables.
- Sensitivity and quality status.
- Known issues and notes.
- `columns: DatasetColumn[]`.
- Cleaning log and transformations.
- Project/query/dashboard ID arrays.
- Optional CSV profile summary and CSV preview.

Relationships:

- Can reference projects, SQL queries, and dashboard plans.

### `DatasetColumn`

Column metadata:

- Name, data type, description, business meaning, example value.
- Allowed values.
- Nullable/key flags.
- Known issues.
- Missing and unique counts.

### `DatasetTransformation`

Preview cleaning step:

- Type such as trim, remove duplicates, rename column, change type, standardize date, filter rows, or remove column.
- Params.
- Applied timestamp.
- Reversibility flag.

## Project models

### `Project`

Extends `BaseRecord`.

A project is the central analysis record. Major groups:

- Status, priority, type, dates.
- Business area, tools, summary, request, decision, stakeholders.
- Scope, success criteria, questions, hypotheses, assumptions, risks, limitations.
- Dataset IDs and data-quality documentation.
- Query IDs, Excel/Python/calculation notes.
- KPI IDs.
- Findings, validation steps.
- Dashboard IDs and dashboard notes.
- Insights, recommendations, impact, next steps, open questions.
- Lessons learned, decisions, meeting notes.
- Related knowledge IDs.
- Optional portfolio case study and interview story IDs.
- Milestones, checklist, status updates, activity log.

Relationships:

- Direct ID arrays to datasets, SQL queries, KPIs, dashboards, and knowledge.
- Optional one-to-one links to portfolio and STAR story records.
- Additional links can be stored in `relationships`.

### `ProjectMilestone`

Project milestone with title, due date, completion flag, and completion timestamp.

### `ProjectFinding`

Finding with title, detail, impact, and created timestamp.

## Thinking models

### `ThinkingAnswers`

Structured answers for scoping analysis:

- Request, requester, decision, action.
- Primary/supporting questions.
- Success meaning and definition checks.
- Population/timeframe/detail level.
- Data needs, joins, missing data.
- Assumptions, bias risks, seasonality, duplicates, misleading metrics.
- Calculations, SQL patterns, comparisons, validation.
- Audience, charts, recommendation.

### `ThinkingSession`

Extends `BaseRecord`.

Major fields:

- Title.
- Current step.
- Completion flag.
- `answers`.
- Optional linked project ID and note ID.

Thinking sessions can be converted to projects or notes.

## KPI and formula models

### `KPI`

Extends `BaseRecord`.

Major fields:

- Name, definition, formula.
- Purpose, when to use, interpretation, example.
- Related charts, common mistakes, related KPI IDs.
- Industry, category, personal notes.
- `isBuiltIn`.

### `Formula`

Extends `BaseRecord`.

Major fields:

- Name, category, subcategory.
- Syntax, description, purpose, when to use, example.
- Common mistakes, related formula IDs.
- Personal notes.
- `isBuiltIn`.
- Difficulty.

Built-in KPIs and formulas can be duplicated into personal editable records.

## Dashboard models

### `DashboardPlan`

Extends `BaseRecord`.

Major fields:

- Name and optional project ID.
- Audience, decision supported, primary question.
- KPI IDs.
- Charts, filters, data sources, refresh frequency.
- Layout, color, accessibility, limitations.
- Publication location.
- Screenshot path list.
- Blocks, checklist, query IDs.

### `DashboardBlock`

Wireframe block with type, title, notes, grid row/column, width, and height.

### `DashboardBlockType`

Supported block types:

- KPI card.
- Line chart.
- Bar chart.
- Table.
- Filter.
- Text.
- Insight.
- Recommendation.

## Portfolio and interview models

### `PortfolioCaseStudy`

Extends `BaseRecord`.

Major fields:

- Optional project ID.
- One-sentence summary, business problem, dataset, tools.
- Process, cleaning, analysis, dashboard.
- Findings, recommendations, challenges, lessons.
- Screenshot list and links.
- Resume action/method/scope/result/impact.
- GitHub README copy, webpage copy, resume bullets, LinkedIn description.
- STAR story text.

### `InterviewQuestion`

Extends `BaseRecord`.

Major fields:

- Question, category, difficulty.
- What it evaluates, key concepts, example outline.
- Common mistakes, personal answer.
- Confidence, last practiced timestamp, practice count.
- Optional related project ID.
- Related knowledge IDs.
- `isBuiltIn`.

### `InterviewPractice`

Practice attempt:

- Question ID.
- Mode: flashcard, written, timed, or self-rating.
- Response.
- Self rating.
- Optional duration.
- Created timestamp.

### `STARStory`

Extends `BaseRecord`.

Major fields:

- Title.
- Situation, task, action, result, lessons learned.
- Optional related project ID.
- Skills demonstrated.

## Career models

### `CareerGoal`

Extends `BaseRecord`.

Major fields:

- Target role and salary.
- Target application/employment dates.
- Skills to develop.
- Portfolio and education goals.
- Notes.

### `JobApplication`

Extends `BaseRecord`.

Major fields:

- Company, job title, URL, location.
- Remote status and salary range.
- Application date, status, contact, follow-up date.
- Interview dates and notes.
- Resume version.
- Linked portfolio project IDs.
- Offer evaluation fields.

### `LearningRecord`

Extends `BaseRecord`.

Major fields:

- Title, type, subject, status.
- Start/completion dates.
- Notes.
- Related skills.

### `SkillRecord`

Extends `BaseRecord`.

Major fields:

- Skill.
- Confidence.
- Evidence.
- Related project IDs.
- Last practiced timestamp.
- Next action.

## Capture and utility models

### `QuickCapture`

Extends `BaseRecord`.

Major fields:

- Capture type.
- Title and body.
- Processed flag.
- Converted target type and ID.
- Optional project ID.

Quick captures can be converted into notes, SQL queries, projects, formulas, KPIs, interview questions, and focus items.

### `Tag`

Tag record with name, optional color, created timestamp, and usage count.

### `Relationship`

Polymorphic link between two records:

```ts
type Relationship = {
  id: ID
  fromType: RecordType
  fromId: ID
  toType: RecordType
  toId: ID
  label?: string
  createdAt: ISODate
}
```

Used by `RelationshipPanel` and link helpers in `data-service.ts`.

### `ActivityRecord`

Append-only activity log entry:

- Type.
- Summary.
- Optional entity type and ID.
- Created timestamp.

The app keeps the activity table trimmed to the latest 500 rows.

### `FocusItem`

Command Center focus item:

- Text.
- Completion flag and completion timestamp.
- Sort order.
- Carried-forward flag.

### `RecentItem`

Recent navigation entry:

- ID composed as `type:id`.
- Record type.
- Title.
- Opened timestamp.

The app keeps the latest 40 recent items.

## Dexie table relationships

The data model uses a mix of direct ID references, ID arrays, and polymorphic relationships.

- Direct optional IDs: e.g. `DashboardPlan.projectId`, `PortfolioCaseStudy.projectId`, `ThinkingSession.projectId`, `ThinkingSession.noteId`.
- ID arrays: e.g. `Project.datasetIds`, `Project.queryIds`, `SQLQuery.projectIds`, `Dataset.dashboardIds`, `InterviewQuestion.relatedKnowledgeIds`.
- Polymorphic links: `Relationship` records connect arbitrary supported `RecordType` pairs with an optional label.
- Activity and recent rows point back to records through `RecordType` plus ID.

There is no database-level foreign-key enforcement in IndexedDB. Pages and services maintain links at write time.

## Backup format

`AnalystOSBackup` is the JSON export/import type.

```ts
type AnalystOSBackup = {
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
```

### Manifest

`BackupManifest` includes:

- `backupVersion`.
- `schemaVersion`.
- `exportedAt`.
- `appName`.
- `appVersion`.
- `recordCounts`.

### Export behavior

`buildBackup()` exports:

- Preferences.
- Personal knowledge and annotations.
- Personal notes, formulas, KPIs, and interview questions.
- SQL queries and versions.
- Datasets, projects, thinking sessions, dashboards, portfolio, career records, captures, tags, relationships, activities, focus items, and recents.

It filters out built-in notes, built-in formulas, built-in KPIs, and built-in interview questions. Built-in knowledge entries are shipped in code and are not included as backup records.

### Restore behavior

`restoreBackup(backup, 'replace')` clears personal data first and then writes backup records.

`restoreBackup(backup, 'merge')` bulk puts backup records into existing tables.

`validateBackup()` currently performs a lightweight shape check: manifest and preferences must exist, and projects and notes must be arrays.

