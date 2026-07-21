import type { Hono } from 'hono';

import type { AgentServiceBindings } from '../app-bindings';

export function registerAssetRoutes(
  app: Hono<{ Bindings: AgentServiceBindings }>
): void {
  app.get('/assets/*', async (context) => {
    const bucket = context.env.ASSETS;
    if (!bucket) {
      return context.json({ error: 'ASSETS binding is not configured' }, 503);
    }

    const key = context.req.path.replace(/^\/assets\//, '');
    if (!key || key.includes('..')) {
      return context.json({ error: 'Invalid asset key' }, 400);
    }

    const object = await bucket.get(key);
    if (!object) {
      return context.json({ error: 'Not found' }, 404);
    }

    const bytes = await object.arrayBuffer();
    const contentType =
      object.httpMetadata?.contentType ?? 'application/octet-stream';

    return new Response(bytes, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  });
}
