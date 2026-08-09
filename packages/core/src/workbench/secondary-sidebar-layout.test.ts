import { describe, expect, it } from 'vitest';

import {
  secondaryPanelContainers,
  shouldMountSecondarySidebar,
} from './secondary-sidebar-layout';
import { DEFAULT_WORKBENCH_LAYOUT } from './workbench-layout';
import type { ViewContainerDescriptor } from './workbench-state';

const panel: ViewContainerDescriptor = {
  id: 'workbench.inspector',
  location: 'secondary',
  sidebarBehavior: 'panel',
  sidebarGroup: 0,
  sidebarOrder: 0,
  title: 'Inspector',
  views: [],
};

describe('secondary-sidebar-layout', () => {
  it('filters secondary panel containers', () => {
    const sheet: ViewContainerDescriptor = {
      ...panel,
      id: 'html.blocks',
      sidebarBehavior: 'sheet',
    };
    expect(secondaryPanelContainers([panel, sheet])).toEqual([panel]);
  });

  it('shouldMountSecondarySidebar requires layout flag and a panel container', () => {
    expect(
      shouldMountSecondarySidebar(
        { ...DEFAULT_WORKBENCH_LAYOUT, secondarySidebar: false },
        [panel]
      )
    ).toBe(false);
    expect(
      shouldMountSecondarySidebar(DEFAULT_WORKBENCH_LAYOUT, [])
    ).toBe(false);
    expect(
      shouldMountSecondarySidebar(DEFAULT_WORKBENCH_LAYOUT, [panel])
    ).toBe(true);
  });
});
