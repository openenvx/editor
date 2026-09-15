import {
  createContextKeyService,
  SimpleServiceContribution,
} from '@openenvx/core';
import { beforeEach, describe, expect, it } from 'vitest';

import { HtmlPreviewChromeServiceImpl } from './html-preview-chrome-service';
import {
  registerHtmlPreviewChrome,
  resetHtmlPreviewChromeOptionsForTests,
} from './register-html-preview-chrome';

describe('registerHtmlPreviewChrome', () => {
  beforeEach(() => {
    resetHtmlPreviewChromeOptionsForTests();
  });

  it('sets hide context keys before early return', () => {
    const contextKeys = createContextKeyService();
    const commands = new Map<string, unknown>([
      ['html.setDevicePreset', {}],
    ]);

    registerHtmlPreviewChrome(
      {
        commands: { get: (id: string) => commands.get(id) },
        contextKeys,
        register: () => {},
        registerWorkbench: () => {},
      } as never,
      { hideFluidPreset: true, hidePreviewToolbar: true, hideZoomControls: true }
    );

    expect(contextKeys.get('html.hideFluidPreset')).toBe(true);
    expect(contextKeys.get('html.hidePreviewToolbar')).toBe(true);
    expect(contextKeys.get('html.hideZoomControls')).toBe(true);
  });

  it('merges options from multiple activations before first registration', () => {
    const contextKeys = createContextKeyService();
    let capturedPreset: string | undefined;
    const ctx = {
      commands: { get: () => {} },
      contextKeys,
      register: (...contributions: unknown[]) => {
        const contribution = contributions[0] as SimpleServiceContribution<unknown>;
        const service = contribution.getFactory()(
          {} as never
        ) as HtmlPreviewChromeServiceImpl;
        capturedPreset = service.getState().preset;
      },
      registerWorkbench: () => {},
    } as never;

    registerHtmlPreviewChrome(ctx, { initialPreset: 'mobile' });
    registerHtmlPreviewChrome(ctx, { hideFluidPreset: true });

    expect(contextKeys.get('html.hideFluidPreset')).toBe(true);
    expect(capturedPreset).toBe('mobile');
  });
});
