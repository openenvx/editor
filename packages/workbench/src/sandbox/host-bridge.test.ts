import { describe, expect, it, vi } from 'vitest';
import type { SandboxExtensionGrant } from '@xmazu/openenvxee-plugin-protocol';
import { SANDBOX_BRIDGE_SOURCE } from '@xmazu/openenvxee-plugin-protocol';

import { createSandboxHostBridge } from './host-bridge';

const grant: SandboxExtensionGrant = {
  id: 'demo',
  kind: 'plugin',
  artifactUrl: 'https://example.com/a.js',
  contentHash: 'a'.repeat(64),
  capabilities: ['document:read', 'document:write', 'ui:show'],
  allowedCommands: ['canvas.insertRect'],
};

describe('createSandboxHostBridge', () => {
  it('executes allowlisted commands and denies others', async () => {
    const executeCommand = vi.fn(async () => ({ executed: true }));
    const bridge = createSandboxHostBridge({
      grant,
      permission: 'edit',
      handlers: {
        getSelection: () => ({}),
        getPageId: () => 'page',
        executeCommand,
        showUI: () => {},
        resizeUI: () => {},
        closeUI: () => {},
        notify: () => {},
        closePlugin: () => {},
        getClientStorage: () => null,
        setClientStorage: () => {},
        getSyncedState: () => null,
        setSyncedState: () => {},
        resizeWidget: () => {},
      },
    });

    const ok = await bridge.handle({
      source: SANDBOX_BRIDGE_SOURCE,
      v: 1,
      id: '1',
      method: 'executeCommand',
      params: { commandId: 'canvas.insertRect', args: null },
    });
    expect(ok.ok).toBe(true);
    expect(executeCommand).toHaveBeenCalled();

    const denied = await bridge.handle({
      source: SANDBOX_BRIDGE_SOURCE,
      v: 1,
      id: '2',
      method: 'executeCommand',
      params: { commandId: 'canvas.delete', args: null },
    });
    expect(denied.ok).toBe(false);
    expect(denied.error).toMatch(/allowlisted/);
  });
});
