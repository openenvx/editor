import { Hono } from 'hono';
import { cors } from 'hono/cors';

import type { AgentServiceBindings } from './app-bindings';
import { registerAssetRoutes } from './routes/asset-routes';
import { registerChatRoute } from './routes/chat-route';
import { registerThreadRoutes } from './routes/thread-routes';

export type { AgentServiceBindings } from './app-bindings';

export function createAgentApp() {
  const app = new Hono<{ Bindings: AgentServiceBindings }>();

  app.use('*', cors());

  app.get('/health', (context) => context.json({ ok: true }));

  registerAssetRoutes(app);
  registerThreadRoutes(app);
  registerChatRoute(app);

  return app;
}
