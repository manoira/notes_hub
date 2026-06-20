# Deploy Notes Hub on Vercel

Vercel hosts the **React frontend** and **serverless API** on the same domain — no separate paid web service or disk needed.

## What gets deployed

| Path | Purpose |
| ---- | ------- |
| `/` | React app (Vite build from `dist/`) |
| `/api/v1/workspace` | GET/PUT workspace sync |
| `/api/health` | Health check |

Storage uses **Upstash Redis** via the Vercel Marketplace (free Hobby tier is enough for personal notes). Without Redis env vars, the API falls back to in-memory storage (resets on cold start — dev only).

## 1. Connect GitHub to Vercel

1. Go to [vercel.com](https://vercel.com/) and sign in
2. **Add New → Project**
3. Import **`manoira/notes_hub`**
4. Vercel detects Vite from `vercel.json` — keep defaults:
   - Build: `npm run build`
   - Output: `dist`
5. Deploy (first deploy works in **local browser-only** mode)

## 2. Add Upstash Redis

1. Vercel project → **Storage** / **Marketplace** → search **Upstash Redis**
2. Create a database and **connect** it to the Notes Hub project
3. Vercel injects `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` automatically

## 3. Environment variables

In **Project → Settings → Environment Variables**:

| Variable | Value | Environments |
| -------- | ----- | ------------ |
| `WORKSPACE_TOKEN` | Long random secret | Production, Preview, Development |
| `VITE_STORAGE_MODE` | `remote` | Production, Preview |
| `VITE_WORKSPACE_TOKEN` | Same as `WORKSPACE_TOKEN` | Production, Preview |
| `VITE_APP_VERSION` | Leave empty — Vercel sets `VERCEL_GIT_COMMIT_SHA` at build time (optional) | |

Leave **`VITE_API_BASE_URL` empty** so the app calls `/api/...` on the same domain.

Redeploy after adding variables.

## 4. Custom domain (emmyzettergren.se)

1. Vercel project → **Settings → Domains**
2. Add `emmyzettergren.se` and `www.emmyzettergren.se`
3. Update DNS at Websupport per Vercel’s instructions (usually `A`/`CNAME` to Vercel)
4. Remove or repoint old Render DNS when satisfied

HTTPS is automatic on Vercel.

## 5. Verify

1. Open your Vercel URL (or custom domain)
2. Sidebar should show **Cloud sync** / **Synced** (not *This browser only*)
3. Visit `/api/health` — should return `{"ok":true,"storage":"redis"}`
4. Edit notes on one device/browser — they should appear on another after sync

## Local development with Vercel

```powershell
npm install
vercel link          # once — link to your Vercel project
vercel env pull .env.local   # optional — pull Redis + token vars
```

Create `.env.local`:

```env
VITE_STORAGE_MODE=remote
VITE_WORKSPACE_TOKEN=dev-token
WORKSPACE_TOKEN=dev-token
```

Run:

```powershell
npm run dev:vercel
```

Opens app + API together (default http://localhost:3000).

### Alternative: Vite + Express (no Vercel CLI)

```powershell
# Terminal 1
cd server && npm run dev

# Terminal 2 — .env.local with VITE_STORAGE_MODE=remote
npm run dev
```

## Migrating from Render

1. Deploy and test on Vercel first (Vercel subdomain)
2. Enable Redis + remote sync env vars
3. Move DNS from Render to Vercel
4. Render static site can stay idle or be deleted

The Express server in `server/` remains for local dev without the Vercel CLI; production on Vercel uses `api/` serverless functions instead.

## Cost

Vercel **Hobby** (free) is sufficient for personal Notes Hub usage: static hosting, serverless API, and Redis within free limits.
