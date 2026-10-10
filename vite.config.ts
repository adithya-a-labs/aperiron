import { defineConfig, type Plugin, type ViteDevServer } from 'vite'
import { createResearchHandler } from './server/groq-browser-search'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

function groqResearch(): Plugin {
  const install = (server: Pick<ViteDevServer, 'middlewares'>) => {
    const handler = createResearchHandler();
    server.middlewares.use((request, response, next) => {
      if (request.url?.split('?')[0] === '/api/groq-research') {
        void handler(request, response);
      } else next();
    });
  };
  return { name: 'groq-research', configureServer: install, configurePreviewServer: install };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), groqResearch()],
  server: {
    port: 5173,
    strictPort: true,
  },
})
