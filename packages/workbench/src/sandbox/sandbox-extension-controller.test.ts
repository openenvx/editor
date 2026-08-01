import { describe, expect, it } from 'vitest';
import type { SandboxHostSurface } from '@openenvx/headless';
import type { SandboxExtensionGrant } from '@xmazu/openenvxee-protocol';

import { sha256Hex } from './fetch-artifact';
import {
  assertNotifyPolicy,
  MAX_CONCURRENT_ISOLATES,
  MAX_NOTIFY_MESSAGE_CHARS,
  MAX_NOTIFY_PER_SECOND,
  MAX_UI_MESSAGE_JSON_CHARS,
} from './sandbox-caps';
import { assertUiMessagePolicy } from './capabilities';
import { SandboxExtensionController } from './sandbox-extension-controller';

function mockHost(): SandboxHostSurface {
  return {
    getSelection: () => ({
      activePageId: 'page-1',
      selectedLayerIds: [],
      primaryLayerId: null,
    }),
    getScene: () =>
      ({
        version: 1,
        pages: [],
        assets: {},
      }) as ReturnType<SandboxHostSurface['getScene']>,
    apply: () => {},
    selectLayers: () => {},
    onDidChangeScene: () => () => {},
    onDidChangeSelection: () => () => {},
    executeCommand: async () => ({ executed: true }),
    registerCommand: () => ({ dispose: () => {} }),
    registerWorkbenchContributions: () => ({ dispose: () => {} }),
  };
}

async function grantForSource(
  id: string,
  source: string
): Promise<SandboxExtensionGrant> {
  const bytes = new TextEncoder().encode(source);
  const contentHash = await sha256Hex(bytes.buffer);
  return {
    id,
    kind: 'plugin',
    artifactUrl: `https://example.com/${id}.js`,
    contentHash,
    capabilities: ['ui:show'],
    allowedCommands: [],
  };
}

describe('SandboxExtensionController', () => {
  it('rejects starting more than MAX_CONCURRENT_ISOLATES', async () => {
    const grants: SandboxExtensionGrant[] = [];
    for (let i = 0; i < MAX_CONCURRENT_ISOLATES + 1; i += 1) {
      grants.push(await grantForSource(`ext-${i}`, `globalThis.n = ${i};`));
    }
    const controller = new SandboxExtensionController({
      grants,
      permission: 'edit',
      host: mockHost(),
      preferInProcess: true,
      fetchImpl: async (url) => {
        const id = String(url).match(/ext-\d+/)?.[0] ?? 'ext-0';
        const index = Number(id.replace('ext-', ''));
        return new Response(`globalThis.n = ${index};`, { status: 200 });
      },
    });

    for (let i = 0; i < MAX_CONCURRENT_ISOLATES; i += 1) {
      await controller.start(grants[i]!);
    }
    await expect(
      controller.start(grants[MAX_CONCURRENT_ISOLATES]!)
    ).rejects.toThrow(/isolate limit exceeded/);
    controller.dispose();
  }, 60_000);

  it('enforces isolate limit under parallel start', async () => {
    const grants: SandboxExtensionGrant[] = [];
    for (let i = 0; i < MAX_CONCURRENT_ISOLATES + 2; i += 1) {
      grants.push(await grantForSource(`par-${i}`, `globalThis.n = ${i};`));
    }

    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    let startedFetches = 0;

    const controller = new SandboxExtensionController({
      grants,
      permission: 'edit',
      host: mockHost(),
      preferInProcess: true,
      fetchImpl: async (url) => {
        startedFetches += 1;
        await gate;
        const id = String(url).match(/par-\d+/)?.[0] ?? 'par-0';
        const index = Number(id.replace('par-', ''));
        return new Response(`globalThis.n = ${index};`, { status: 200 });
      },
    });

    const pending = grants.map((grant) => controller.start(grant));
    const settled = Promise.allSettled(pending);
    await new Promise<void>((resolve) => {
      setTimeout(() => {
        resolve();
      }, 20);
    });
    expect(startedFetches).toBe(MAX_CONCURRENT_ISOLATES);
    release();
    const results = await settled;
    const fulfilled = results.filter((result) => result.status === 'fulfilled');
    const rejected = results.filter((result) => result.status === 'rejected');
    expect(fulfilled.length).toBe(MAX_CONCURRENT_ISOLATES);
    expect(rejected.length).toBe(2);
    for (const result of rejected) {
      expect(result.status).toBe('rejected');
      if (result.status === 'rejected') {
        expect(String(result.reason)).toMatch(/isolate limit exceeded/);
      }
    }
    controller.dispose();
  }, 60_000);

  it('rejects unknown grants after constructor ingest', async () => {
    const grant = await grantForSource('known', 'globalThis.ok = 1;');
    const unknown = await grantForSource('unknown', 'globalThis.ok = 2;');
    const controller = new SandboxExtensionController({
      grants: [grant],
      permission: 'edit',
      host: mockHost(),
      preferInProcess: true,
      fetchImpl: async () => new Response('globalThis.ok = 1;', { status: 200 }),
    });
    await expect(controller.start(unknown)).rejects.toThrow(
      /Unknown sandbox grant/
    );
    controller.dispose();
  });

  it('delivers UI messages without throwing when isolate is running', async () => {
    const grant = await grantForSource(
      'ui-demo',
      `
      globalThis.__uiMsgs = [];
      openenvx.ui.onmessage = function (msg) {
        globalThis.__uiMsgs.push(msg);
      };
    `
    );
    const controller = new SandboxExtensionController({
      grants: [grant],
      permission: 'edit',
      host: mockHost(),
      preferInProcess: true,
      fetchImpl: async () =>
        new Response(
          `
      globalThis.__uiMsgs = [];
      openenvx.ui.onmessage = function (msg) {
        globalThis.__uiMsgs.push(msg);
      };
    `,
          { status: 200 }
        ),
    });
    await controller.start(grant);
    expect(() =>
      controller.deliverUiMessage(grant.id, undefined, { type: 'ping' })
    ).not.toThrow();
    controller.dispose();
  }, 30_000);

  it('drops oversize UI messages at the controller boundary', async () => {
    const source = `
      globalThis.__uiMsgs = [];
      openenvx.ui.onmessage = function (msg) {
        globalThis.__uiMsgs.push(msg);
      };
    `;
    const grant = await grantForSource('ui-size', source);
    const controller = new SandboxExtensionController({
      grants: [grant],
      permission: 'edit',
      host: mockHost(),
      preferInProcess: true,
      fetchImpl: async () => new Response(source, { status: 200 }),
    });
    await controller.start(grant);
    expect(() =>
      assertUiMessagePolicy('x'.repeat(MAX_UI_MESSAGE_JSON_CHARS + 1))
    ).toThrow(/UI message too large/);
    expect(() =>
      controller.deliverUiMessage(
        grant.id,
        undefined,
        'x'.repeat(MAX_UI_MESSAGE_JSON_CHARS + 1)
      )
    ).not.toThrow();
    controller.dispose();
  }, 30_000);

  it('enforces notify length and rate limits', () => {
    expect(() =>
      assertNotifyPolicy({
        message: 'x'.repeat(MAX_NOTIFY_MESSAGE_CHARS + 1),
        recentTimestamps: [],
      })
    ).toThrow(/notify message too long/);

    const now = 1_000_000;
    let recent: number[] = [];
    for (let i = 0; i < MAX_NOTIFY_PER_SECOND; i += 1) {
      recent = assertNotifyPolicy({
        message: 'ok',
        recentTimestamps: recent,
        now,
      });
    }
    expect(() =>
      assertNotifyPolicy({
        message: 'ok',
        recentTimestamps: recent,
        now,
      })
    ).toThrow(/notify rate limit exceeded/);
  });

  it('emits toast notify events when isolate calls notify', async () => {
    const grant = await grantForSource('notify-ext', `openenvx.notify('hello toast');`);
    const controller = new SandboxExtensionController({
      grants: [grant],
      permission: 'edit',
      host: mockHost(),
      preferInProcess: true,
      fetchImpl: async () =>
        new Response(`openenvx.notify('hello toast');`, { status: 200 }),
    });
    const seen: string[] = [];
    controller.subscribeNotify((event) => {
      seen.push(event.message);
    });
    await controller.start(grant);
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 50);
    });
    expect(seen).toContain('hello toast');
    controller.dispose();
  }, 30_000);

  it('emits ui outbound events for postToUI without holding a Window', async () => {
    const source = `
      openenvx.showUI('<p>x</p>', { width: 100, height: 80 });
      openenvx.ui.postMessage({ type: 'from-isolate' });
    `;
    const grant = await grantForSource('outbound', source);
    const controller = new SandboxExtensionController({
      grants: [grant],
      permission: 'edit',
      host: mockHost(),
      preferInProcess: true,
      fetchImpl: async () => new Response(source, { status: 200 }),
    });
    const outbound: unknown[] = [];
    controller.subscribeUiOutbound((message) => {
      outbound.push(message);
    });
    await controller.start(grant);
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 50);
    });
    expect(outbound).toContainEqual({ type: 'from-isolate' });
    controller.dispose();
  }, 30_000);

  it('closeUi matches layerId so widget instances do not clobber each other', async () => {
    const source = `openenvx.showUI('<p>x</p>');`;
    const grant = await grantForSource('layer-ui', source);
    const controller = new SandboxExtensionController({
      grants: [grant],
      permission: 'edit',
      host: mockHost(),
      preferInProcess: true,
      fetchImpl: async () => new Response(source, { status: 200 }),
    });
    await controller.start(grant, 'layer-a');
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 50);
    });
    expect(controller.getUiState()?.layerId).toBe('layer-a');
    controller.closeUi(grant.id, 'layer-b');
    expect(controller.getUiState()?.layerId).toBe('layer-a');
    controller.closeUi(grant.id, 'layer-a');
    expect(controller.getUiState()).toBeNull();
    controller.dispose();
  }, 30_000);

  it('omits selection from ui context without document:read', async () => {
    const grant = await grantForSource('ctx-gate', 'globalThis.ok = 1;');
    const controller = new SandboxExtensionController({
      grants: [{ ...grant, capabilities: ['ui:show'] }],
      permission: 'edit',
      host: mockHost(),
      preferInProcess: true,
      fetchImpl: async () => new Response('globalThis.ok = 1;', { status: 200 }),
    });
    expect(controller.getUiContextSelection(grant.id)).toBeNull();
    controller.dispose();
  });

  it('returns selection for ui context when document:read is granted', async () => {
    const grant = await grantForSource('ctx-read', 'globalThis.ok = 1;');
    const controller = new SandboxExtensionController({
      grants: [{ ...grant, capabilities: ['ui:show', 'document:read'] }],
      permission: 'edit',
      host: mockHost(),
      preferInProcess: true,
      fetchImpl: async () => new Response('globalThis.ok = 1;', { status: 200 }),
    });
    expect(controller.getUiContextSelection(grant.id)).toEqual({
      activePageId: 'page-1',
      selectedLayerIds: [],
      primaryLayerId: null,
    });
    controller.dispose();
  });

  it('refuses renderWidgetFace without widget:render', async () => {
    const source = `
      openenvx.widget.register({
        id: 'wm.box',
        render: function () { return { tree: { type: 'Rect', props: {}, children: [] }, handlers: {} }; }
      });
    `;
    const grant: SandboxExtensionGrant = {
      id: 'wm.box',
      kind: 'widget',
      source,
      capabilities: ['widget:values'],
      allowedCommands: [],
    };
    const controller = new SandboxExtensionController({
      grants: [grant],
      permission: 'edit',
      host: mockHost(),
      preferInProcess: true,
    });
    await controller.start(grant);
    const tree = await controller.renderWidgetFace('wm.box', 'layer-1', {});
    expect(tree).toBeNull();
    controller.dispose();
  }, 30_000);

  it('scopes synced values to the active widget layer, not the first start id', async () => {
    const source = `
      openenvx.widget.register({
        id: 'wm.vals',
        render: function (values) {
          if (openenvx.widget.applyProps) {
            openenvx.widget.applyProps({ n: (values.n || 0) + 100 });
          }
          return { tree: { type: 'Text', props: { value: 'ok' }, children: [] }, handlers: {} };
        }
      });
    `;
    const grant: SandboxExtensionGrant = {
      id: 'wm.vals',
      kind: 'widget',
      source,
      capabilities: ['widget:render', 'widget:values'],
      allowedCommands: [],
    };
    const valuesByLayer = new Map<string, unknown>([
      ['layer-a', { n: 1 }],
      ['layer-b', { n: 2 }],
    ]);
    const writes: { layerId: string; value: unknown }[] = [];
    const controller = new SandboxExtensionController({
      grants: [grant],
      permission: 'edit',
      host: mockHost(),
      preferInProcess: true,
      getWidgetValues: (layerId) => valuesByLayer.get(layerId) ?? null,
      setWidgetValues: (layerId, value) => {
        writes.push({ layerId, value });
        valuesByLayer.set(layerId, value);
      },
    });
    // First start historically baked layer-a into handlers; values must still
    // target only the active render layer.
    await controller.start(grant, 'layer-a');
    await controller.renderWidgetFace('wm.vals', 'layer-b', { n: 2 });
    expect(writes).toEqual([{ layerId: 'layer-b', value: { n: 102 } }]);
    expect(valuesByLayer.get('layer-a')).toEqual({ n: 1 });
    controller.dispose();
  }, 30_000);

  it('denies executeCommand during face render', async () => {
    const source = `
      openenvx.widget.register({
        id: 'wm.pure',
        render: function () {
          try {
            openenvx.executeCommand('canvas.insertRect', {});
            return { tree: { type: 'Text', props: { value: 'bad' }, children: [] }, handlers: {} };
          } catch (error) {
            return {
              tree: { type: 'Text', props: { value: String(error && error.message || error) }, children: [] },
              handlers: {}
            };
          }
        }
      });
    `;
    const grant: SandboxExtensionGrant = {
      id: 'wm.pure',
      kind: 'widget',
      source,
      capabilities: ['widget:render', 'document:write'],
      allowedCommands: ['canvas.insertRect'],
    };
    const controller = new SandboxExtensionController({
      grants: [grant],
      permission: 'edit',
      host: mockHost(),
      preferInProcess: true,
    });
    await controller.start(grant);
    const tree = await controller.renderWidgetFace('wm.pure', 'layer-1', {});
    expect(tree).toMatchObject({
      type: 'Text',
      props: {
        value: expect.stringContaining('not allowed during widget face render'),
      },
    });
    controller.dispose();
  }, 30_000);
});
