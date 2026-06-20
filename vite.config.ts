import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const appVersion = process.env.VITE_APP_VERSION || 'dev'

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
    },
    preview: {
      port: 5175,
      host: true,
    },
  }
})
