import {
  PLUGIN_PARENT_SOURCE,
  type HostToParentMessage,
  type ParentToHostMessage,
} from '@xmazu/openenvxee-plugin-protocol';

import type { PluginPanelTransport } from './plugin-panel-transport';

export interface PostMessagePluginPanelTransportOptions {
  /** Origins allowed to send parent→host messages (e.g. `https://embed.example.com`). */
  allowedOrigins: readonly string[];
  /**
   * Origin passed to `postMessage` for host→parent messages.
   * Defaults to the sole entry when `allowedOrigins` has length 1.
   */
  targetOrigin?: string;
  /** Window that receives host→parent messages (defaults to `window.parent`). */
  target?: Window;
  /** Window that listens for parent→host messages (defaults to `window`). */
  source?: Window;
}

function isParentToHostMessage(data: unknown): data is ParentToHostMessage {
  if (typeof data !== 'object' || data === null) {
    return false;
  }
  const record = data as Record<string, unknown>;
  return (
    record.source === PLUGIN_PARENT_SOURCE &&
    record.v === 1 &&
    typeof record.type === 'string' &&
    typeof record.payload === 'object' &&
    record.payload !== null
  );
}

/**
 * `postMessage` transport with origin allowlisting. Required for iframe embeds:
 * {@link PluginPanel} does not authenticate `source` beyond the protocol string.
 */
export function createPostMessagePluginPanelTransport(
  options: PostMessagePluginPanelTransportOptions
): PluginPanelTransport {
  const allowed = new Set(options.allowedOrigins);
  const targetOrigin =
    options.targetOrigin ??
    (options.allowedOrigins.length === 1
      ? options.allowedOrigins[0]
      : undefined);
  if (!targetOrigin) {
    throw new Error(
      'createPostMessagePluginPanelTransport: set targetOrigin when allowedOrigins has more than one entry'
    );
  }
  const target = options.target ?? globalThis.parent;
  const source = options.source ?? globalThis;

  return {
    send(message: HostToParentMessage): void {
      target.postMessage(message, targetOrigin);
    },
    subscribe(handler: (message: ParentToHostMessage) => void): () => void {
      const listener = (event: MessageEvent): void => {
        if (!allowed.has(event.origin)) {
          return;
        }
        if (!isParentToHostMessage(event.data)) {
          return;
        }
        handler(event.data);
      };
      source.addEventListener('message', listener);
      return () => source.removeEventListener('message', listener);
    },
  };
}
