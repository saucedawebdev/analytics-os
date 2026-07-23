# AnalystOS Deployment

AnalystOS deploys as static files. The current app has no backend service, no database server, no account service, and no cloud dependency.

## Build output

Production build:

```bash
npm run build
```

This runs:

```bash
tsc -b && vite build
```

The static output is written to `dist/`.

Local production preview:

```bash
npm run preview
```

## Required environment variable

`VITE_BASE_PATH` controls the Vite base path and the React Router basename.

Default:

```bash
VITE_BASE_PATH=/
```

Project-path deployment:

```bash
VITE_BASE_PATH=/REPO/
```

The trailing slash is important for asset paths and PWA scope.

## GitHub Pages

For a repository served at:

```text
https://USER.github.io/REPO/
```

build with:

```bash
VITE_BASE_PATH=/REPO/ npm run build
```

Then publish `dist/` to GitHub Pages using the repository's chosen Pages workflow.

For a user/org site or custom domain served at the root:

```bash
VITE_BASE_PATH=/ npm run build
```

## Why the base path matters

`vite.config.ts` uses:

```ts
const base = process.env.VITE_BASE_PATH || '/'

export default defineConfig({
  base,
  // ...
})
```

That base is also used by the PWA plugin:

- Manifest `start_url`.
- Manifest `scope`.
- Workbox `navigateFallback`.

`src/App.tsx` derives the router basename from Vite's base:

```ts
const routerBasename = import.meta.env.BASE_URL.replace(/\/$/, '') || undefined
```

This allows routes such as `/projects/:id` to work when the app is hosted under `/REPO/`.

## SPA fallback

GitHub Pages does not natively route unknown SPA paths to `index.html`. AnalystOS includes `public/404.html`, which redirects unknown paths back to `index.html` under the inferred base path.

This is intended for direct visits or refreshes on nested routes such as:

```text
https://USER.github.io/REPO/projects/abc
```

## PWA and offline notes

PWA support is configured through `vite-plugin-pwa`.

Key settings:

- `registerType: 'prompt'`.
- Static shell assets are precached.
- `display: 'standalone'`.
- `theme_color` and `background_color`: `#0a0c10`.
- Icons are in `public/icons`.
- Google Fonts stylesheets and font files use runtime cache rules.
- `maximumFileSizeToCacheInBytes` is set to 6 MB.
- The Workbox glob includes JS, CSS, HTML, ICO, SVG, WOFF2, and WASM assets.

The app registers the service worker in `src/lib/pwa.ts`. When a new version is available, `PwaUpdateBanner` prompts the user to reload.

Important offline boundary:

- The PWA caches the app shell and selected assets.
- User data remains in IndexedDB.
- Exported backup JSON files are outside the PWA cache.
- The SQL Workspace first tries to load the local `sql.js` wasm asset and then falls back to the `sql.js` CDN. If the wasm asset is not available offline and was not cached, SQL Workspace startup can fail while the rest of the saved-record UI remains available.

## Privacy boundary in deployment

Static hosting serves the application bundle. It does not receive user records by default.

User-entered data is stored in the browser profile for the deployed origin. Changing origin changes the IndexedDB namespace. Examples:

- `http://localhost:5173`
- `https://USER.github.io/REPO`
- `https://custom-domain.example`

Each origin has its own local database.

## Deployment checklist

Before publishing:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

For GitHub Pages project paths:

```bash
VITE_BASE_PATH=/REPO/ npm run build
```

After publishing:

1. Open the root page.
2. Open a nested route directly or refresh on one.
3. Confirm static assets load from the expected base path.
4. Open Settings and confirm backup export works.
5. Confirm PWA install prompt behavior in a supported browser.
6. Confirm reload shows the same local IndexedDB data on the same origin.

## Rollback

Rollback is a static hosting operation:

1. Re-publish a previous `dist/` build or previous Pages artifact.
2. Users may need to reload when the PWA update banner appears.
3. Local IndexedDB data remains on the user's device unless schema changes require migration.

Because the current schema version is `1`, there are no historical client migrations to coordinate yet.

