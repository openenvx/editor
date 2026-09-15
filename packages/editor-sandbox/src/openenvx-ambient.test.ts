import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

import type { SandboxHostMethod } from './protocol';
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

const packageRoot = path.resolve(import.meta.dirname, '..');
const ambientDts = path.join(packageRoot, 'dist/openenvx.d.ts');

function readAmbientDts(): string {
  if (!existsSync(ambientDts)) {
    throw new Error(
      `Missing ${ambientDts}. Run build for @openenvx/editor-sandbox first (turbo test depends on ^build).`
    );
  }
  return readFileSync(ambientDts, 'utf-8');
}

describe('openenvx ambient vs SandboxHostMethod', () => {
  it('documents every host method name in dist/openenvx.d.ts', () => {
    const ambient = readAmbientDts();
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
    const ambient = readAmbientDts();
    const bootstrap = readFileSync(
      path.join(import.meta.dirname, 'host/sandbox-bootstrap-source.ts'),
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
