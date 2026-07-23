import { SCHEMA_VERSION, type Note, type NoteType } from '@/types'

const FIXED_DATE = '2026-01-01T00:00:00.000Z'

type StarterNoteInput = {
  id: string
  title: string
  type: NoteType
  content: string
  tags: string[]
  checklist?: { id: string; text: string; done: boolean }[]
}

const createStarterNote = (note: StarterNoteInput): Note => ({
  ...note,
  createdAt: FIXED_DATE,
  updatedAt: FIXED_DATE,
  schemaVersion: SCHEMA_VERSION,
  recordVersion: 1,
  favorite: false,
  pinned: false,
  isBuiltIn: true,
})

export const builtinStarterNotes: Note[] = [
  createStarterNote({
    id: 'builtin-note-questions-before-analyzing-data',
    title: 'Questions to ask before analyzing data',
    type: 'research',
    tags: ['analysis-planning', 'stakeholders', 'scoping'],
    content: `# Questions to ask before analyzing data

Use these questions before writing SQL, opening Excel, or building charts. The goal is to turn a vague request into a decision-ready analysis.

## 1. Business decision

- What decision will this analysis support?
- Who will make the decision?
- What actions are realistically available?
- What would change if the answer is high, low, flat, or inconclusive?
- Is this exploratory, diagnostic, monitoring, or decision-support work?

## 2. Metric and definition clarity

- What metric are we analyzing?
- What is the exact numerator and denominator?
- What grain should the result have: user, account, order, session, day, month, or something else?
- What should be included or excluded?
- Are there existing trusted definitions or reports to reconcile against?

## 3. Population and time window

- Which customers, users, products, regions, channels, or teams are in scope?
- What date range matters?
- Are we using event time, processing time, invoice time, or reporting period?
- Do we need comparison periods such as prior week, prior month, prior year, or forecast?

## 4. Data source and quality

- Which system is the source of truth?
- How fresh does the data need to be?
- What known data quality issues exist?
- Are there missing records, duplicate keys, tracking changes, or backfilled data?
- Who can validate the source data and business rules?

## 5. Output and communication

- What format is needed: quick answer, memo, dashboard, dataset, workbook, or presentation?
- What level of precision is enough?
- What caveats must be visible?
- When is the answer needed?
- What follow-up questions are likely?

## Final scoping sentence

Before starting, write one sentence:

> I am analyzing **[metric]** for **[population]** over **[time window]** to help **[stakeholder]** decide **[decision/action]**.
`,
    checklist: [
      { id: 'builtin-note-questions-before-analyzing-data-check-decision', text: 'Confirm the business decision and decision owner', done: false },
      { id: 'builtin-note-questions-before-analyzing-data-check-definition', text: 'Confirm metric definition, grain, filters, and exclusions', done: false },
      { id: 'builtin-note-questions-before-analyzing-data-check-source', text: 'Identify source of truth and known data quality issues', done: false },
      { id: 'builtin-note-questions-before-analyzing-data-check-output', text: 'Agree on output format, deadline, and required precision', done: false },
    ],
  }),
  createStarterNote({
    id: 'builtin-note-data-cleaning-checklist',
    title: 'Data-cleaning checklist',
    type: 'data_quality',
    tags: ['data-cleaning', 'data-quality', 'validation'],
    content: `# Data-cleaning checklist

Cleaning is not just making data look tidy. It is making the dataset fit for the decision while preserving enough evidence to audit what changed.

## Preserve the raw input

- [ ] Save or reference the original raw file/table.
- [ ] Do not overwrite raw data with cleaned data.
- [ ] Record the extraction date, source system, and filters.
- [ ] Keep a copy of removed or exception records when decisions are material.

## Understand structure and grain

- [ ] Confirm what one row represents.
- [ ] Count rows and columns before cleaning.
- [ ] Identify primary keys or business keys.
- [ ] Check whether keys are unique at the expected grain.
- [ ] Confirm whether repeated records are valid events or duplicates.

## Profile fields

- [ ] Check missing values by column.
- [ ] Check data types for dates, numbers, IDs, booleans, and categories.
- [ ] Check minimum, maximum, average, median, and percentiles for numeric fields.
- [ ] Check allowed category values and unexpected labels.
- [ ] Look for leading/trailing spaces, inconsistent case, and placeholder values like "N/A" or "Unknown".

## Clean deliberately

- [ ] Standardize column names.
- [ ] Convert data types explicitly.
- [ ] Trim text fields.
- [ ] Normalize category labels using a mapping table when possible.
- [ ] Deduplicate only after defining the duplicate key.
- [ ] Decide whether missing values should be filled, flagged, excluded, or escalated.

## Validate after cleaning

- [ ] Compare row counts before and after.
- [ ] Reconcile important totals to a trusted source.
- [ ] Review a sample of changed records.
- [ ] Confirm date ranges and filters.
- [ ] Produce an exceptions list for unresolved data issues.

## Document decisions

For every material cleaning step, record:

- What changed
- Why it changed
- How many rows were affected
- Who approved the rule, if applicable
- What risk remains
`,
    checklist: [
      { id: 'builtin-note-data-cleaning-checklist-raw', text: 'Preserve raw input and extraction details', done: false },
      { id: 'builtin-note-data-cleaning-checklist-grain', text: 'Confirm row grain and key uniqueness', done: false },
      { id: 'builtin-note-data-cleaning-checklist-profile', text: 'Profile missing values, types, ranges, and categories', done: false },
      { id: 'builtin-note-data-cleaning-checklist-validate', text: 'Validate row counts, totals, samples, and exceptions after cleaning', done: false },
    ],
  }),
  createStarterNote({
    id: 'builtin-note-dashboard-review-checklist',
    title: 'Dashboard review checklist',
    type: 'dashboard',
    tags: ['dashboard', 'review', 'quality-assurance'],
    content: `# Dashboard review checklist

Use this before publishing or refreshing a dashboard that other people will use for decisions.

## Purpose and audience

- [ ] The dashboard has a clear primary question.
- [ ] The intended audience is named.
- [ ] The dashboard supports a decision, workflow, or monitoring need.
- [ ] It is clear what action a user should take after viewing it.

## Metric correctness

- [ ] KPI definitions are documented.
- [ ] Filters and date windows match the agreed business definition.
- [ ] Totals reconcile to a trusted source.
- [ ] Ratios are calculated from summed numerators and denominators where appropriate.
- [ ] Small denominators or incomplete periods are flagged.

## Data freshness and reliability

- [ ] Last refresh time is visible or easy to find.
- [ ] Refresh schedule matches stakeholder expectations.
- [ ] Failed refreshes have an owner and alert path.
- [ ] Known data quality issues are documented.

## Design and usability

- [ ] The most important information appears first.
- [ ] Chart types match the questions they answer.
- [ ] Titles explain what each visual shows.
- [ ] Units, formats, and date labels are clear.
- [ ] Colors have consistent meaning and sufficient contrast.
- [ ] Filters are understandable and scoped intentionally.

## Interaction testing

- [ ] Slicers and filters affect the expected visuals.
- [ ] Drilldowns, actions, bookmarks, or navigation links work.
- [ ] Empty states are understandable.
- [ ] The dashboard works at the intended screen size.

## Final signoff

- [ ] A subject matter expert reviewed the numbers.
- [ ] A representative user completed a realistic task.
- [ ] Open questions and limitations are documented.
- [ ] Ownership is clear for maintenance and future changes.
`,
    checklist: [
      { id: 'builtin-note-dashboard-review-checklist-purpose', text: 'Confirm dashboard purpose, audience, and supported decision', done: false },
      { id: 'builtin-note-dashboard-review-checklist-metrics', text: 'Reconcile metrics and document definitions', done: false },
      { id: 'builtin-note-dashboard-review-checklist-refresh', text: 'Verify refresh, ownership, and failure handling', done: false },
      { id: 'builtin-note-dashboard-review-checklist-usability', text: 'Test layout, filters, interactions, and empty states', done: false },
    ],
  }),
  createStarterNote({
    id: 'builtin-note-communicate-uncertainty',
    title: 'How to communicate uncertainty',
    type: 'insight',
    tags: ['uncertainty', 'communication', 'statistics'],
    content: `# How to communicate uncertainty

Uncertainty is not a weakness in analysis. It is information decision-makers need in order to weigh risk.

## What to include

- **Point estimate:** the best single estimate from the analysis.
- **Range:** plausible high and low values, confidence interval, forecast band, or scenario range.
- **Source of uncertainty:** sampling error, missing data, tracking change, model assumption, external risk, or incomplete history.
- **Decision threshold:** what value would change the recommendation.
- **Next evidence:** what would reduce uncertainty if more precision is needed.

## Useful language

- "The best estimate is 4.2%, with a plausible range of 3.5% to 4.9%."
- "The direction is consistent across segments, but the exact size varies."
- "This result is sensitive to the assumption that renewal behavior remains similar to last quarter."
- "The data supports action A unless the true lift is below 0.5 percentage points."
- "The current sample is too small to distinguish no effect from a small positive effect."

## Avoid these traps

- Do not report excessive decimal places for estimates.
- Do not hide limitations in a footnote if they affect the decision.
- Do not say "no impact" when the analysis only found "not enough evidence to detect impact."
- Do not use vague phrases like "directionally correct" without explaining confidence.
- Do not present a forecast as a promise.

## Recommendation pattern

> We estimate **[result]**, with uncertainty mainly from **[source]**. The decision threshold is **[threshold]**. Because the likely range is **[above/below/around]** that threshold, I recommend **[action]** and would monitor **[metric]** to confirm.

## Example

> The new onboarding flow increased activation by an estimated 1.8 percentage points. The 95% confidence interval is 0.4 to 3.2 points, and the practical launch threshold was 1.0 point. I recommend launching to the remaining traffic while monitoring support tickets and week-two retention as guardrails.
`,
    checklist: [
      { id: 'builtin-note-communicate-uncertainty-estimate', text: 'State the estimate and the range', done: false },
      { id: 'builtin-note-communicate-uncertainty-source', text: 'Name the main source of uncertainty', done: false },
      { id: 'builtin-note-communicate-uncertainty-threshold', text: 'Connect uncertainty to the decision threshold', done: false },
    ],
  }),
  createStarterNote({
    id: 'builtin-note-present-recommendations',
    title: 'How to present recommendations',
    type: 'insight',
    tags: ['recommendations', 'communication', 'decision-support'],
    content: `# How to present recommendations

A recommendation should help someone decide what to do next. It should not stop at "here is what the data says."

## Recommendation structure

1. **Action:** what should happen.
2. **Rationale:** why the evidence supports it.
3. **Impact:** expected business value or risk reduction.
4. **Tradeoffs:** cost, effort, downside, or uncertainty.
5. **Owner:** who should act.
6. **Measurement:** how success will be monitored.

## Strong recommendation template

> I recommend **[specific action]** for **[audience/process/segment]** because **[key evidence]**. The expected impact is **[business outcome]**. The main risk is **[risk]**, so we should monitor **[guardrail]** and review results by **[date]**.

## Example

> I recommend prioritizing onboarding outreach for new SMB customers in their first 14 days because this segment explains 63% of the churn increase and has the lowest activation rate. The expected impact is a reduction in early churn without changing enterprise workflows. The main risk is support team capacity, so we should monitor outreach completion, activation, and support backlog weekly.

## Checklist before presenting

- [ ] The recommendation is specific enough for someone to execute.
- [ ] The evidence is tied directly to the action.
- [ ] Expected impact is stated in business units where possible.
- [ ] Tradeoffs and uncertainty are visible.
- [ ] The recommendation respects operational constraints.
- [ ] A success metric and review date are included.

## Common weak patterns

- "Monitor the metric" without saying who monitors it or what threshold triggers action.
- "Improve conversion" without naming the lever to change.
- "Do more analysis" without specifying the question that remains unanswered.
- "Launch the change" without guardrails or rollback criteria.
`,
    checklist: [
      { id: 'builtin-note-present-recommendations-action', text: 'State a specific action and owner', done: false },
      { id: 'builtin-note-present-recommendations-evidence', text: 'Tie the action to evidence and expected impact', done: false },
      { id: 'builtin-note-present-recommendations-tradeoffs', text: 'Include tradeoffs, risks, and guardrail metrics', done: false },
    ],
  }),
  createStarterNote({
    id: 'builtin-note-common-sql-mistakes',
    title: 'Common SQL mistakes',
    type: 'sql',
    tags: ['sql', 'mistakes', 'validation'],
    content: `# Common SQL mistakes

Most SQL errors in analytics are not syntax errors. They are logic errors that produce plausible but wrong numbers.

## Grain and duplication

- Joining tables before understanding what one row represents.
- Duplicating fact rows by joining to a non-unique dimension.
- Using \`DISTINCT\` to hide duplication instead of fixing the join.
- Counting rows when the metric requires distinct users, customers, orders, or accounts.

## Filters and dates

- Using a rolling 30 days when the request means calendar month.
- Using inclusive end dates that accidentally include the first moment of the next period.
- Filtering on local time when the business reports in another timezone.
- Putting a right-table filter in the \`WHERE\` clause after a \`LEFT JOIN\`, turning it into an inner join.

## NULLs and conditional logic

- Comparing to NULL with \`= NULL\` instead of \`IS NULL\`.
- Forgetting that NULL values are ignored by many aggregations.
- Treating NULL, zero, blank, and unknown as the same thing.
- Writing CASE conditions in the wrong order.

## Aggregations and ratios

- Averaging row-level percentages instead of calculating \`SUM(numerator) / SUM(denominator)\`.
- Selecting non-grouped columns that do not match the aggregation grain.
- Filtering after aggregation with \`WHERE\` instead of \`HAVING\`.
- Mixing pre-aggregated and raw data without understanding the grain.

## Validation checklist

- [ ] Confirm row count after every major join.
- [ ] Check key uniqueness for lookup tables.
- [ ] Validate totals against a trusted source.
- [ ] Sample rows for edge cases.
- [ ] Test NULL behavior intentionally.
- [ ] Review date boundaries.
- [ ] Explain the final grain in one sentence.

## Good habit

Build complex SQL in steps. Each CTE should have a purpose and a validation question, such as "Does this produce one row per customer per month?"
`,
    checklist: [
      { id: 'builtin-note-common-sql-mistakes-grain', text: 'Confirm final query grain and join cardinality', done: false },
      { id: 'builtin-note-common-sql-mistakes-dates', text: 'Review filters, date boundaries, and timezones', done: false },
      { id: 'builtin-note-common-sql-mistakes-ratios', text: 'Validate aggregations and ratio formulas', done: false },
      { id: 'builtin-note-common-sql-mistakes-null', text: 'Test NULL and unmatched-row behavior', done: false },
    ],
  }),
  createStarterNote({
    id: 'builtin-note-validate-a-metric',
    title: 'How to validate a metric',
    type: 'business_definition',
    tags: ['metrics', 'validation', 'data-quality'],
    content: `# How to validate a metric

Metric validation checks whether a number is correct, defined, stable, and fit for the decision it supports.

## Define the metric

- Name
- Purpose
- Numerator
- Denominator
- Grain
- Time window
- Included and excluded records
- Source tables or systems
- Refresh cadence
- Business owner

## Validate the logic

- [ ] Recompute the metric from raw components.
- [ ] Confirm the numerator and denominator use the same eligible population.
- [ ] Check whether the metric is a count, sum, average, rate, ratio, or percentile.
- [ ] Make sure ratios are not averaged incorrectly.
- [ ] Review NULL, zero, duplicate, and late-arriving data behavior.

## Reconcile against trusted sources

- [ ] Compare totals to finance, operations, CRM, product analytics, or another source of truth.
- [ ] Explain expected differences in scope or timing.
- [ ] Investigate unexpected gaps before publishing.
- [ ] Keep reconciliation notes with the metric definition.

## Test slices and edge cases

- [ ] Segment by date, region, product, channel, and status.
- [ ] Check small denominators.
- [ ] Verify historical trends around source-system or definition changes.
- [ ] Sample individual records that contribute to the metric.

## Monitor after launch

- Refresh failures
- Sudden jumps or drops
- Data freshness lag
- Missing source partitions
- Changes in category values
- Stakeholder disputes about interpretation

## Validation statement

> This metric was validated by reconciling **[total]** to **[trusted source]**, checking **[edge cases]**, and confirming the definition with **[owner]** on **[date]**.
`,
    checklist: [
      { id: 'builtin-note-validate-a-metric-definition', text: 'Document numerator, denominator, grain, filters, and owner', done: false },
      { id: 'builtin-note-validate-a-metric-recompute', text: 'Recompute from raw components and test edge cases', done: false },
      { id: 'builtin-note-validate-a-metric-reconcile', text: 'Reconcile against a trusted source and document differences', done: false },
    ],
  }),
  createStarterNote({
    id: 'builtin-note-document-assumptions',
    title: 'How to document assumptions',
    type: 'project_decision',
    tags: ['assumptions', 'documentation', 'analysis'],
    content: `# How to document assumptions

Assumptions are choices made when the data or business rule is not fully certain. Documenting them makes analysis reviewable and reusable.

## What counts as an assumption

- A definition chosen among multiple plausible definitions.
- An exclusion rule, such as removing test accounts.
- A date boundary or timezone decision.
- A missing-data treatment.
- A forecast rate or business estimate.
- A source-system trust decision.
- A manual mapping or category grouping.

## Assumption log template

| Assumption | Why it was needed | Impact if wrong | Owner/source | Validation status |
| --- | --- | --- | --- | --- |
| Example: Exclude internal test accounts | They do not represent customer behavior | Conversion could be overstated | Data engineering list | Confirmed |

## Checklist

- [ ] Write assumptions before finalizing results.
- [ ] Put high-impact assumptions near the recommendation, not only in an appendix.
- [ ] Identify who confirmed each business rule.
- [ ] Estimate direction of impact if the assumption is wrong.
- [ ] Separate assumptions from known facts.
- [ ] Update assumptions when definitions change.

## Good assumption language

- "This analysis treats an account as active if it had at least one paid invoice in the last 30 days."
- "Refunds are assigned to the original order month, not the refund processing month."
- "Orders with missing product category are included in totals but shown as Unknown in product breakdowns."
- "The forecast assumes paid search spend remains at the June run rate."

## Why this matters

A future reviewer should be able to answer:

1. What did we assume?
2. Why was that reasonable?
3. Who agreed?
4. How much could the result change?
5. What would we check next?
`,
    checklist: [
      { id: 'builtin-note-document-assumptions-log', text: 'Create an assumption log with owner/source and impact', done: false },
      { id: 'builtin-note-document-assumptions-visible', text: 'Surface high-impact assumptions near the recommendation', done: false },
      { id: 'builtin-note-document-assumptions-update', text: 'Update assumptions when definitions or source data change', done: false },
    ],
  }),
  createStarterNote({
    id: 'builtin-note-avoid-misleading-charts',
    title: 'How to avoid misleading charts',
    type: 'dashboard',
    tags: ['visualization', 'chart-review', 'ethics'],
    content: `# How to avoid misleading charts

A chart should make the data easier to understand without exaggerating or hiding important context.

## Scale and axes

- [ ] Use a zero baseline for bar charts unless there is a clear, labeled reason not to.
- [ ] Label axes and units.
- [ ] Avoid dual axes unless the relationship and units are unmistakable.
- [ ] Do not use 3D effects.
- [ ] Make log scales explicit.

## Time and comparison context

- [ ] Use comparable periods.
- [ ] Include enough history to interpret movement.
- [ ] Mark holidays, launches, outages, tracking changes, or policy changes.
- [ ] Avoid cherry-picking start and end dates.

## Aggregation and denominator checks

- [ ] Show sample size or denominator when rates are shown.
- [ ] Avoid comparing raw counts across groups of very different size when a rate is needed.
- [ ] Do not average ratios when weighted calculation is required.
- [ ] Flag incomplete periods.

## Color and emphasis

- [ ] Use color to communicate meaning, not decoration.
- [ ] Keep semantic colors consistent.
- [ ] Avoid red-green-only encodings.
- [ ] Do not highlight a point unless it is actually important.

## Chart type fit

- [ ] Use line charts for trends.
- [ ] Use sorted bars for ranking.
- [ ] Use histograms or box plots for distributions.
- [ ] Use scatter plots for relationships.
- [ ] Use maps only when geography is central to the question.

## Honest title pattern

Weak: "Sales collapsed in Q3"

Better: "Q3 sales were 8% below Q2, mostly from lower paid-search traffic"

The better title states the measured change and main driver without exaggeration.
`,
    checklist: [
      { id: 'builtin-note-avoid-misleading-charts-axis', text: 'Review axes, scales, units, and baselines', done: false },
      { id: 'builtin-note-avoid-misleading-charts-context', text: 'Add needed time, event, and comparison context', done: false },
      { id: 'builtin-note-avoid-misleading-charts-denominator', text: 'Check denominators, aggregation, and incomplete periods', done: false },
      { id: 'builtin-note-avoid-misleading-charts-color', text: 'Use color and emphasis intentionally and accessibly', done: false },
    ],
  }),
  createStarterNote({
    id: 'builtin-note-strong-project-case-study',
    title: 'How to write a strong project case study',
    type: 'interview_answer',
    tags: ['portfolio', 'case-study', 'career'],
    content: `# How to write a strong project case study

A strong analytics case study proves that you can frame a business problem, work with data, reason through tradeoffs, and communicate impact.

## Recommended structure

1. **Business problem**
   - What decision or workflow needed help?
   - Who was the audience?
   - Why did it matter?

2. **Data and scope**
   - What data sources were used?
   - What did one row represent?
   - What filters, time windows, and assumptions mattered?
   - What data quality issues appeared?

3. **Approach**
   - How did you clean, join, analyze, or model the data?
   - What tools did you use?
   - What validation checks did you run?
   - Why was this approach appropriate?

4. **Findings**
   - What were the two or three most important insights?
   - What evidence supports each?
   - What charts or tables make the point clear?

5. **Recommendation or outcome**
   - What action did you recommend?
   - What impact did it have or what impact would you expect?
   - What tradeoffs or limitations remained?

6. **Reflection**
   - What would you improve next?
   - What did you learn?
   - How could the work become more automated, governed, or scalable?

## Checklist

- [ ] Lead with the business problem, not the tool.
- [ ] Include enough data context to make the analysis credible.
- [ ] Show validation, not only final visuals.
- [ ] Use clear charts with captions.
- [ ] Make assumptions and limitations visible.
- [ ] State a recommendation or measurable outcome.
- [ ] Keep code, workbook, or dashboard links organized.

## Strong opening example

> This project investigated why repeat purchase rate declined after a website redesign. I analyzed order, customer, and traffic data to identify which customer segments changed behavior and recommended where the growth team should focus retention experiments.

## Common mistakes

- Showing a dashboard screenshot with no explanation of the decision it supports.
- Listing every technical step without a narrative.
- Claiming business impact that was not measured.
- Omitting messy data issues, assumptions, or limitations.
- Forgetting to explain what you personally contributed.
`,
    checklist: [
      { id: 'builtin-note-strong-project-case-study-problem', text: 'Lead with business problem, audience, and why it mattered', done: false },
      { id: 'builtin-note-strong-project-case-study-data', text: 'Explain data sources, grain, assumptions, and quality issues', done: false },
      { id: 'builtin-note-strong-project-case-study-evidence', text: 'Show key findings with validation and clear visuals', done: false },
      { id: 'builtin-note-strong-project-case-study-impact', text: 'End with recommendation, impact, limitations, and reflection', done: false },
    ],
  }),
]
