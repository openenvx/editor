export async function sha256Hex(bytes: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function fetchAndVerifyArtifact(input: {
  url: string;
  contentHash: string;
  fetchImpl?: typeof fetch;
}): Promise<string> {
  const expected = input.contentHash.trim().toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(expected)) {
    throw new Error('Invalid contentHash');
  }
  const fetchFn = input.fetchImpl ?? fetch;
  const response = await fetchFn(input.url);
  if (!response.ok) {
    throw new Error(`Artifact fetch failed: ${response.status}`);
  }
  const buffer = await response.arrayBuffer();
  const actual = await sha256Hex(buffer);
  if (actual !== expected) {
    throw new Error('Artifact contentHash mismatch');
  }
  return new TextDecoder().decode(buffer);
}
