import { describe, expect, it } from 'vitest';

import {
  HTML_BLOCKS_CONTAINER_ID,
  HTML_BLOCKS_PANEL_COMPONENT_ID,
  HTML_BLOCKS_VIEW_ID,
  HtmlBlocksContainer,
  HtmlBlocksView,
} from './html-blocks-sidebar';

describe('html blocks sidebar contributions', () => {
  it('wires container and view ids for the palette panel', () => {
    const container = new HtmlBlocksContainer();
    expect(container.id).toBe(HTML_BLOCKS_CONTAINER_ID);
    expect(container.title).toBe('Blocks');
    expect(container.icon).toBe('boxes');
    expect(container.sidebarBehavior).toBe('panel');
    expect(container.sidebarGroup).toBe(1);
    expect(container.sidebarOrder).toBe(12);

    const view = new HtmlBlocksView();
    expect(view.id).toBe(HTML_BLOCKS_VIEW_ID);
    expect(view.containerId).toBe(HTML_BLOCKS_CONTAINER_ID);
    expect(view.name).toBe('Blocks');
    expect(view.componentId).toBe(HTML_BLOCKS_PANEL_COMPONENT_ID);
    expect(view.collapsible).toBe(false);
    expect(view.viewOrder).toBe(0);
  });
});
