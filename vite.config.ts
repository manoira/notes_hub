import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const appVersion =
    process.env.VITE_APP_VERSION || process.env.VERCEL_GIT_COMMIT_SHA || 'dev'

  if (env.VITE_STORAGE_MODE === 'remote') {
    const token = (env.VITE_WORKSPACE_TOKEN ?? '').trim()
    if (!token || token === 'remote' || token === 'local') {
      console.warn(
        '[notes_hub] VITE_STORAGE_MODE=remote but VITE_WORKSPACE_TOKEN is missing or invalid. ' +
          'Set it to the same secret as WORKSPACE_TOKEN, then redeploy.',
      )
    }
  }

  return {
    base: env.BASE_PATH || '/',
    plugins: [
      react(),
      {
        name: 'inject-app-version',
        transformIndexHtml(html) {
          return html.replace(
            '<title>Notes Hub</title>',
            `<title>Notes Hub · ${appVersion.slice(0, 7)}</title>\n    <meta name="app-version" content="${appVersion.slice(0, 7)}" />`,
          )
        },
      },
    ],
    define: {
      __APP_VERSION__: JSON.stringify(appVersion),
    },
    server: {
      port: 5175,
      strictPort: false,
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        },
      },
    },
    preview: {
      port: 5175,
      host: true,
    },
  }
})
