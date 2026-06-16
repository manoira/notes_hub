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

## Production (Websupport — emmyzettergren.se)

Auto-deploy via **GitHub Actions** → SFTP → `public_html` on every push to `main`.

### 1. Rensa WordPress (engångs)

Ta backup om du vill, sedan radera WordPress-filer i `public_html` hos Websupport (eller låt första deploy göra det — workflowen ersätter allt i mappen).

### 2. Skapa SFTP-uppgifter

1. Logga in på [admin.websupport.se](https://admin.websupport.se)
2. Välj domänen **emmyzettergren.se**
3. **Avancerad konfiguration → FTP-konton** → skapa eller öppna ett konto
4. Notera **server** (domän eller IP), **användarnamn** och **lösenord**
5. SFTP använder **port 22**

### 3. Lägg in GitHub Secrets (måste du göra själv)

Jag kan inte skapa secrets åt dig — de innehåller ditt lösenord och sätts bara i GitHub:

**[→ Öppna Secrets för notes_hub](https://github.com/manoira/notes_hub/settings/secrets/actions)**

Klicka **New repository secret** för varje rad:

| Secret name | Värde |
| ----------- | ----- |
| `WEBSUPPORT_SFTP_SERVER` | Server från Websupport, t.ex. `emmyzettergren.se` eller IP-adressen de visar |
| `WEBSUPPORT_SFTP_USERNAME` | FTP-användarnamn |
| `WEBSUPPORT_SFTP_PASSWORD` | FTP-lösenord |

Dela **aldrig** lösenordet i chat, kod eller commit.

### 4. Pusha och deploya

När secrets finns: varje `git push` till `main` bygger appen och laddar upp `dist/` till `/public_html/`.

- Workflow: `.github/workflows/deploy-websupport.yml`
- Manuell körning: GitHub → **Actions** → **Deploy to Websupport** → **Run workflow**
- `.htaccess` för Apache ligger i `public/` och följer med i builden

Om uppladdningen misslyckas, prova att ändra `remoteDir` i workflow-filen till `/` (vissa FTP-konton pekar redan på `public_html`).

## Production (Render — alternativ)

Notes Hub is a **static site** on Render (CDN). Media Hub uses a **web service** because it serves an API and database; Notes Hub only ships the Vite build until you add a backend.

### One-time setup

1. Push this repo to GitHub (`main` branch).
2. In [Render Dashboard](https://dashboard.render.com/):
   - **Option A (recommended):** **New → Blueprint** → connect `manoira/notes_hub` → apply `render.yaml`.
   - **Option B:** **New → Static Site** → connect the repo and set:
     - **Build command:** `npm ci && npm run build`
     - **Publish directory:** `dist`
     - **Rewrite rule:** `/*` → `/index.html` (Rewrite)
3. Enable **Auto-Deploy** from `main`.

No secrets are required yet — notes live in the browser (`localStorage`). When you add Neon + an API later, you will add a second Render service (like Media Hub) or extend this blueprint.

### Config (`render.yaml`)

| Setting | Value |
| ------- | ----- |
| Build | `npm ci && npm run build` |
| Publish | `dist` |
| `BASE_PATH` | `/` |
| `NODE_VERSION` | `22` |

### Local production check

```powershell
npm run build
npm run preview
```

Open http://localhost:5175/

## Repository

https://github.com/manoira/notes_hub
