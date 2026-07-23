# AnalystOS Roadmap

The current AnalystOS product is the personal local-first version:

- No AI.
- No accounts.
- No cloud required.
- No collaboration.
- Data stored locally in the user's browser profile.
- Backup and restore through JSON files.

Everything below is a future idea only. None of these collaboration features are implemented in the current codebase.

## Current product focus

The personal version should remain strong at:

- Fast capture and retrieval.
- Local-first privacy.
- Reliable backup and restore.
- High-quality analytics project documentation.
- SQL, dataset, KPI, formula, dashboard, portfolio, interview, and career workflows.
- Durable browser-local storage.
- PWA installability.

## Future public/collaborative version ideas

If AnalystOS ever grows into a public collaborative product, these areas would need deliberate design and implementation.

### Identity and workspace model

Possible future concepts:

- Optional accounts.
- Personal and team workspaces.
- Workspace invitations.
- Roles such as owner, editor, commenter, and viewer.
- Clear separation between private personal data and shared workspace data.

Not implemented today.

### Sync and conflict resolution

Possible future concepts:

- Server-backed sync.
- Offline-first sync queue.
- Conflict detection for records edited on multiple devices.
- Merge UI for conflicting text fields.
- Record version history beyond current local snapshots.
- Sync status indicators.

Not implemented today.

### Sharing and publishing

Possible future concepts:

- Shareable read-only project pages.
- Public portfolio case studies.
- Dashboard plan exports with controlled visibility.
- Link-based sharing with expiration.
- Per-record publish/unpublish controls.

Not implemented today.

### Collaboration workflows

Possible future concepts:

- Comments on projects, SQL queries, datasets, and dashboard plans.
- Mentions and assignments.
- Review states for analysis deliverables.
- Approval checkpoints for metrics and dashboard definitions.
- Shared activity feed.

Not implemented today.

### Team analytics knowledge base

Possible future concepts:

- Shared definitions.
- Approved SQL snippets.
- Team KPI catalog.
- Dataset ownership metadata.
- Review status for knowledge entries.
- Duplicate detection across team records.

Not implemented today.

### Import/export and integrations

Possible future concepts:

- GitHub export for portfolio case studies.
- CSV/Parquet metadata import.
- BI-tool metadata links.
- Calendar or task integrations for career/focus workflows.
- SQL warehouse connection metadata without storing secrets in local browser storage.

Not implemented today.

### Security and compliance

A collaborative version would require a security model that does not exist in the current local-only app:

- Authentication.
- Authorization.
- Audit logs.
- Encryption strategy.
- Secret handling.
- Data retention controls.
- Export/delete workflows.
- Administrative controls.

Not implemented today.

### Public API

Possible future concepts:

- API for workspace records.
- Webhooks for record changes.
- Import/export endpoints.
- Typed SDK.

Not implemented today.

## Non-goals for the current personal version

These are not current-version goals:

- Accounts.
- Cloud sync.
- Multi-user editing.
- Public sharing.
- AI-generated analysis.
- Server-side storage.
- Hosted database dependency.

## Near-term personal improvements

These ideas fit the current local-first product without changing it into a collaborative system:

- More component tests around capture conversion and settings restore.
- Better dataset profiling coverage.
- Optional local-only full-text search index.
- More robust backup validation and version migration tests.
- Better import/export for projects and portfolio case studies.
- More keyboard shortcuts.
- Improved accessibility checks.
- More explicit storage warning and backup reminders.
- Screenshots and documentation images once UI stabilizes.

