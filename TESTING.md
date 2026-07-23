# AnalystOS Testing

AnalystOS uses Vitest for local unit and integration tests.

## Test stack

Configured in `vite.config.ts`:

```ts
test: {
  globals: true,
  environment: 'happy-dom',
  setupFiles: ['./src/test/setup.ts'],
  include: ['src/**/*.{test,spec}.{ts,tsx}'],
}
```

Supporting packages:

- Vitest.
- `happy-dom` test environment.
- `@testing-library/jest-dom`.
- `fake-indexeddb`.

## Setup behavior

`src/test/setup.ts` imports:

```ts
import '@testing-library/jest-dom/vitest'
import 'fake-indexeddb/auto'
```

After each test, it deletes and reopens the Dexie database:

```ts
afterEach(async () => {
  const { db } = await import('@/db')
  await db.delete()
  await db.open()
})
```

This keeps IndexedDB state isolated between tests.

## Commands

```bash
npm run test           # Run all tests once
npm run test:watch     # Watch mode
npm run test:coverage  # Coverage run
npm run typecheck      # TypeScript validation
npm run lint           # oxlint over src
npm run build          # TypeScript build plus Vite production build
```

## Existing coverage

### `src/services/data-service.test.ts`

Covers:

- Default preference creation.
- Relationship creation and lookup.
- Backup creation.
- Backup validation.
- Clearing personal data.
- Restore from backup.

Important flows:

- `ensurePreferences()`.
- `linkRecords()` / `getRelated()`.
- `buildBackup()`.
- `validateBackup()`.
- `clearPersonalData()`.
- `restoreBackup()`.

### `src/services/flows.test.ts`

Covers:

- Demo data creation with linked projects, SQL queries, and datasets.
- Creating personal notes and SQL queries directly in Dexie.
- Activity logging.
- Removing demo data without wiping preferences.

Important flows:

- `createDemoData()`.
- `removeDemoData()`.
- `logActivity()`.

### `src/services/search-service.test.ts`

Covers:

- Built-in SQL library has substantial content.
- Built-in knowledge spans all configured knowledge categories.
- Built-in formulas, KPIs, and interview questions seed substantial content.
- Command search finds commands.
- Global search finds built-in knowledge deterministically.
- Shared search scoring helper is used.

Important flows:

- `allBuiltinKnowledge()`.
- `searchCommands()`.
- `globalSearch()`.
- `scoreMatch()`.

### `src/utils/index.test.ts`

Covers:

- Greeting by hour.
- Text truncation.
- CSV serialization and parsing.
- Class name joining.
- Search scoring preference for exact matches.

Important flows:

- `greetingForHour()`.
- `truncate()`.
- `toCsv()`.
- `parseCsv()`.
- `cn()`.
- `scoreMatch()`.

## Critical flows to protect

The following flows are central to AnalystOS and should remain covered as the app changes:

1. **Startup**
   - Preferences are created if missing.
   - Built-in content seeds without duplicating user data.
   - Demo data only installs when onboarding flags allow it.

2. **Backup and restore**
   - Export includes expected personal tables.
   - Built-in content is not exported as personal content.
   - Replace restore clears personal data before importing.
   - Merge restore preserves unrelated local records unless IDs collide.
   - Invalid backup payloads are rejected.

3. **Data safety**
   - Clearing personal data does not remove built-in content.
   - Removing demo data does not remove preferences.
   - Activity and recent-item trimming keep bounded local tables.

4. **Relationships**
   - Record links are deduplicated.
   - Related records can be found from either side of a link.
   - Deleting demo data removes demo relationships.

5. **Search**
   - Built-in and personal records both appear in global search.
   - Commands remain searchable.
   - Search ordering stays deterministic enough for tests.

6. **Capture conversion**
   - Quick captures convert into the intended target record types.
   - Converted captures retain source tags where supported.
   - Converted captures are marked processed with target type and ID.

7. **SQL workflows**
   - SQL query save creates version rows.
   - Duplicate/delete preserve or remove version history correctly.
   - SQL Workspace CSV import handles headers and rows.

8. **Dataset workflows**
   - CSV profiling detects row/column counts.
   - Column profile metadata is generated.
   - Preview transformations update preview data and cleaning logs.

9. **Thinking Mode**
   - Sessions save correctly.
   - Conversion to project and note preserves the generated plan.
   - Links are created between source session and converted record.

10. **Settings**
    - Preference updates persist.
    - Theme/accent/density/font settings apply to document attributes.
    - Backup import supports replace and merge paths.

## Current gaps

The current repository does not include:

- Browser end-to-end tests.
- Visual regression tests.
- Accessibility automation.
- PWA install/update integration tests.
- Cross-browser IndexedDB behavior tests.
- Performance tests for large workspaces.

Those are appropriate future additions if the app becomes larger or publicly distributed.

## Suggested test additions

Near-term additions that would improve confidence:

- Unit tests for `profileCsv()`, `objectsToCsv()`, and dataset transformations.
- Tests for quick-capture conversion helpers in `page-utils.tsx`.
- Tests for `thinkingPlan()` and project markdown export.
- Tests for activity/recent trimming limits.
- Tests that built-in reset preserves personal records.
- Component tests for Command Palette keyboard navigation.
- Component tests for Settings backup restore modes using fake IndexedDB.

## Running before release

Recommended local release check:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

For GitHub Pages builds, also run:

```bash
VITE_BASE_PATH=/REPO/ npm run build
```

Replace `/REPO/` with the actual project path.

