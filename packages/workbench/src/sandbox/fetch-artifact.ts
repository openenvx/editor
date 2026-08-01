import {
  assertArtifactUrl,
  MAX_ARTIFACT_BYTES,
  SANDBOX_ARTIFACT_FETCH_TIMEOUT_MS,
} from './sandbox-caps';

export { assertArtifactUrl, MAX_ARTIFACT_BYTES } from './sandbox-caps';

export async function sha256Hex(bytes: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function isAbortError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }
  return (error as { name?: string }).name === 'AbortError';
}

async function readBodyLimited(
  response: Response,
  maxBytes: number,
  signal?: AbortSignal
): Promise<ArrayBuffer> {
  const contentLength = response.headers.get('content-length');
  if (contentLength !== null) {
    const declared = Number(contentLength);
    if (Number.isFinite(declared) && declared > maxBytes) {
      throw new Error('Artifact too large');
    }
  }

  if (signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError');
  }

  if (!response.body) {
    const buffer = await response.arrayBuffer();
    if (buffer.byteLength > maxBytes) {
      throw new Error('Artifact too large');
    }
    return buffer;
  }

  const reader = response.body.getReader();
  const onAbort = (): void => {
    void reader.cancel();
  };
  signal?.addEventListener('abort', onAbort, { once: true });
  try {
    const chunks: Uint8Array[] = [];
    let total = 0;
    for (;;) {
      if (signal?.aborted) {
        throw new DOMException('Aborted', 'AbortError');
      }
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel();
        throw new Error('Artifact too large');
      }
      chunks.push(value);
    }

    const merged = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
      merged.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return merged.buffer;
  } finally {
    signal?.removeEventListener('abort', onAbort);
  }
}

export async function fetchAndVerifyArtifact(input: {
  url: string;
  contentHash: string;
  fetchImpl?: typeof fetch;
  maxBytes?: number;
  /** Abort timeout covering headers + body; defaults to SANDBOX_ARTIFACT_FETCH_TIMEOUT_MS. */
  timeoutMs?: number;
}): Promise<string> {
  assertArtifactUrl(input.url);
  const expected = input.contentHash.trim().toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(expected)) {
    throw new Error('Invalid contentHash');
  }
  const maxBytes = input.maxBytes ?? MAX_ARTIFACT_BYTES;
  const fetchFn = input.fetchImpl ?? fetch;
  const timeoutMs = input.timeoutMs ?? SANDBOX_ARTIFACT_FETCH_TIMEOUT_MS;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchFn(input.url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`Artifact fetch failed: ${response.status}`);
    }
    // Keep abort armed through body read — headers-only timeout left streams hanging.
    const buffer = await readBodyLimited(response, maxBytes, controller.signal);
    const actual = await sha256Hex(buffer);
    if (actual !== expected) {
      throw new Error('Artifact contentHash mismatch');
    }
    return new TextDecoder().decode(buffer);
  } catch (error) {
    if (isAbortError(error) || controller.signal.aborted) {
      throw new Error('Artifact fetch timeout', { cause: error });
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
