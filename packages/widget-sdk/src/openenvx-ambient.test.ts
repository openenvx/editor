import { readFileSync } from 'node:fs';
import path from 'node:path';

import type { SandboxHostMethod } from '@xmazu/openenvxee-protocol';
import { describe, expect, it } from 'vitest';

const HOST_METHODS: SandboxHostMethod[] = [
  'getSelection',
  'getPageId',
  'executeCommand',
  'showUI',
  'resizeUI',
  'closeUI',
  'postToUI',
  'notify',
  'closePlugin',
  'getClientStorage',
  'setClientStorage',
  'getSyncedState',
  'setSyncedState',
  'resizeWidget',
];

const WIDGET_API = [
  'register',
  'useSyncedState',
  'applyProps',
  'rendering',
  'WidgetFaceRenderResult',
];

describe('openenvx ambient vs SandboxHostMethod', () => {
  it('documents every host method name in openenvx.d.ts', () => {
    const dir = import.meta.dirname;
    const ambient = readFileSync(path.join(dir, 'openenvx.d.ts'), 'utf-8');
    for (const method of HOST_METHODS) {
      if (method === 'postToUI') {
        // Exposed as ui.postMessage → call('postToUI')
        expect(ambient).toContain('postMessage');
        continue;
      }
      expect(ambient).toContain(method);
    }
  });

  it('documents widget register/render contract symbols', () => {
    const dir = import.meta.dirname;
    const ambient = readFileSync(path.join(dir, 'openenvx.d.ts'), 'utf-8');
    const bootstrap = readFileSync(
      path.resolve(
        dir,
        '../../workbench/src/sandbox/quickjs-isolate-engine.ts'
      ),
      'utf-8'
    );
    for (const symbol of WIDGET_API) {
      expect(ambient).toContain(symbol);
    }
    expect(bootstrap).toContain('widget.register');
    expect(bootstrap).toContain('_handlersByLayer');
    expect(bootstrap).toContain('useSyncedState');
    expect(bootstrap).toContain('_endRenderPass');
    expect(bootstrap).toContain('_denyDuringFaceRender');
  });
});
