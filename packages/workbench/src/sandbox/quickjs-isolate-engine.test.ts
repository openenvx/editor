import { describe, expect, it } from 'vitest';
import { SANDBOX_BRIDGE_SOURCE } from '@xmazu/openenvxee-plugin-protocol';

import { createQuickJsEngine } from './quickjs-isolate-engine';
import { createQuickJsIsolate } from './quickjs-runtime';

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

describe('QuickJS isolate', () => {
  it('runs extension code in-process only when preferInProcess is set', async () => {
    const isolate = await createQuickJsIsolate({
      preferInProcess: true,
      onHostCall: async (request) => ({
        source: SANDBOX_BRIDGE_SOURCE,
        v: 1,
        id: request.id,
        ok: true,
        result: { pageId: 'page-1' },
      }),
    });

    await isolate.evalModule(`
      globalThis.__result = null;
      openenvx.getPageId().then((pageId) => {
        globalThis.__result = pageId;
      });
    `);

    await delay(50);
    isolate.dispose();
  });

  it('refuses missing worker without preferInProcess', async () => {
    await expect(
      createQuickJsIsolate({
        workerUrl: 'http://127.0.0.1:9/openenvx-missing-sandbox-worker.js',
        onHostCall: async (request) => ({
          source: SANDBOX_BRIDGE_SOURCE,
          v: 1,
          id: request.id,
          ok: true,
          result: null,
        }),
      })
    ).rejects.toThrow(/Sandbox (requires a Web Worker|worker)|ModuleNotFound|BuildMessage/);
  }, 20_000);

  it('engine bootstrap exposes openenvx API', async () => {
    const calls: string[] = [];
    const engine = await createQuickJsEngine({
      onHostCall: async (request) => {
        calls.push(request.method);
        return {
          source: SANDBOX_BRIDGE_SOURCE,
          v: 1,
          id: request.id,
          ok: true,
          result: null,
        };
      },
    });
    await engine.evalModule(`openenvx.notify('hi');`);
    await delay(50);
    expect(calls).toContain('notify');
    engine.dispose();
  });

  it('interrupts tight loops with CPU limit', async () => {
    const engine = await createQuickJsEngine({
      cpuLimitMs: 50,
      onHostCall: async (request) => ({
        source: SANDBOX_BRIDGE_SOURCE,
        v: 1,
        id: request.id,
        ok: true,
        result: null,
      }),
    });
    await expect(
      engine.evalModule('while (true) {}')
    ).rejects.toThrow(/Sandbox CPU limit exceeded/);
    engine.dispose();
  }, 10_000);

  it('delivers UI messages to openenvx.ui.onmessage', async () => {
    const engine = await createQuickJsEngine({
      onHostCall: async (request) => ({
        source: SANDBOX_BRIDGE_SOURCE,
        v: 1,
        id: request.id,
        ok: true,
        result: null,
      }),
    });
    await engine.evalModule(`
      globalThis.__uiMsgs = [];
      openenvx.ui.onmessage = function (msg) {
        globalThis.__uiMsgs.push(msg);
      };
    `);
    engine.deliverUiMessage({ type: 'ping', n: 1 });
    await engine.evalModule(`
      if (!globalThis.__uiMsgs || globalThis.__uiMsgs.length !== 1) {
        throw new Error('ui message not delivered');
      }
      if (globalThis.__uiMsgs[0].type !== 'ping' || globalThis.__uiMsgs[0].n !== 1) {
        throw new Error('ui message payload mismatch');
      }
    `);
    engine.dispose();
  });
});
