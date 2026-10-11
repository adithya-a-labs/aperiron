import { defineConfig } from 'vite'
import { nitro } from 'nitro/vite'
import { workflow } from 'workflow/vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss(), nitro(), workflow()],
  nitro: { serverDir: './', vercel: { entryFormat: 'node', functions: { maxDuration: 120 } } },
  server: {
    port: 5173,
    strictPort: true,
  },
})
