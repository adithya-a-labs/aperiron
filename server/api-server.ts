import { createServer } from 'node:http';
import { createResearchHandler } from './groq-browser-search';
import { createDefaultTravelService, createTravelHandler } from './travel-details';

export function createApiHandler() {
  const research = createResearchHandler(), travel = createTravelHandler(createDefaultTravelService());
  return (req: import('node:http').IncomingMessage, res: import('node:http').ServerResponse) => {
    const path = req.url?.split('?')[0];
    if (path === '/api/groq-research') void research(req, res);
    else if (path === '/api/travel-details' || path === '/api/travel-details/refresh') void travel(req, res);
    else { res.writeHead(404); res.end(); }
  };
}
// Separate launcher keeps imports safe for Vite and tests.
export function startApiServer() {
  const port = Number(process.env.API_SERVER_PORT ?? process.env.GROQ_SERVER_PORT ?? 8787);
  return createServer(createApiHandler()).listen(port, '127.0.0.1', () => console.log(`Local API listening on http://127.0.0.1:${port}`));
}
