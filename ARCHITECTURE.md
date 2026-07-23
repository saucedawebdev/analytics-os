# AnalystOS Architecture

AnalystOS is a static, client-side application. The current version is a personal, local-first workspace with no backend, no accounts, no cloud sync, and no AI services.

## Runtime shape

- `index.html` loads `src/main.tsx`.
- `src/main.tsx` mounts the React app and imports global styles.
- `src/App.tsx` bootstraps local data, loads preferences, registers the PWA, and defines routes.
- Data lives in IndexedDB through Dexie.
- UI state and preferences use Zustand.
- Static builds are produced by Vite.

## Source folder structure

```text
src/
  App.tsx                  React Router setup, app bootstrap, global modals
  main.tsx                 React entrypoint
  vite-env.d.ts            Vite/PWA type references
  components/
    common/                App-specific shared components
      PwaUpdateBanner.tsx
      QuickCaptureModal.tsx
      RelationshipPanel.tsx
    search/                Command palette
    ui/                    Reusable UI primitives
  data/
    builtin/               Built-in knowledge, formulas, KPIs, interview questions, starter notes
    demo/                  Demo workspace seed/remove helpers
  db/
    index.ts               Dexie database, stores, preferences, metadata, migrations
  hooks/
    useLiveQuery.ts        Local async query hook
  layouts/
    AppShell.tsx           Desktop sidebar, mobile bottom nav, top bar
  lib/
    prefs-store.ts         Zustand preferences store and theme application
    pwa.ts                 Service worker registration
    ui-store.ts            Zustand UI state store
  pages/                   Route-level screens and record editors
  services/
    bootstrap.ts           Built-in/demo seed flows and startup
    data-service.ts        Activity, relationships, backup/restore, clear data
    search-service.ts      Global search and command definitions
  styles/
    global.css             Tokens, layout, components, responsive rules
  test/
    setup.ts               Vitest setup and IndexedDB reset
  types/
    index.ts               Application models, versions, unions, backup types
  utils/
    index.ts               IDs, dates, CSV, download, formatting, helpers
    search-score.ts        Shared search scoring
```

## Routing

Routes are declared in `src/App.tsx` inside `BrowserRouter`.

| Path | Screen |
| --- | --- |
| `/` | Command Center |
| `/search` | Search results page |
| `/projects` | Projects list |
| `/projects/new` | New project |
| `/projects/:id` | Project detail |
| `/sql` | SQL Vault |
| `/sql/workspace` | SQL Workspace |
| `/sql/new` | New SQL query |
| `/sql/:id` | SQL query detail |
| `/library` | Knowledge Library |
| `/library/:id` | Built-in knowledge detail |
| `/notes` | Notes list |
| `/notes/new` | New note |
| `/notes/:id` | Note detail |
| `/datasets` | Datasets list |
| `/datasets/new` | New dataset |
| `/datasets/:id` | Dataset detail |
| `/thinking` | Thinking sessions |
| `/thinking/new` | New thinking session |
| `/thinking/:id` | Thinking session detail |
| `/formulas` | Formulas |
| `/formulas/:id` | Formula detail |
| `/kpis` | KPIs |
| `/kpis/:id` | KPI detail |
| `/dashboards` | Dashboard plans |
| `/dashboards/new` | New dashboard plan |
| `/dashboards/:id` | Dashboard detail |
| `/portfolio` | Portfolio case studies |
| `/portfolio/new` | New case study |
| `/portfolio/:id` | Case study detail |
| `/interview` | Interview Lab |
| `/interview/:id` | Interview question detail |
| `/star-stories` | STAR stories |
| `/career` | Career Hub |
| `/career/jobs/new` | New job application |
| `/career/jobs/:id` | Job application detail |
| `/capture` | Capture Inbox |
| `/settings` | Settings |

Unknown paths redirect to `/`.

## GitHub Pages basename

Vite's `base` is derived from `process.env.VITE_BASE_PATH || '/'` in `vite.config.ts`.

`src/App.tsx` derives the router basename from `import.meta.env.BASE_URL`:

```ts
const routerBasename = import.meta.env.BASE_URL.replace(/\/$/, '') || undefined
```

This keeps client routing compatible with root deployments and GitHub Pages project deployments such as `/analystos/`.

`public/404.html` provides a GitHub Pages fallback. It stores the current URL in session storage and redirects to `index.html` under the inferred base path. The current React code does not read that session storage value directly; the fallback still returns users to the SPA shell.

## IndexedDB and Dexie

`src/db/index.ts` defines `AnalystOSDatabase`, a Dexie database named `AnalystOS`.

Important tables:

- `preferences`
- `personalKnowledge`
- `knowledgeAnnotations`
- `notes`
- `sqlQueries`
- `sqlQueryVersions`
- `datasets`
- `projects`
- `thinkingSessions`
- `kpis`
- `formulas`
- `dashboardPlans`
- `portfolioCaseStudies`
- `interviewQuestions`
- `interviewPractices`
- `starStories`
- `careerGoals`
- `jobApplications`
- `learningRecords`
- `skillRecords`
- `quickCaptures`
- `tags`
- `relationships`
- `activities`
- `focusItems`
- `recentItems`
- `meta`

Indexes are declared in the Dexie `version(1).stores(...)` call. They favor common local queries such as updated order, status, tags, favorites, project links, and relationship lookup.

## Startup and seeding

Startup is handled by `bootstrapApp()`:

1. Ensure the singleton preferences record exists.
2. Seed built-in formulas, KPIs, interview questions, and starter notes if needed.
3. Install demo data on first run when preferences indicate the user has not been onboarded.

Built-in knowledge entries are loaded from TypeScript modules with `allBuiltinKnowledge()` and are not persisted wholesale into IndexedDB.

## Built-in versus personal data

AnalystOS keeps a clear distinction between content shipped with the app and user-owned records.

### Built-in content

- Stored in `src/data/builtin/*`.
- Includes knowledge entries for SQL, Excel, Tableau, Power BI, Python, statistics, business analysis, visualization, communication, and career/interview topics.
- Built-in formulas, KPIs, interview questions, and starter notes are seeded into IndexedDB with `isBuiltIn: true`.
- Built-in content can be reset from Settings.

### Personal content

- Created and edited by the user in IndexedDB tables.
- Includes projects, SQL, notes, datasets, dashboard plans, portfolio case studies, career records, captures, relationships, activities, focus items, and personal copies of knowledge/formulas/KPIs/interview questions.
- Exported in JSON backups.

### Annotations and personal copies

Built-in knowledge can be annotated with `KnowledgeAnnotation`. Users can also duplicate built-in knowledge into `PersonalKnowledgeEntry`, which creates a user-owned editable copy linked back to the built-in entry.

## Search

Search is implemented in `src/services/search-service.ts`.

It combines:

- Built-in knowledge from TypeScript modules.
- Built-in formulas, KPIs, and interview questions.
- IndexedDB records for notes, SQL queries, projects, datasets, dashboards, portfolio case studies, personal knowledge, quick captures, job applications, and thinking sessions.
- Static command definitions for navigation and actions.

Scoring is shared through `src/utils/search-score.ts`. Favorites and pinned projects receive small ranking boosts where implemented.

## PWA

PWA behavior is configured in `vite.config.ts` with `vite-plugin-pwa`.

- `registerType: 'prompt'`.
- Manifest name and short name: `AnalystOS`.
- Theme/background color: `#0a0c10`.
- Display mode: `standalone`.
- Icons are in `public/icons`.
- Workbox precaches JS, CSS, HTML, icon, SVG, font, and wasm assets within the configured size limit.
- Runtime caching is configured for Google Fonts stylesheets and font files.

`src/lib/pwa.ts` registers the service worker and raises UI state when an update is ready. `PwaUpdateBanner` lets the user reload or postpone.

## State boundaries

- Dexie stores durable local data.
- Zustand `prefs-store` stores preferences in memory and persists changes to Dexie.
- Zustand `ui-store` stores UI-only state such as command palette visibility, quick capture visibility, sidebar collapse, save status, and PWA update readiness.
- Route components own form draft state and save explicitly into Dexie.

## Backup boundary

Backup/restore lives in `src/services/data-service.ts`.

Backups export the personal workspace and annotations. They do not need to include the full shipped built-in knowledge corpus because built-ins are part of the app bundle and can be reset from Settings.

