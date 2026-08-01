import {
  PLUGIN_PARENT_SOURCE,
  type ParentToHostMessage,
} from '@xmazu/openenvxee-protocol';
import { describe, expect, it, vi } from 'vitest';

import { createPostMessagePluginPanelTransport } from './create-post-message-plugin-panel-transport';

describe('createPostMessagePluginPanelTransport', () => {
  it('ignores messages from disallowed origins', () => {
    const handler = vi.fn<(message: ParentToHostMessage) => void>();
    const transport = createPostMessagePluginPanelTransport({
      allowedOrigins: ['https://trusted.test'],
      source: globalThis,
    });
    transport.subscribe(handler);

    const message: ParentToHostMessage = {
      source: PLUGIN_PARENT_SOURCE,
      v: 1,
      type: 'render',
      payload: {
        surfaceId: 'p1',
        root: { type: 'Text', props: {}, children: ['hi'] },
      },
    };

    globalThis.dispatchEvent(
      new MessageEvent('message', {
        data: message,
        origin: 'https://evil.test',
      })
    );
    expect(handler).not.toHaveBeenCalled();

    globalThis.dispatchEvent(
      new MessageEvent('message', {
        data: message,
        origin: 'https://trusted.test',
      })
    );
    expect(handler).toHaveBeenCalledWith(message);
  });
});
