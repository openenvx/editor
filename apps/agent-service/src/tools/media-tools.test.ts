import { describe, expect, it, vi } from 'vitest';

import { MemoryAssetBucket } from '../assets/ingest-asset';
import { createMediaTools, sanitizeSvgMarkup } from './media-tools';

describe('sanitizeSvgMarkup', () => {
  it('strips scripts and handlers', () => {
    const cleaned = sanitizeSvgMarkup(
      '<svg onclick="x()"><script>evil()</script><path d="M0 0"/></svg>'
    );
    expect(cleaned).not.toContain('script');
    expect(cleaned).not.toContain('onclick');
    expect(cleaned).toContain('<path');
  });
});

describe('createMediaTools', () => {
  it('searches Unsplash with mocked API', async () => {
    const fetchImpl = vi.fn(async () =>
      Response.json({
        results: [
          {
            id: 'p1',
            alt_description: 'rose',
            urls: { regular: 'https://images.unsplash.com/rose' },
            user: {
              name: 'Ada',
              links: { html: 'https://unsplash.com/@ada' },
            },
            links: { html: 'https://unsplash.com/photos/p1' },
          },
        ],
      })
    ) as unknown as typeof fetch;

    const tools = createMediaTools({
      publicBaseUrl: 'http://localhost:8789',
      unsplashAccessKey: 'key',
      openRouterApiKey: 'or',
      imageModelId: 'openai/gpt-image-2',
      fetchImpl,
    });

    const result = await tools.searchUnsplash.execute!(
      { query: 'rose' },
      {} as never
    );
    expect(result).toMatchObject({
      ok: true,
      results: [
        expect.objectContaining({
          id: 'p1',
          photographer: 'Ada',
          downloadUrl: 'https://images.unsplash.com/rose',
        }),
      ],
    });
  });

  it('fetches Iconify SVG by icon name', async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M0 0h24v24"/></svg>',
        { status: 200 }
      )
    ) as unknown as typeof fetch;

    const tools = createMediaTools({
      publicBaseUrl: 'http://localhost:8789',
      openRouterApiKey: 'or',
      imageModelId: 'openai/gpt-image-2',
      fetchImpl,
    });

    const result = await tools.searchIcons.execute!(
      { query: 'heart', icon: 'lucide:heart', fill: '#ef4444' },
      {} as never
    );
    expect(result).toMatchObject({ ok: true, icon: 'lucide:heart' });
    expect((result as { svg: string }).svg).toContain('#ef4444');
  });

  it('ingest-asset puts bytes in MemoryAssetBucket', async () => {
    const bucket = new MemoryAssetBucket();
    const fetchImpl = vi.fn(async () =>
      new Response(new Uint8Array([9, 9]), {
        status: 200,
        headers: { 'Content-Type': 'image/jpeg' },
      })
    ) as unknown as typeof fetch;

    const tools = createMediaTools({
      assets: bucket,
      publicBaseUrl: 'http://assets.test',
      openRouterApiKey: 'or',
      imageModelId: 'openai/gpt-image-2',
      fetchImpl,
    });

    const result = await tools.ingestAsset.execute!(
      { url: 'https://cdn.example/a.jpg' },
      {} as never
    );
    expect(result).toMatchObject({ ok: true });
    expect(bucket.objects.size).toBe(1);
  });
});
