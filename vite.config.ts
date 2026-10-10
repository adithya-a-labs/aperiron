import { defineConfig, type Plugin, type ViteDevServer } from 'vite'
import { createApiHandler } from './server/api-server'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

function groqResearch(): Plugin {
  const install = (server: Pick<ViteDevServer, 'middlewares'>) => {
    const handler = createApiHandler();
    server.middlewares.use((request, response, next) => {
      if (['/api/groq-research', '/api/travel-details', '/api/travel-details/refresh'].includes(request.url?.split('?')[0] ?? '')) {
        handler(request, response);
      } else next();
    });
  };
  return { name: 'local-api', configureServer: install, configurePreviewServer: install };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), groqResearch()],
  server: {
    port: 5173,
    strictPort: true,
  },
})
