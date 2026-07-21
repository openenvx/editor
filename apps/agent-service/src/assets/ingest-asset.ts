/** Minimal R2-like interface so tests can use an in-memory bucket. */
export interface AssetObjectBody {
  arrayBuffer(): Promise<ArrayBuffer>;
  httpMetadata?: { contentType?: string };
}

export interface AssetBucket {
  put(
    key: string,
    value: ArrayBuffer | Uint8Array | string,
    options?: { httpMetadata?: { contentType?: string } }
  ): Promise<void>;
  get(key: string): Promise<AssetObjectBody | null>;
}

export class MemoryAssetBucket implements AssetBucket {
  readonly objects = new Map<
    string,
    { bytes: Uint8Array; contentType?: string }
  >();

  async put(
    key: string,
    value: ArrayBuffer | Uint8Array | string,
    options?: { httpMetadata?: { contentType?: string } }
  ): Promise<void> {
    let bytes: Uint8Array;
    if (typeof value === 'string') {
      bytes = new TextEncoder().encode(value);
    } else if (value instanceof ArrayBuffer) {
      bytes = new Uint8Array(value);
    } else {
      bytes = value;
    }
    this.objects.set(key, {
      bytes,
      contentType: options?.httpMetadata?.contentType,
    });
  }

  async get(key: string): Promise<AssetObjectBody | null> {
    const object = this.objects.get(key);
    if (!object) {
      return null;
    }
    const { bytes, contentType } = object;
    return {
      arrayBuffer: async () =>
        bytes.buffer.slice(
          bytes.byteOffset,
          bytes.byteOffset + bytes.byteLength
        ) as ArrayBuffer,
      httpMetadata: contentType ? { contentType } : undefined,
    };
  }
}

export function createAssetKey(prefix: string, ext: string): string {
  const id =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const cleanPrefix = prefix.replaceAll(/^\/+|\/+$/g, '');
  const cleanExt = ext.startsWith('.') ? ext : `.${ext}`;
  return `${cleanPrefix}/${id}${cleanExt}`;
}

export function assetPublicUrl(publicBaseUrl: string, key: string): string {
  const base = publicBaseUrl.replace(/\/$/, '');
  return `${base}/assets/${key}`;
}

export async function ingestBytes(options: {
  bucket: AssetBucket;
  publicBaseUrl: string;
  bytes: ArrayBuffer | Uint8Array;
  contentType: string;
  keyPrefix?: string;
  ext?: string;
}): Promise<{ key: string; assetUrl: string }> {
  const ext =
    options.ext ??
    (options.contentType.includes('png')
      ? '.png'
      : options.contentType.includes('jpeg') ||
          options.contentType.includes('jpg')
        ? '.jpg'
        : options.contentType.includes('webp')
          ? '.webp'
          : options.contentType.includes('svg')
            ? '.svg'
            : '.bin');
  const key = createAssetKey(options.keyPrefix ?? 'media', ext);
  await options.bucket.put(key, options.bytes, {
    httpMetadata: { contentType: options.contentType },
  });
  return {
    key,
    assetUrl: assetPublicUrl(options.publicBaseUrl, key),
  };
}

export async function ingestFromUrl(options: {
  bucket: AssetBucket;
  publicBaseUrl: string;
  url: string;
  keyPrefix?: string;
  fetchImpl?: typeof fetch;
}): Promise<{ key: string; assetUrl: string; contentType: string }> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const response = await fetchImpl(options.url);
  if (!response.ok) {
    throw new Error(
      `Failed to download asset (${response.status}): ${options.url}`
    );
  }
  const contentType =
    response.headers.get('content-type')?.split(';')[0]?.trim() ||
    'application/octet-stream';
  const bytes = new Uint8Array(await response.arrayBuffer());
  const ingested = await ingestBytes({
    bucket: options.bucket,
    publicBaseUrl: options.publicBaseUrl,
    bytes,
    contentType,
    keyPrefix: options.keyPrefix,
  });
  return { ...ingested, contentType };
}
