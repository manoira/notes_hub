import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    base: env.BASE_PATH || '/',
    plugins: [react()],
    define: {
      __APP_VERSION__: JSON.stringify(process.env.VITE_APP_VERSION || 'dev'),
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
