import { createServer } from 'node:http';
import { createResearchHandler } from './groq-browser-search';
import { createDefaultTravelService, createTravelHandler } from './travel-details';
import { BASE, createAssistantHandler, type AssistantOptions } from './assistant/routes';

export function createApiHandler(options: AssistantOptions = {}) {
  const travelService = options.travel ?? createDefaultTravelService();
  const research = createResearchHandler(), travel = createTravelHandler(travelService);
  // Corrupt accounting fails closed without taking the existing map/provider routes down.
  let assistant: ReturnType<typeof createAssistantHandler> | null = null;
  let assistantFailed = false;
  return async (req: import('node:http').IncomingMessage, res: import('node:http').ServerResponse) => {
    const path = req.url?.split('?')[0];
    if (path === '/api/groq-research') await research(req, res);
    else if (path === '/api/travel-details' || path === '/api/travel-details/refresh') await travel(req, res);
    else if (path === BASE || path?.startsWith(`${BASE}/`)) {
      if (!assistant && !assistantFailed) { try { assistant = createAssistantHandler({ ...options, travel: travelService }); } catch { assistantFailed = true; } }
      if (assistant) await assistant.handler(req, res);
      else { res.writeHead(503, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify({ error: { code: 'SERVICE_UNAVAILABLE', message: 'Assistant storage needs recovery.', retryable: false, fieldErrors: [] }, meta: { schemaVersion: '1', requestId: 'unavailable' } })); }
    }
    else { res.writeHead(404); res.end(); }
  };
}
// Separate launcher keeps imports safe for Vite and tests.
export function startApiServer() {
  const port = Number(process.env.API_SERVER_PORT ?? process.env.GROQ_SERVER_PORT ?? 8787);
  return createServer(createApiHandler()).listen(port, '127.0.0.1', () => console.log(`Local API listening on http://127.0.0.1:${port}`));
}
