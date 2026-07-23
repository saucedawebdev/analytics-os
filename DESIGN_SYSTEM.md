# AnalystOS Design System

AnalystOS uses a dark-first interface with a dense analytics-workspace feel. The implementation is currently CSS-token driven in `src/styles/global.css`.

## Principles

- Local workspace, not marketing site.
- High contrast and readable long-form content.
- Fast scanning through panels, badges, lists, tabs, and compact metadata.
- Mobile usable first, with a desktop sidebar when space allows.
- Motion should be short and optional.

## Theme model

Preferences are stored in IndexedDB and applied by `src/lib/prefs-store.ts` through `data-*` attributes on the document element:

- `data-theme`: `dark`, `light`, or resolved system preference.
- `data-accent`: `cyan`, `blue`, `teal`, or `indigo`.
- `data-density`: `comfortable` or `compact`.
- `data-font-size`: `sm`, `md`, or `lg`.
- `data-reduced-motion`: `true` or `false`.

## Color tokens

Default theme is dark.

```css
--bg-base: #0a0c10;
--bg-elevated: #11151c;
--bg-panel: #151a23;
--bg-hover: #1b2230;
--bg-active: #222b3a;
--bg-input: #0e1218;

--border-subtle: #2a3344;
--border-strong: #3a465c;
--border-focus: var(--accent);

--text-primary: #f4f7fb;
--text-secondary: #9aa6b8;
--text-muted: #6b778a;
--text-inverse: #0a0c10;
```

Semantic colors:

```css
--success: #34d399;
--warning: #fbbf24;
--danger: #f87171;
```

Each semantic color also has a soft translucent background token.

## Accent system

The default accent is cyan.

```css
--accent: #22d3ee;
--accent-soft: rgba(34, 211, 238, 0.12);
--accent-strong: #06b6d4;
--accent-secondary: #8b5cf6;
--accent-secondary-soft: rgba(139, 92, 246, 0.14);
```

Supported accent variants:

- Cyan: default.
- Blue: `#38bdf8` / `#0ea5e9`.
- Teal: `#2dd4bf` / `#14b8a6`.
- Indigo: `#818cf8` / `#6366f1`.

Use the accent for primary actions, active navigation, focus states, selected tabs, install/update affordances, and important but non-dangerous emphasis.

## Light theme

Light mode is supported through `[data-theme='light']`.

It changes base, panel, text, border, and shadow tokens while keeping the same component class names and accent model. Light mode is available, but the design is optimized dark-first.

## Typography

Fonts are loaded in `index.html` from Google Fonts:

- Display: `Space Grotesk`.
- Sans: `IBM Plex Sans`.
- Mono: `IBM Plex Mono`.

CSS tokens:

```css
--font-sans: 'IBM Plex Sans', 'Segoe UI', sans-serif;
--font-display: 'Space Grotesk', 'IBM Plex Sans', sans-serif;
--font-mono: 'IBM Plex Mono', ui-monospace, monospace;
```

Usage:

- Page titles, hero titles, brand text, and metric values use `--font-display`.
- Body copy, inputs, buttons, navigation, and labels use `--font-sans`.
- SQL snippets, IDs, code blocks, and technical values use `--font-mono`.

Font-size preference:

- Small: root `14px`.
- Medium: root `15px`.
- Large: root `16px`.

## Spacing and density

Base spacing tokens:

```css
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;
```

Compact density reduces middle spacing tokens to tighten panels and forms:

```css
[data-density='compact'] {
  --space-3: 10px;
  --space-4: 12px;
  --space-5: 14px;
  --space-6: 18px;
}
```

## Radius and shadow

```css
--radius-sm: 8px;
--radius-md: 12px;
--radius-lg: 16px;
--radius-xl: 22px;

--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.35);
--shadow-md: 0 8px 24px rgba(0, 0, 0, 0.35);
--shadow-glow: 0 0 0 1px var(--accent-soft), 0 0 24px rgba(34, 211, 238, 0.12);
```

Use:

- Small/medium radius for inputs, buttons, badges, list items, and table wrappers.
- Large/x-large radius for panels, heroes, modals, and sheets.
- Glow only for brand mark, primary buttons, active/focused launch cards, and major accent surfaces.

## Layout shell

Implemented in `src/layouts/AppShell.tsx` and `src/styles/global.css`.

### Mobile layout

Default layout is mobile:

- Top sticky bar.
- Single-column workspace.
- Bottom navigation with five slots:
  - Home.
  - Projects.
  - Center capture FAB.
  - Library.
  - More.
- The "More" button opens a modal sheet with the remaining navigation items.

Relevant tokens:

```css
--topbar-height: 56px;
--bottom-nav-height: 68px;
--safe-bottom: env(safe-area-inset-bottom, 0px);
```

### Desktop layout

At `min-width: 900px`:

- The bottom nav is hidden.
- A left desktop sidebar appears.
- The shell uses two columns: nav plus main workspace.
- The sidebar can collapse from `--nav-width` to `--nav-collapsed`.

Relevant tokens:

```css
--nav-width: 248px;
--nav-collapsed: 72px;
```

### Wide layout

At `min-width: 1200px`, the CSS includes support for `.app-shell.with-context` with a right context panel width of `--context-width: 320px`. The current shell class does not always enable this by default; it is available for future contextual layouts.

## Core components

### Panels

Panels are the main content container:

- Background: `--bg-panel`.
- Border: `--border-subtle`.
- Radius: `--radius-lg`.
- Padding: `--space-5`.
- Shadow: `--shadow-sm`.

Use panels to group editable sections, metrics, lists, and detail content.

### Lists

List items are clickable or structured rows:

- Background: `--bg-elevated`.
- Hover: `--bg-hover`.
- Border strengthens on hover.
- Title plus muted metadata is the preferred pattern.

### Buttons

Variants:

- Primary: accent gradient, inverse text, glow.
- Secondary: hover background and subtle border.
- Ghost: transparent with hover fill.
- Danger: danger soft background and danger text.

### Forms

Inputs, selects, and textareas share:

- Full width.
- Minimum height `44px`.
- Background `--bg-input`.
- Border `--border-subtle`.
- Focus border `--accent` and `--accent-soft` ring.

Labels are uppercase, small, and secondary colored.

### Badges

Badges communicate type, source, status, and metadata:

- Default.
- Accent.
- Success.
- Warning.
- Danger.
- Built-in.

Use badges sparingly inside list rows, page actions, and entity headers.

### Tables

Tables are wrapped in `.table-wrap` for overflow and border radius. Table headers use uppercase muted text and hover background. The project currently has TanStack Table installed but current source tables are plain HTML tables.

### Modals and sheets

Mobile sheet behavior:

- Fixed backdrop.
- Sheet placed at the bottom by default.
- At wider widths, modals are centered.
- Sheet animation is short and vertical.

The command palette uses the modal base with its own result list styling.

## Motion rules

Base transition:

```css
--transition: 160ms ease;
```

Current motion:

- Button press translation.
- Hover transitions on buttons, nav, launch cards, list rows, inputs, and tabs.
- Modal sheet enter animation.
- Skeleton shimmer animation.

Reduced motion:

- User preference sets `data-reduced-motion='true'`.
- CSS also respects `prefers-reduced-motion: reduce`.
- Both paths force animation and transition durations close to zero.

Rules for new motion:

- Keep transitions under 200ms for routine UI.
- Avoid decorative motion that delays data entry.
- Always work with reduced motion enabled.
- Prefer opacity/transform over layout-shifting animation.

## Accessibility notes

Existing patterns include:

- `:focus-visible` outlines.
- Explicit labels on many form fields.
- `aria-label` on icon-only controls.
- Semantic buttons for commands.
- Print styles that hide app chrome.

Areas to keep improving:

- Ensure every new field has an accessible label.
- Keep contrast high in all accent variants.
- Avoid using color alone for status.
- Maintain keyboard access for modals, search, and navigation.

