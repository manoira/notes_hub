# Notes Hub

A version of services like Notion and Confluence for tracking notes and data.

## Setup

```powershell
cd C:\Users\emmyz\Projects\notes_hub
npm install
```

## Usage

Run the dev server (port **5175** — reserved for this project):

```powershell
npm run dev
```

Open http://localhost:5175/

## Cross-device sync (preparation)

By default notes stay in the browser. For cloud sync across devices, deploy on **Vercel** (free API + Redis): [docs/VERCEL.md](docs/VERCEL.md).

See also [docs/CROSS_DEVICE_SYNC.md](docs/CROSS_DEVICE_SYNC.md).

Other commands:

```powershell
npm run build    # production build
npm run preview  # preview production build
npm run lint     # eslint
```

## Structure

```
notes_hub/
├── src/           # React app source
├── public/        # static assets
├── index.html     # Vite entry HTML
├── vite.config.ts # dev server on port 5175
└── package.json
```

## Local dev port registry

| Port | Project        |
| ---- | -------------- |
| 5173 | mail-web-client |
| 5174 | media-hub      |
| 5175 | notes_hub      |

## Production (Render — emmyzettergren.se)

Notes Hub deployas som **static site** på Render. Varje push till `main` bygger och publicerar automatiskt.

### 1. Skapa tjänsten på Render (engångs)

1. Gå till [dashboard.render.com](https://dashboard.render.com/)
2. **New → Blueprint**
3. Koppla repot **`manoira/notes_hub`**
4. Applicera `render.yaml` — skapar static site **notes-hub**
5. Vänta tills första deployen är klar (grön bock)
6. Testa Render-URL:en (t.ex. `https://notes-hub-xxxx.onrender.com`)

Inga secrets behövs ännu — notes sparas i webbläsaren (`localStorage`).

### 2. Koppla domänen emmyzettergren.se

I Render → **notes-hub** → **Settings** → **Custom Domains**:

1. Lägg till `emmyzettergren.se` och eventuellt `www.emmyzettergren.se`
2. Render visar vilka DNS-poster du behöver

I [admin.websupport.se](https://admin.websupport.se) → **emmyzettergren.se** → **DNS**:

| Typ | Namn | Värde (från Render) |
|-----|------|---------------------|
| `CNAME` | `www` | Render-hostnamn (t.ex. `notes-hub-xxxx.onrender.com`) |
| `A` eller `ALIAS` | `@` | Render IP (för rotdomän) |

DNS kan ta **15 min – 24 h** att slå igenom. Render aktiverar HTTPS automatiskt.

### 3. Framtida uppdateringar

```
Kodändring → git push till main → Render deployar automatiskt
```

### Config (`render.yaml`)

| Setting | Value |
| ------- | ----- |
| Build | `npm ci && npm run build` |
| Publish | `dist` |
| SPA rewrite | `/*` → `/index.html` |
| `NODE_VERSION` | `22` |

### Lokal produktionstest

```powershell
npm run build
npm run preview
```

Open http://localhost:5175/

## Production (Websupport — ersatt av Render)

SFTP-deploy via GitHub Actions fungerade inte tillförlitligt (servern stängde kopplingen).
Workflowen finns kvar för manuell körning: **Actions → Deploy to Websupport → Run workflow**.

## Repository

https://github.com/manoira/notes_hub
