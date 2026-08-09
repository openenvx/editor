import { applyProposedChanges } from '@openenvx/agent';
import {
  proposedChangesPayloadSchema,
  type ProposedChange,
} from '@openenvx/agent/schemas';
import { SceneStore } from '@openenvx/core';
import { SCHEMA_VERSION } from '@openenvx/core/schema';
import { describe, expect, it, vi } from 'vitest';

import {
  ingestBytes,
  MemoryAssetBucket,
} from './assets/ingest-asset';
import { getProposalStore } from './request-context';
import { createMediaTools } from './tools/media-tools';
import { createProposalTools } from './tools/proposal-tools';

type ApplyApi = Parameters<typeof applyProposedChanges>[0];

function buildProposedChangesStreamPart(proposedChanges: ProposedChange[]): {
  type: 'data-proposed-changes';
  data: { changes: ProposedChange[]; summary: string };
} | null {
  if (proposedChanges.length === 0) {
    return null;
  }
  return {
    type: 'data-proposed-changes',
    data: {
      changes: proposedChanges,
      summary: `${proposedChanges.length} proposed change(s)`,
    },
  };
}

function createStore() {
  return new SceneStore(
    {
      schemaVersion: SCHEMA_VERSION,
      pages: [
        {
          id: 'p1',
          name: 'Page 1',
          layout: 'absolute',
          width: 800,
          height: 600,
          layers: [],
        },
      ],
    },
    { activePageId: 'p1', primaryLayerId: null, selectedLayerIds: [] }
  );
}

function apiFor(store: SceneStore): ApplyApi {
  return {
    scene: store,
    selectLayers: (layerIds, primary) => store.selectLayers(layerIds, primary),
    runCommand: async () => ({ executed: false }),
  } as unknown as ApplyApi;
}

describe('media tools → proposal → apply', () => {
  it('ingests Unsplash URL then proposes canvas.image', async () => {
    const bucket = new MemoryAssetBucket();
    const png = new Uint8Array([137, 80, 78, 71]);
    const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('images.unsplash.com') || url.includes('photo')) {
        return new Response(png, {
          status: 200,
          headers: { 'Content-Type': 'image/png' },
        });
      }
      return new Response('not found', { status: 404 });
    }) as unknown as typeof fetch;

    const media = createMediaTools({
      assets: bucket,
      publicBaseUrl: 'http://localhost:8789',
      unsplashAccessKey: 'test-key',
      openRouterApiKey: 'or-key',
      imageModelId: 'openai/gpt-image-2',
      fetchImpl,
    });

    const ingested = await media.searchUnsplash.execute!(
      {
        query: 'flowers',
        ingestUrl: 'https://images.unsplash.com/photo-test',
      },
      {} as never
    );

    expect(ingested).toMatchObject({ ok: true, ingested: true });
    const assetUrl = (ingested as { assetUrl: string }).assetUrl;

    const requestToken = {};
    const tools = createProposalTools(requestToken);
    await tools.proposeCreateLayer.execute!(
      {
        type: 'canvas.image',
        id: 'img-stock',
        data: { assetRef: assetUrl, alt: 'flowers' },
      },
      {} as never
    );

    const streamPart = buildProposedChangesStreamPart(
      getProposalStore(requestToken)
    );
    const parsed = proposedChangesPayloadSchema.parse(streamPart!.data);
    const store = createStore();
    const result = await applyProposedChanges(
      apiFor(store),
      parsed.changes,
      parsed.summary
    );

    expect(result).toEqual({ applied: 1, skipped: 0 });
    expect(store.getScene().pages[0]!.layers[0]).toMatchObject({
      id: 'img-stock',
      type: 'canvas.image',
      data: { assetRef: assetUrl },
    });
  });

  it('drafts SVG then proposes canvas.svg', async () => {
    const media = createMediaTools({
      publicBaseUrl: 'http://localhost:8789',
      openRouterApiKey: 'or-key',
      imageModelId: 'openai/gpt-image-2',
    });

    const drafted = await media.draftSvg.execute!(
      {
        svg: '<svg viewBox="0 0 24 24" onclick="alert(1)"><script>x</script><path d="M0 0h24v24" fill="currentColor"/></svg>',
        fill: '#111827',
      },
      {} as never
    );
    expect(drafted).toMatchObject({ ok: true });
    const data = (drafted as { data: { svg: string; fill: string } }).data;
    expect(data.svg).not.toContain('script');
    expect(data.svg).not.toContain('onclick');

    const requestToken = {};
    const tools = createProposalTools(requestToken);
    await tools.proposeCreateLayer.execute!(
      {
        type: 'svg',
        id: 'icon-1',
        data,
      },
      {} as never
    );

    const streamPart = buildProposedChangesStreamPart(
      getProposalStore(requestToken)
    );
    const parsed = proposedChangesPayloadSchema.parse(streamPart!.data);
    expect(parsed.changes[0]).toMatchObject({ type: 'canvas.svg' });

    const store = createStore();
    const result = await applyProposedChanges(apiFor(store), parsed.changes);
    expect(result.applied).toBe(1);
    expect(store.getScene().pages[0]!.layers[0]).toMatchObject({
      type: 'canvas.svg',
      data: { fill: '#111827' },
    });
  });

  it('generate-image stores bytes in R2 and proposes canvas.image', async () => {
    const bucket = new MemoryAssetBucket();
    const b64 = btoa('fake-png-bytes');
    const fetchImpl = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.includes('openrouter.ai/api/v1/images') && init?.method === 'POST') {
        return Response.json({
          data: [{ b64_json: b64 }],
        });
      }
      return new Response('no', { status: 404 });
    }) as unknown as typeof fetch;

    const media = createMediaTools({
      assets: bucket,
      publicBaseUrl: 'https://agent.example',
      openRouterApiKey: 'or-key',
      imageModelId: 'openai/gpt-image-2',
      fetchImpl,
    });

    const generated = await media.generateImage.execute!(
      { prompt: 'a blue square logo' },
      {} as never
    );
    expect(generated).toMatchObject({
      ok: true,
      model: 'openai/gpt-image-2',
    });
    const assetUrl = (generated as { assetUrl: string }).assetUrl;
    expect(assetUrl).toContain('https://agent.example/assets/');
    expect(bucket.objects.size).toBe(1);

    const requestToken = {};
    const tools = createProposalTools(requestToken);
    await tools.proposeCreateLayer.execute!(
      {
        type: 'canvas.image',
        id: 'gen-1',
        data: { assetRef: assetUrl },
      },
      {} as never
    );

    const store = createStore();
    const parsed = proposedChangesPayloadSchema.parse(
      buildProposedChangesStreamPart(getProposalStore(requestToken))!.data
    );
    await applyProposedChanges(apiFor(store), parsed.changes);
    expect(store.getScene().pages[0]!.layers[0]).toMatchObject({
      id: 'gen-1',
      type: 'canvas.image',
      data: { assetRef: assetUrl },
    });
  });

  it('serves ingested assets via GET /assets/:key', async () => {
    const bucket = new MemoryAssetBucket();
    const { key } = await ingestBytes({
      bucket,
      publicBaseUrl: 'http://localhost:8789',
      bytes: new Uint8Array([1, 2, 3]),
      contentType: 'image/png',
      keyPrefix: 'test',
    });

    const object = await bucket.get(key);
    expect(object).not.toBeNull();
    const bytes = new Uint8Array(await object!.arrayBuffer());
    expect([...bytes]).toEqual([1, 2, 3]);
    expect(object!.httpMetadata?.contentType).toBe('image/png');
  });
});
