import { RENDER_IR_VERSION } from '@xmazu/openenvxee-preview';
import { describe, expect, it, vi } from 'vitest';

import { exportViaService } from './export-service-client';

describe('exportViaService', () => {
  it('posts render IR payload and returns blob response', async () => {
    const fetchMock = vi.fn(async () =>
      Response.json(null, {
        headers: {
          'content-disposition': 'attachment; filename="artboard.svg"',
          'content-type': 'image/svg+xml',
          'x-export-warnings': '0',
        },
        status: 200,
      })
    );
    vi.stubGlobal('fetch', fetchMock);

    const result = await exportViaService('', {
      document: {
        irVersion: RENDER_IR_VERSION,
        nodes: [],
        page: {
          height: 100,
          width: 100,
        },
      },
      format: 'svg',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/export',
      expect.objectContaining({ method: 'POST' })
    );
    expect(result.fileName).toBe('artboard.svg');
    expect(result.mimeType).toBe('image/svg+xml');
    expect(result.warnings).toBe(0);
  });
});
