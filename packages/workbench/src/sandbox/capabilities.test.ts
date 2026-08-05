import { describe, expect, it } from 'vitest';

import {
  assertJsonSerializable,
  assertMethodAllowed,
  freezeGrant,
  normalizeCapabilities,
} from './capabilities';
import type { SandboxExtensionGrant } from '@xmazu/openenvxee-protocol';

const grant: SandboxExtensionGrant = {
  id: 'demo',
  kind: 'plugin',
  artifactUrl: 'https://example.com/a.js',
  contentHash: 'a'.repeat(64),
  capabilities: ['document:read', 'document:write', 'ui:show'],
  allowedCommands: ['canvas.insertRect'],
};

describe('sandbox capabilities', () => {
  it('drops unknown capability ids', () => {
    expect(
      normalizeCapabilities(['document:read', 'nope', 'document:read'])
    ).toEqual(['document:read']);
  });

  it('freezes grant snapshots and rejects unknown kinds', () => {
    const mutable: SandboxExtensionGrant = {
      ...grant,
      capabilities: ['document:read', 'nope', 'ui:show'],
      allowedCommands: ['canvas.insertRect'],
    };
    const frozen = freezeGrant(mutable);
    expect(frozen.capabilities).toEqual(['document:read', 'ui:show']);
    expect(() => {
      (frozen.capabilities as string[]).push('document:write');
    }).toThrow();
    mutable.allowedCommands.push('evil.command');
    expect(frozen.allowedCommands).toEqual(['canvas.insertRect']);
    expect(() =>
      freezeGrant({ ...grant, kind: 'evil' as SandboxExtensionGrant['kind'] })
    ).toThrow(/Unknown sandbox grant kind/);
    expect(() =>
      freezeGrant({ ...grant, contentHash: 'not-a-hash' })
    ).toThrow(/Invalid contentHash/);
    expect(() =>
      freezeGrant({ ...grant, artifactUrl: 'http://evil.example.com/a.js' })
    ).toThrow(/protocol not allowed/);
  });

  it('accepts pushed source without artifactUrl', () => {
    const frozen = freezeGrant({
      id: 'wm.guest-tables',
      kind: 'widget',
      source: 'openenvx.widget._registry = Object.create(null);',
      capabilities: [],
      allowedCommands: [],
    });
    expect(frozen.source).toBeTruthy();
    expect(frozen.capabilities).toEqual([
      'widget:render',
      'widget:values',
    ]);
    expect(frozen.artifactUrl).toBeUndefined();
  });

  it('rejects grants with neither source nor artifact', () => {
    expect(() =>
      freezeGrant({
        id: 'empty',
        kind: 'widget',
        capabilities: [],
        allowedCommands: [],
      })
    ).toThrow(/source or artifactUrl/);
  });

  it('denies methods without capability', () => {
    expect(() =>
      assertMethodAllowed({
        grant: { ...grant, capabilities: ['document:read'] },
        method: 'showUI',
        permission: 'edit',
      })
    ).toThrow(/Capability denied: ui:show/);
  });

  it('denies non-allowlisted commands', () => {
    expect(() =>
      assertMethodAllowed({
        grant,
        method: 'executeCommand',
        permission: 'edit',
        commandId: 'canvas.delete',
      })
    ).toThrow(/Command not allowlisted/);
  });

  it('denies writes on read sessions', () => {
    expect(() =>
      assertMethodAllowed({
        grant,
        method: 'executeCommand',
        permission: 'read',
        commandId: 'canvas.insertRect',
      })
    ).toThrow(/read-only/);
  });

  it('denies resizeWidget and clientStorage writes on read sessions', () => {
    expect(() =>
      assertMethodAllowed({
        grant: {
          ...grant,
          kind: 'widget',
          capabilities: ['widget:values'],
          allowedCommands: [],
        },
        method: 'resizeWidget',
        permission: 'read',
      })
    ).toThrow(/read-only/);

    expect(() =>
      assertMethodAllowed({
        grant: {
          ...grant,
          capabilities: ['storage:client'],
        },
        method: 'setClientStorage',
        permission: 'read',
      })
    ).toThrow(/read-only/);
  });

  it('denies widget-only methods on plugins', () => {
    expect(() =>
      assertMethodAllowed({
        grant,
        method: 'getSyncedState',
        permission: 'edit',
      })
    ).toThrow(/widget-only/);
  });

  it('allows showUI on widgets when ui:show is granted (optional iframe)', () => {
    expect(() =>
      assertMethodAllowed({
        grant: {
          ...grant,
          kind: 'widget',
          capabilities: ['ui:show', 'widget:values'],
          allowedCommands: [],
        },
        method: 'showUI',
        permission: 'edit',
      })
    ).not.toThrow();
  });

  it('gates postToUI behind ui:show', () => {
    expect(() =>
      assertMethodAllowed({
        grant: { ...grant, capabilities: ['document:read'] },
        method: 'postToUI',
        permission: 'edit',
      })
    ).toThrow(/Capability denied: ui:show/);
    expect(() =>
      assertMethodAllowed({
        grant,
        method: 'postToUI',
        permission: 'edit',
      })
    ).not.toThrow();
  });

  it('denies clientStorage on widgets', () => {
    expect(() =>
      assertMethodAllowed({
        grant: {
          ...grant,
          kind: 'widget',
          capabilities: ['storage:client', 'widget:values'],
          allowedCommands: [],
        },
        method: 'getClientStorage',
        permission: 'edit',
      })
    ).toThrow(/plugin-only/);
  });

  it('allows synced state on widgets with capability', () => {
    expect(() =>
      assertMethodAllowed({
        grant: {
          ...grant,
          kind: 'widget',
          capabilities: ['widget:values'],
          allowedCommands: [],
        },
        method: 'setSyncedState',
        permission: 'edit',
      })
    ).not.toThrow();
  });

  it('rejects non-serializable payloads', () => {
    expect(() => assertJsonSerializable({ fn: () => 1 })).toThrow(
      /not JSON-serializable/
    );
    expect(() => assertJsonSerializable({ a: 1 })).not.toThrow();
  });
});
