import { createToolbarBuilder } from '@openenvx/headless';
import { describe, expect, it } from 'vitest';

import { HtmlToolbarContribution } from './html-toolbar-contribution';

describe('HtmlToolbarContribution', () => {
  it('gates zoom controls with html.hideZoomControls', () => {
    const builder = createToolbarBuilder();
    new HtmlToolbarContribution().contribute(builder, {} as never);

    const items = builder.build();
    const zoomWhen = 'html.previewActive && !html.hideZoomControls';
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
    const fluid = items.find((entry) => entry.id === 'html-toolbar-fluid');
    expect(fluid?.when).toBe(
      "html.previewActive && !html.hideFluidPreset"
    );
  });
});
