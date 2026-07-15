import { timingSafeEqual } from 'node:crypto';

export interface EntitlementWebhookPayload {
  jti: string;
  revoked?: boolean;
  maxVersion?: string;
  packageName?: string;
}

export async function signWebhookPayload(
  payload: string,
  secret: string
): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(payload)
  );

  return [...new Uint8Array(signature)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export async function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const expected = await signWebhookPayload(payload, secret);
  if (expected.length !== signature.length) {
    return false;
  }

  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return timingSafeEqual(a, b);
}
