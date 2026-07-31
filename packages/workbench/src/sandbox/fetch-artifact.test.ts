import { describe, expect, it } from 'vitest';

import { fetchAndVerifyArtifact, sha256Hex } from './fetch-artifact';

describe('fetchAndVerifyArtifact', () => {
  it('accepts matching hash and rejects mismatch', async () => {
    const source = 'export const x = 1;';
    const bytes = new TextEncoder().encode(source);
    const hash = await sha256Hex(bytes.buffer);
    const ok = await fetchAndVerifyArtifact({
      url: 'https://example.com/plugin.js',
      contentHash: hash,
      fetchImpl: async () =>
        new Response(source, { status: 200, headers: { 'content-type': 'text/javascript' } }),
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
});
