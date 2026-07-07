import { AssetServiceId, InstantiationService } from '@openenvx/core';
import type { AssetService } from '@openenvx/core';
import { normalizeScene } from '@openenvx/schema';
import { describe, expect, it, vi } from 'vitest';

import { CanvasClipboardService } from './canvas-clipboard-service';

describe(CanvasClipboardService, () => {
  it('receives AssetService via constructor injection', async () => {
    const upload = vi.fn().mockResolvedValue('asset://injected');
    const assets: AssetService = {
      resolveUrl: (ref) => ref,
      upload,
    };

    const services = new InstantiationService();
    services.registerInstance(AssetServiceId, assets);
    const clipboard = services.createInstance(CanvasClipboardService);

    const page = normalizeScene({
      activePageId: 'p1',
      pages: [{ id: 'p1', layout: 'absolute', layers: [], name: 'Page' }],
    }).pages[0]!;
    const layer = await clipboard.createImageLayerFromExternalPaste(
      page,
      { x: 12, y: 34 },
      {
        blob: new Blob(['png'], { type: 'image/png' }),
        naturalHeight: 100,
        naturalWidth: 200,
      }
    );

    expect(upload).toHaveBeenCalledOnce();
    expect(layer?.data).toEqual({
      alt: 'Pasted image',
      assetRef: 'asset://injected',
    });
    expect(layer?.transform).toMatchObject({ x: 12, y: 34, width: 200, height: 100 });
  });
});
