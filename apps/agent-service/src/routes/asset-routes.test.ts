import { describe, expect, it } from 'vitest';

import type { AgentServiceBindings } from '../app-bindings';
import { createAgentApp } from '../app';
import { ingestBytes, MemoryAssetBucket } from '../assets/ingest-asset';

describe('asset routes', () => {
  it('returns 503 when ASSETS is missing', async () => {
    const app = createAgentApp();
    const response = await app.fetch(
      new Request('http://localhost/assets/missing.png'),
      {} as AgentServiceBindings
    );
    expect(response.status).toBe(503);
  });

  it('serves ingested object bytes', async () => {
    const bucket = new MemoryAssetBucket();
    const { key } = await ingestBytes({
      bucket,
      publicBaseUrl: 'http://localhost:8789',
      bytes: new Uint8Array([10, 20, 30]),
      contentType: 'image/png',
      keyPrefix: 'route',
    });

    const app = createAgentApp();
    const response = await app.fetch(
      new Request(`http://localhost/assets/${key}`),
      { ASSETS: bucket } as AgentServiceBindings
    );
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('image/png');
    const bytes = new Uint8Array(await response.arrayBuffer());
    expect([...bytes]).toEqual([10, 20, 30]);
  });
});
