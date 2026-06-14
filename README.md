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

## Repository

https://github.com/manoira/notes_hub
