# AGENTS.md

## Cursor Cloud specific instructions

Notes Hub is a Vite 8 + React 19 + TypeScript single-page app (root `package.json`, `src/`). It works fully standalone using browser `localStorage`; an optional backend adds cross-device cloud sync. Node `>=22` is required.

### Services

| Service | Path | Required | Run command | Port |
| --- | --- | --- | --- | --- |
| Frontend (Vite SPA) | `/` (root) | Yes | `npm run dev` | 5175 |
| Backend API (Express) | `server/` | Optional (sync only) | `WORKSPACE_TOKEN=dev-token npm run dev` | 3001 |

- The frontend dev server runs on port **5175** (not Vite's default 5173), set in `vite.config.ts`. `strictPort: false`, so if 5175 is taken Vite picks another port — use the URL it prints.
- The Vite dev server proxies `/api` → `http://localhost:3001`, so the Express backend only needs to be running to test remote sync; no extra config is needed for the proxy.
- README setup/run commands are written for Windows PowerShell but are standard npm scripts that run unchanged on Linux.

### Lint / build / test

- Lint: `npm run lint` (root). Note: lint currently reports pre-existing `react-hooks/set-state-in-effect` errors in several `src/components/*.tsx` files (from `eslint-plugin-react-hooks` v7). These are unrelated to env setup; do not "fix" them unless that is the task.
- Build: `npm run build` (root, `tsc -b && vite build`). This is the reliable quality gate and passes cleanly.
- Tests: there is **no test framework or test files** anywhere in the repo. There is no `test` script — do not expect one.

### Cross-device sync (optional, remote mode)

To exercise sync end to end (Express variant): run the backend with `WORKSPACE_TOKEN=dev-token npm run dev` in `server/`, then create root `.env.local` with `VITE_STORAGE_MODE=remote`, `VITE_WORKSPACE_TOKEN=dev-token`, `VITE_API_BASE_URL=` (empty, uses the Vite proxy), and run `npm run dev`. `VITE_*` vars are baked at build/dev-start time, so restart the Vite server after changing them. The Express backend persists to `server/data/workspace.json`. The Vercel serverless variant (`api/`) is for deployment (`npm run dev:vercel` needs `vercel link`) and falls back to in-memory storage without Upstash Redis.
