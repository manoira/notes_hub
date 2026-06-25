# AGENTS.md

## Cursor Cloud specific instructions

This repo is **Notes Hub**: a Vite + React SPA (Notion-style notes app). The frontend is the
product and works standalone in browser/`localStorage` mode — no backend or secrets required for
normal use. Dev server runs on port **5175** (configured in `vite.config.ts`).

Standard commands live in `README.md` and root `package.json`. Notes that are not obvious:

- **Run it:** `npm run dev`, then open `http://localhost:5175/`. Vite binds to `localhost`/`::1`
  only (no `--host`), so verify with `curl http://localhost:5175/` rather than `127.0.0.1`.
  This is enough to fully exercise the app (create/edit notes persist to `localStorage`).
- **Optional cloud-sync backend** (only for cross-device sync, not needed for normal dev):
  - Express variant: `server/` (port 3001) — has its own `package.json`/lockfile; run
    `npm install --prefix server` then `npm run dev:api`, and start the frontend with
    `VITE_STORAGE_MODE=remote`. The update script does **not** install `server/` deps.
  - Vercel serverless variant (`api/`, Upstash Redis): `npm run dev:vercel`.
- **Lint:** `npm run lint` runs `eslint .`. The tooling works, but the current source has
  pre-existing lint errors (lint exits non-zero) — not an environment issue.
- No automated test suite is configured.
