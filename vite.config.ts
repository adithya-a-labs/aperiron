import { defineConfig } from 'vite'
import type { Nitro } from 'nitro/types'
import { nitro } from 'nitro/vite'
import { workflow } from 'workflow/vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const workflowVirtualImportFix = () => ({
  name: 'aperiron:workflow-virtual-import-fix',
  nitro: {
    setup(nitro: Nitro) {
      for (const id of ['#workflow/webhook.mjs', '#workflow/workflows.mjs']) {
        const handler = nitro.options.virtual[id]
        if (typeof handler === 'string') {
          nitro.options.virtual[id] = handler.replace(
            'import(currentImportPath)',
            'import(/* @vite-ignore */ currentImportPath)',
          )
        }
      }
    },
  },
})

export default defineConfig({
  plugins: [react(), tailwindcss(), nitro(), workflow(), workflowVirtualImportFix()],
  nitro: { serverDir: './', vercel: { entryFormat: 'node', functions: { maxDuration: 120 } } },
  server: {
    port: 5173,
    strictPort: true,
  },
})
