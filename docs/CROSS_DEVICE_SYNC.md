# Cross-device sync

Notes Hub can store your workspace in the cloud so it follows you across browsers and devices.

## Current default

Without configuration, the app uses **local mode** (`localStorage` in the browser).

## Architecture

```
React app  →  WorkspaceStorage adapter  →  localStorage  (local mode)
                                        →  REST API      (remote mode)
                                                    ↓
                                            Upstash Redis (production)
                                            memory / file (local dev)
```

| Layer | Purpose |
| ----- | ------- |
| `src/storage/` | Local + remote adapters, revision-based sync |
| `api/` | Vercel serverless API (recommended for production) |
| `server/` | Express API for local dev without Vercel CLI |

## Production (recommended): Vercel

See **[docs/VERCEL.md](./VERCEL.md)** for full setup: GitHub import, Vercel KV, env vars, and custom domain.

Quick summary:

1. Import repo on Vercel
2. Create and link **Upstash Redis** (Vercel Marketplace)
3. Set `WORKSPACE_TOKEN`, `VITE_STORAGE_MODE=remote`, `VITE_WORKSPACE_TOKEN`
4. Leave `VITE_API_BASE_URL` empty (same-origin `/api`)

## Local development

### Option A — Vercel dev (matches production)

```powershell
vercel link
npm run dev:vercel
```

### Option B — Vite + Express

```powershell
cd server && npm run dev   # port 3001
npm run dev                # port 5175, proxies /api
```

`.env.local`:

```env
VITE_STORAGE_MODE=remote
VITE_API_BASE_URL=
VITE_WORKSPACE_TOKEN=dev-token
```

Set `WORKSPACE_TOKEN=dev-token` when running the Express server.

## Alternative: Render

Render requires a paid web service for the API (`notes-hub-api` in `render.yaml`). Vercel is the free alternative. Render docs remain in `render.yaml` if you prefer that path.

## Next steps (not implemented yet)

- User accounts and login (replace single bearer token)
- Postgres instead of KV for very large workspaces
- Offline queue with retry when the network returns
