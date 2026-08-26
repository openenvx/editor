import { createToolbarBuilder } from '@openenvx/core';
import { describe, expect, it } from 'vitest';

import { HtmlToolbarContribution } from './html-toolbar-contribution';

describe('HtmlToolbarContribution', () => {
  it('gates preview toolbar with html.hidePreviewToolbar and zoom with html.hideZoomControls', () => {
    const builder = createToolbarBuilder();
    new HtmlToolbarContribution().contribute(builder, {} as never);

    const items = builder.build();
    const previewWhen = 'html.previewActive && !html.hidePreviewToolbar';
    const zoomWhen = `${previewWhen} && !html.hideZoomControls`;
    const zoomIds = [
      'html-toolbar-sep-1',
      'html-toolbar-zoom-out',
      'html-toolbar-zoom-in',
      'html-toolbar-sep-2',
      'html-toolbar-zoom',
    ];
    for (const id of zoomIds) {
      const item = items.find((entry) => entry.id === id);
      expect(item?.when, id).toBe(zoomWhen);
    }
    const mobile = items.find((entry) => entry.id === 'html-toolbar-mobile');
    expect(mobile?.when).toBe(previewWhen);
    const fluid = items.find((entry) => entry.id === 'html-toolbar-fluid');
    expect(fluid?.when).toBe(`${previewWhen} && !html.hideFluidPreset`);
  });
});
