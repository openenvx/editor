import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { cors } from 'hono/cors';

import { exportRequestSchema } from './schemas/export-request';
import { createCloudflareBrowserRenderer } from './services/browser-renderer';
import { resolveExportErrorStatus } from './services/export-error-status';
import { EXPORT_LIMITS } from './services/export-limits';
import { runExport } from './services/export-runner';

export interface ExportServiceBindings {
  BROWSER?: Fetcher;
}

export function createExportApp() {
  const app = new Hono<{ Bindings: ExportServiceBindings }>();

  app.use('*', cors());

  app.get('/health', (context) => context.json({ ok: true }));

  app.post(
    '/api/export',
    zValidator('json', exportRequestSchema),
    async (context) => {
      const request = context.req.valid('json');
      const payloadBytes = new TextEncoder().encode(
        JSON.stringify(request)
      ).byteLength;

      if (payloadBytes > EXPORT_LIMITS.maxPayloadBytes) {
        return context.json(
          {
            error: `Export payload exceeds ${EXPORT_LIMITS.maxPayloadBytes} bytes`,
          },
          413
        );
      }

      const browser =
        request.format === 'svg'
          ? undefined
          : context.env.BROWSER
            ? createCloudflareBrowserRenderer(context.env.BROWSER)
            : undefined;

      try {
        const result = await runExport(request, browser);

        return new Response(result.body, {
          headers: {
            'cache-control': 'no-store',
            'content-disposition': `attachment; filename="${result.fileName}"`,
            'content-type': result.contentType,
            'x-export-height': String(result.heightPx),
            'x-export-page-dpi': String(result.pageDpi),
            'x-export-page-preset': result.pagePresetId ?? '',
            'x-export-page-unit': result.pageUnit,
            'x-export-warnings': String(result.diagnostics.length),
            'x-export-width': String(result.widthPx),
          },
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Export failed';
        const status = resolveExportErrorStatus(error) as 400 | 413 | 422;
        return context.json({ error: message }, status);
      }
    }
  );

  return app;
}
