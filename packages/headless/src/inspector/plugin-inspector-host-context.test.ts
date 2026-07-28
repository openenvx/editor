import { describe, expect, it } from 'vitest';

import {
  createPluginInspectorHostContext,
  decodePluginHandlerCommand,
  encodePluginHandlerCommand,
} from './plugin-inspector-host-context';

describe('createPluginInspectorHostContext', () => {
  it('reads and writes plugin.<panelId>.<key> paths', () => {
    const writes: { path: string; value: unknown }[] = [];
    const values: Record<string, unknown> = { fill: '#f00' };
    const host = createPluginInspectorHostContext({
      panelId: 'assets',
      values,
      onWrite: (path, value) => {
        writes.push({ path, value });
      },
    });

    expect(host.readPath('plugin.assets.fill')).toBe('#f00');
    host.writePath('plugin.assets.fill', '#0f0');
    expect(values.fill).toBe('#0f0');
    expect(writes).toEqual([{ path: 'plugin.assets.fill', value: '#0f0' }]);
  });

  it('encodes and decodes handler command ids', () => {
    expect(encodePluginHandlerCommand('h1')).toBe('plugin.handler:h1');
    expect(decodePluginHandlerCommand('plugin.handler:h1')).toBe('h1');
    expect(decodePluginHandlerCommand('scene.undo')).toBeNull();
  });
});
