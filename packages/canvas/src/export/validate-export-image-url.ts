const PRIVATE_IPV4_RANGES = [
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^169\.254\./,
  /^0\./,
  /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./,
  /^172\.(1[6-9]|2\d|3[0-1])\./,
];

function isPrivateIpv4(hostname: string): boolean {
  return PRIVATE_IPV4_RANGES.some((pattern) => pattern.test(hostname));
}

function isBlockedHostname(hostname: string): boolean {
  const normalized = hostname.toLowerCase();
  if (
    normalized === 'localhost' ||
    normalized.endsWith('.localhost') ||
    normalized.endsWith('.local')
  ) {
    return true;
  }
  if (normalized.includes(':')) {
    return true;
  }
  return isPrivateIpv4(normalized);
}

/** Trust-boundary guard for Node export image fetches. */
export function assertExportImageUrlAllowed(src: string): void {
  if (!src) {
    return;
  }
  if (src.startsWith('data:')) {
    return;
  }
  let url: URL;
  try {
    url = new URL(src);
  } catch {
    throw new Error(`Invalid export image URL: ${src}`);
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new Error(
      `Export image URL scheme "${url.protocol}" is not allowed (use https:, http:, or data:)`
    );
  }
  if (isBlockedHostname(url.hostname)) {
    throw new Error(`Export image host "${url.hostname}" is not allowed`);
  }
}
