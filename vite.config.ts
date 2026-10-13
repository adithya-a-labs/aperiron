import { createLogger, defineConfig } from 'vite'
import { nitro } from 'nitro/vite'
import { workflow } from 'workflow/vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const logger = createLogger()
const warn = logger.warn

logger.warn = (message, options) => {
  if (
    /#workflow\/(?:webhook|workflows)\.mjs[\s\S]*The above dynamic import cannot be analyzed by Vite\./.test(
      message,
    )
  ) {
    return
  }
  warn(message, options)
}

export default defineConfig({
  customLogger: logger,
  plugins: [react(), tailwindcss(), nitro(), workflow()],
  nitro: { serverDir: './', vercel: { entryFormat: 'node', functions: { maxDuration: 120 } } },
  server: {
    port: 5173,
    strictPort: true,
  },
})
