/** QuickJS soft memory ceiling. */
export const SANDBOX_MEMORY_LIMIT_BYTES = 8 * 1024 * 1024;
/** Wall-clock CPU budget per sync eval / pending-jobs burst. */
export const SANDBOX_CPU_LIMIT_MS = 5000;
/** Wall-clock timeout for a Worker eval round-trip. */
export const SANDBOX_EVAL_TIMEOUT_MS = 15_000;
/** Worker ready handshake timeout. */
export const SANDBOX_WORKER_READY_MS = 15_000;
/** Max verified artifact body size. */
export const MAX_ARTIFACT_BYTES = 2 * 1024 * 1024;
/** Max concurrent QuickJS isolates (including in-flight starts). */
export const MAX_CONCURRENT_ISOLATES = 8;
/** Max `showUI` / grant `uiHtml` character length. */
export const MAX_SHOW_UI_HTML_CHARS = 512 * 1024;
/** Max JSON-encoded UI→isolate message size. */
export const MAX_UI_MESSAGE_JSON_CHARS = 64 * 1024;
export const MAX_NOTIFY_MESSAGE_CHARS = 500;
export const MAX_NOTIFY_PER_SECOND = 10;

export function assertArtifactUrl(urlString: string): void {
  let url: URL;
  try {
    url = new URL(urlString);
  } catch {
    throw new Error('Invalid artifactUrl');
  }
  if (url.protocol === 'https:') {
    return;
  }
  if (
    url.protocol === 'http:' &&
    (url.hostname === 'localhost' || url.hostname === '127.0.0.1')
  ) {
    return;
  }
  throw new Error('artifactUrl protocol not allowed');
}

/** Length + sliding 1s rate limit for ungated `notify`. */
export function assertNotifyPolicy(input: {
  message: string;
  recentTimestamps: number[];
  now?: number;
}): number[] {
  if (input.message.length > MAX_NOTIFY_MESSAGE_CHARS) {
    throw new Error('notify message too long');
  }
  const now = input.now ?? Date.now();
  const recent = input.recentTimestamps.filter((stamp) => now - stamp < 1000);
  if (recent.length >= MAX_NOTIFY_PER_SECOND) {
    throw new Error('notify rate limit exceeded');
  }
  return [...recent, now];
}
