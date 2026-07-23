# AnalystOS

**Your second brain for analytics**

AnalystOS is a local-first personal analytics command center. It is built for analysts who want one private workspace for projects, SQL, datasets, notes, KPIs, formulas, dashboard planning, portfolio material, interview prep, and career tracking.

The current product is personal and browser-local:

- No AI.
- No accounts.
- No cloud required.
- No server process required after the static app is built.
- Data is stored in the user's browser profile with IndexedDB.

## Features

- **Command Center**: daily focus list, recent work, project pulse, knowledge metrics, skill snapshot, and activity log.
- **Global search and command palette**: search built-in knowledge, personal records, SQL, projects, datasets, dashboards, portfolio items, captures, jobs, and thinking sessions; run commands such as backup export, theme toggle, and quick capture.
- **Quick Capture and Capture Inbox**: capture notes, SQL, business definitions, dataset issues, insights, tasks, project ideas, formulas, KPIs, and interview questions; convert captures into structured records.
- **Projects**: frame analytics projects with business context, scope, hypotheses, datasets, SQL, calculations, findings, recommendations, milestones, checklists, status updates, and exportable markdown.
- **SQL Vault**: save reusable SQL with dialect, business question, explanation, tables, columns, difficulty, expected output, notes, version history, duplicate/delete flows, and a Monaco SQL editor.
- **SQL Workspace**: temporary local `sql.js` SQLite workspace for CSV import, SQL execution, result export, and saving workspace queries back to the SQL Vault.
- **Knowledge Library**: built-in analytics knowledge across SQL, Excel, Tableau, Power BI, Python, statistics, business analysis, visualization, communication, and career/interview topics; supports annotations, confidence, review status, favorites, tags, and personal copies.
- **Notebook**: structured notes for general notes, SQL, Excel formulas, dashboards, meetings, business definitions, data quality, insights, lessons, interview answers, project decisions, and research.
- **Datasets**: dataset catalog, CSV profiling, column metadata, data quality notes, cleaning log, preview storage, simple preview transformations, duplicate/delete flows, and CSV export of preview rows.
- **Thinking Mode**: guided analysis scoping workflow that can be converted into a project or note.
- **Formulas**: built-in and personal formulas with syntax, examples, use cases, mistakes, related formulas, personal notes, and duplication.
- **KPIs**: built-in and personal KPIs with definitions, formulas, interpretation, use cases, mistakes, related KPIs, and personal notes.
- **Dashboards**: dashboard plan records with audience, decision, KPIs, charts, filters, data sources, layout blocks, accessibility notes, limitations, checklist, and project linking.
- **Portfolio**: case studies with problem, dataset, tools, process, findings, recommendations, resume bullets, LinkedIn copy, README copy, screenshots list, links, and project linking.
- **Interview Lab and STAR Stories**: built-in and personal interview questions, practice records, confidence tracking, project/knowledge links, and STAR story management.
- **Career Hub**: career goals, job applications, learning records, skill records, offer fields, and project links.
- **Settings**: profile, theme/accent/density/font preferences, SQL dialect, landing page, backup reminders, backup export/import, personal data clearing, built-in content reset, demo data controls, PWA guidance, and app metadata.
- **Relationships and recents**: lightweight record links and recent-item tracking across core entities.
- **PWA support**: installable static app with offline shell caching and update prompt.

## Screenshots

Screenshots are intentionally left as placeholders until stable product captures are added.

| Area | Placeholder |
| --- | --- |
| Command Center | `docs/screenshots/command-center.png` |
| SQL Vault | `docs/screenshots/sql-vault.png` |
| Dataset Detail | `docs/screenshots/dataset-detail.png` |
| Knowledge Library | `docs/screenshots/knowledge-library.png` |
| Thinking Mode | `docs/screenshots/thinking-mode.png` |
| Dashboard Planner | `docs/screenshots/dashboard-planner.png` |

## Architecture summary

AnalystOS is a single-page React app served as static files. React Router handles routes inside the browser. The Vite base path is used as the router basename so the same build can run at `/` or under a GitHub Pages project path.

Runtime data is stored in IndexedDB through Dexie. Built-in knowledge is shipped in TypeScript data modules; built-in formulas, KPIs, starter notes, and interview questions are seeded into IndexedDB for querying and annotations. Personal data is stored separately in user-editable Dexie tables. Backup and restore use a JSON export format.

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the full structure.

## Tech stack

Declared project stack:

- React
- TypeScript
- Vite
- React Router
- Dexie / IndexedDB
- Zustand
- TanStack Table
- React Hook Form (RHF)
- Zod
- Monaco
- Recharts
- Lucide
- vite-plugin-pwa

Current source usage includes React, TypeScript, Vite, React Router, Dexie/IndexedDB, Zustand, Monaco, Lucide, and vite-plugin-pwa. TanStack Table, React Hook Form, Zod, and Recharts are installed dependencies available for table, form, validation, and chart work, but they are not currently wired into the checked source screens.

## Local setup

Requirements:

- Node.js compatible with the installed Vite/TypeScript toolchain.
- npm.

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Preview a production build locally:

```bash
npm run build
npm run preview
```

## Build and test commands

```bash
npm run build          # TypeScript project build plus Vite production build
npm run typecheck      # TypeScript project references without pretty output
npm run lint           # oxlint over src
npm run test           # Vitest test suite
npm run test:watch     # Vitest watch mode
npm run test:coverage  # Vitest coverage run
```

## GitHub Pages deployment

AnalystOS supports deployment under a GitHub Pages project path through `VITE_BASE_PATH`.

For a repository published at `https://USER.github.io/REPO/`, build with:

```bash
VITE_BASE_PATH=/REPO/ npm run build
```

For a root domain or user/org page:

```bash
VITE_BASE_PATH=/ npm run build
```

`vite.config.ts` passes this base path to Vite and the PWA manifest. `src/App.tsx` derives the React Router basename from `import.meta.env.BASE_URL`. `public/404.html` provides a GitHub Pages SPA fallback that redirects unknown paths back to `index.html` under the inferred base.

## Storage design

- Database name: `AnalystOS`.
- Storage engine: IndexedDB through Dexie.
- Schema version: `SCHEMA_VERSION` in `src/types/index.ts`.
- Built-in content version: `BUILTIN_CONTENT_VERSION`.
- Backup version: `BACKUP_VERSION`.
- Preferences are stored in a singleton `preferences` record.
- Personal tables include projects, notes, SQL queries, datasets, dashboard plans, portfolio case studies, career records, captures, relationships, activities, focus items, and recents.
- Built-in knowledge entries are defined in TypeScript modules and loaded in memory for the library/search experience.
- Built-in formulas, KPIs, starter notes, and interview questions are seeded into Dexie with `isBuiltIn: true`.
- Backups intentionally export personal/user data and annotations, not the full built-in knowledge corpus.

See [DATA_MODEL.md](./DATA_MODEL.md) for details.

## Backup and restore

Backups are JSON files created from Settings or the command palette. Exported files include a manifest with app name, app version, backup version, schema version, export timestamp, and record counts.

Restore modes:

- **Replace**: clears personal data and loads the backup payload.
- **Merge**: bulk puts backup records into existing local tables.

Before clearing personal data or replacing a workspace, export a backup from Settings.

## PWA installation

The app is configured with `vite-plugin-pwa` using prompt-based update registration. In supported browsers, install AnalystOS from the address bar install icon or browser menu. On mobile, use the browser share menu and choose "Add to Home Screen".

The service worker caches the static shell and selected assets. IndexedDB data remains local to the browser profile and is not included in the service worker cache.

## Privacy

AnalystOS is designed for local-first personal use. It does not implement accounts, cloud sync, AI requests, telemetry, or a backend API. Data entered into the app stays in the browser profile unless the user exports a backup file or imports data manually.

External network access can still occur for normal web assets depending on runtime path and browser cache, including Google Fonts and the `sql.js` wasm CDN fallback if the local wasm asset is unavailable.

## Limitations

- Browser storage can be cleared by the user, browser settings, enterprise policy, or profile reset. Use JSON backups for portability.
- IndexedDB is scoped to browser profile and origin; data does not automatically move between browsers or devices.
- No multi-user collaboration, sharing, cloud sync, permissions, or accounts are implemented.
- No AI features are implemented.
- The SQL Workspace is temporary and in-memory; save queries to the SQL Vault and export results if needed.
- The current test suite is unit/integration oriented and does not include full browser end-to-end coverage.
- Some installed dependencies are available for future screens but are not yet used in the current UI.

## Future collaboration roadmap

The current product is the personal local-first version. Future collaborative or public versions are only roadmap ideas and are not implemented. See [ROADMAP.md](./ROADMAP.md).
