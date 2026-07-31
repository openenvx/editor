import { describe, expect, it } from 'vitest';

import {
  assertArtifactUrl,
  fetchAndVerifyArtifact,
  sha256Hex,
} from './fetch-artifact';

describe('fetchAndVerifyArtifact', () => {
  it('accepts matching hash and rejects mismatch', async () => {
    const source = 'export const x = 1;';
    const bytes = new TextEncoder().encode(source);
    const hash = await sha256Hex(bytes.buffer);
    const ok = await fetchAndVerifyArtifact({
      url: 'https://example.com/plugin.js',
      contentHash: hash,
      fetchImpl: async () =>
        new Response(source, {
          status: 200,
          headers: { 'content-type': 'text/javascript' },
        }),
    });
    expect(ok).toBe(source);

    await expect(
      fetchAndVerifyArtifact({
        url: 'https://example.com/plugin.js',
        contentHash: hash,
        fetchImpl: async () => new Response('tampered', { status: 200 }),
      })
    ).rejects.toThrow(/contentHash mismatch/);
  });

  it('rejects non-https artifact URLs except localhost http', () => {
    expect(() => assertArtifactUrl('https://cdn.example.com/a.js')).not.toThrow();
    expect(() => assertArtifactUrl('http://localhost:3000/a.js')).not.toThrow();
    expect(() => assertArtifactUrl('http://127.0.0.1/a.js')).not.toThrow();
    expect(() => assertArtifactUrl('http://evil.example.com/a.js')).toThrow(
      /protocol not allowed/
    );
    expect(() => assertArtifactUrl('data:text/javascript,alert(1)')).toThrow(
      /protocol not allowed/
    );
    expect(() => assertArtifactUrl('ftp://example.com/a.js')).toThrow(
      /protocol not allowed/
    );
  });

  it('rejects oversized artifacts', async () => {
    const source = 'x'.repeat(100);
    const bytes = new TextEncoder().encode(source);
    const hash = await sha256Hex(bytes.buffer);
    await expect(
      fetchAndVerifyArtifact({
        url: 'https://example.com/plugin.js',
        contentHash: hash,
        maxBytes: 16,
        fetchImpl: async () =>
          new Response(source, {
            status: 200,
            headers: { 'content-length': String(bytes.byteLength) },
          }),
      })
    ).rejects.toThrow(/Artifact too large/);
  });

  it('rejects oversized artifacts without content-length via streaming', async () => {
    const source = 'x'.repeat(100);
    const bytes = new TextEncoder().encode(source);
    const hash = await sha256Hex(bytes.buffer);
    await expect(
      fetchAndVerifyArtifact({
        url: 'https://example.com/plugin.js',
        contentHash: hash,
        maxBytes: 16,
        fetchImpl: async () => {
          const stream = new ReadableStream<Uint8Array>({
            start(controller) {
              controller.enqueue(bytes);
              controller.close();
            },
          });
          return new Response(stream, { status: 200 });
        },
      })
    ).rejects.toThrow(/Artifact too large/);
  });
});
