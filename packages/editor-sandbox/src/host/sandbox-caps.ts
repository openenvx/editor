/** QuickJS soft memory ceiling. */
export const SANDBOX_MEMORY_LIMIT_BYTES = 8 * 1024 * 1024;
/** Wall-clock CPU budget per sync eval / pending-jobs burst. */
export const SANDBOX_CPU_LIMIT_MS = 5000;
/**
 * Sliding window for cumulative CPU across host-call resumes.
 * Async `await openenvx.*` loops cannot reset the budget forever.
 */
export const SANDBOX_CPU_WINDOW_MS = 10_000;
/** Max cumulative CPU inside one window before the isolate is killed. */
export const SANDBOX_CPU_BUDGET_PER_WINDOW_MS = 8000;
/** Wall-clock timeout for a Worker eval round-trip (includes async handlers). */
export const SANDBOX_EVAL_TIMEOUT_MS = 15_000;
/** Worker ready handshake timeout. */
export const SANDBOX_WORKER_READY_MS = 15_000;
/** Max in-flight host calls from one isolate (DoS / unbounded Map guard). */
export const MAX_PENDING_HOST_CALLS = 32;
/** Max verified artifact body size. */
export const MAX_ARTIFACT_BYTES = 2 * 1024 * 1024;
/** Artifact fetch abort timeout (covers headers + body). */
export const SANDBOX_ARTIFACT_FETCH_TIMEOUT_MS = 15_000;
/** Max pushed widget/plugin source characters. */
export const MAX_SOURCE_CHARS = 2 * 1024 * 1024;
/** Max concurrent QuickJS isolates (including in-flight starts). */
export const MAX_CONCURRENT_ISOLATES = 8;
/** Max `showUI` / grant `uiHtml` character length. */
export const MAX_SHOW_UI_HTML_CHARS = 512 * 1024;
/** Max JSON-encoded UI→isolate message size. */
export const MAX_UI_MESSAGE_JSON_CHARS = 64 * 1024;
/** Max JSON-encoded widget `data.values` blob from setSyncedState. */
export const MAX_WIDGET_VALUES_JSON_CHARS = 64 * 1024;
export const MAX_NOTIFY_MESSAGE_CHARS = 500;
export const MAX_NOTIFY_PER_SECOND = 10;
/** Per-grant clientStorage key cap (not global across extensions). */
export const MAX_CLIENT_STORAGE_KEYS_PER_GRANT = 64;
export const MAX_CLIENT_STORAGE_VALUE_CHARS = 32_768;
export const MAX_CONSOLE_PER_SECOND = 20;
/** Max JSON-encoded `console` args payload. */
export const MAX_CONSOLE_ARGS_JSON_CHARS = 8 * 1024;

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

/** Sliding 1s rate limit shared by notify / console. */
export function assertRateLimit(input: {
  recentTimestamps: number[];
  maxPerSecond: number;
  label: string;
  now?: number;
}): number[] {
  const now = input.now ?? Date.now();
  const recent = input.recentTimestamps.filter((stamp) => now - stamp < 1000);
  if (recent.length >= input.maxPerSecond) {
    throw new Error(`${input.label} rate limit exceeded`);
  }
  return [...recent, now];
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
  return assertRateLimit({
    recentTimestamps: input.recentTimestamps,
    maxPerSecond: MAX_NOTIFY_PER_SECOND,
    label: 'notify',
    now: input.now,
  });
}

/** Size + sliding 1s rate limit for isolate `console.*` forwarding. */
export function assertConsolePolicy(input: {
  args: unknown[];
  recentTimestamps: number[];
  now?: number;
}): number[] {
  let encoded: string;
  try {
    encoded = JSON.stringify(input.args);
  } catch {
    throw new Error('console args are not JSON-serializable');
  }
  if (encoded.length > MAX_CONSOLE_ARGS_JSON_CHARS) {
    throw new Error('console args too large');
  }
  return assertRateLimit({
    recentTimestamps: input.recentTimestamps,
    maxPerSecond: MAX_CONSOLE_PER_SECOND,
    label: 'console',
    now: input.now,
  });
}
