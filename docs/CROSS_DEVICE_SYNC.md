# Cross-device sync

Notes Hub is prepared for cloud storage so your workspace can follow you across browsers and devices.

## Current default

Without configuration, the app uses **local mode** (`localStorage` in the browser). Nothing changes for existing users.

## Architecture

```
React app  →  WorkspaceStorage adapter  →  localStorage  (local mode)
                                        →  REST API      (remote mode)
```

| Layer | Purpose |
| ----- | ------- |
| `src/storage/workspace.ts` | Normalize, validate, seed workspace data |
| `src/storage/localStorageAdapter.ts` | Browser-only persistence |
| `src/storage/remoteStorageAdapter.ts` | Sync via API with revision checks |
| `server/` | Minimal Express API (file store today, Postgres later) |

Remote saves use **optimistic concurrency**: each workspace has a `revision`. If two devices save at once, the loser gets a conflict response and reloads the latest copy.

When remote sync is enabled for the first time, existing browser data is **uploaded automatically** if the server workspace is empty.

## Enable remote sync locally

### 1. Start the API

```powershell
cd server
npm install
npm run dev
```

API runs on http://localhost:3001 and stores data in `server/data/workspace.json`.

### 2. Configure the frontend

Copy `.env.example` to `.env.local`:

```env
VITE_STORAGE_MODE=remote
VITE_API_BASE_URL=
VITE_WORKSPACE_TOKEN=dev-token
```

Leave `VITE_API_BASE_URL` empty in dev — Vite proxies `/api` to the local API.

Set the same token on the API:

```powershell
$env:WORKSPACE_TOKEN="dev-token"
npm run dev
```

### 3. Run the frontend

```powershell
npm run dev
```

The sidebar shows **Cloud sync** / **Synced** instead of **This browser only**.

## Production on Render

1. Deploy the API as a **Web Service** (`notes-hub-api` in `render.yaml`).
2. Set `WORKSPACE_TOKEN` on the API service (generate a long random string).
3. Set frontend env vars on the static site:
   - `VITE_STORAGE_MODE=remote`
   - `VITE_API_BASE_URL=https://notes-hub-api-xxxx.onrender.com`
   - `VITE_WORKSPACE_TOKEN=<same token>`
4. Redeploy both services.

For durable production storage, attach **Render Postgres** or **Neon** and implement the store in `server/sql/001_workspace.sql` (schema included; file store is a stepping stone).

## Next steps (not implemented yet)

- User accounts and login (replace single bearer token)
- Postgres-backed store with encrypted tokens
- Real-time sync or WebSocket push
- Offline queue with retry when the network returns
