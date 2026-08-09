import { describe, expect, it, vi } from 'vitest';

import {
  ViewContainerContribution,
  ViewContribution,
} from '../contributions/view-contribution';
import { WorkbenchController } from './workbench-controller';
import { WorkbenchPlugin } from './workbench-plugin';
import type { WorkbenchPluginContext } from './workbench-plugin-context';
import type { WorkbenchLayoutStore } from './workbench-layout-store';

class TestSidebarContainer extends ViewContainerContribution {
  readonly id = 'test.sidebar';
  readonly title = 'Sidebar';
  readonly sidebarBehavior = 'panel' as const;
  readonly defaultLocation = 'primary' as const;
}

class TestSidebarView extends ViewContribution {
  readonly id = 'test.sidebar.view';
  readonly containerId = 'test.sidebar';
  readonly name = 'Sidebar';
}

class TestInspectorContainer extends ViewContainerContribution {
  readonly id = 'test.inspector';
  readonly title = 'Inspector';
  readonly sidebarBehavior = 'panel' as const;
  readonly defaultLocation = 'secondary' as const;
}

class TestLayoutPlugin extends WorkbenchPlugin {
  readonly id = 'test.layout';

  activateWorkbench(ctx: WorkbenchPluginContext): void {
    ctx.registerWorkbench(
      new TestSidebarContainer(),
      new TestSidebarView(),
      new TestInspectorContainer()
    );
  }
}

describe('WorkbenchLayoutStore', () => {
  it('restores visibility and container locations on start', async () => {
    const store: WorkbenchLayoutStore = {
      load: vi.fn(() => ({
        locations: { 'test.sidebar': 'secondary' },
        visibility: {
          activityBar: false,
          primarySidebar: true,
          secondarySidebar: true,
        },
      })),
      save: vi.fn(),
    };

    const controller = new WorkbenchController({
      layoutStore: store,
      plugins: [new TestLayoutPlugin()],
    });
    await controller.start();

    const state = controller.api.getSnapshot();
    expect(store.load).toHaveBeenCalled();
    expect(state.layout.activityBar).toBe(false);
    expect(state.viewLocations['test.sidebar']).toBe('secondary');
    const sidebar = state.viewContainers.find((c) => c.id === 'test.sidebar');
    expect(sidebar?.location).toBe('secondary');

    controller.dispose();
  });

  it('persists layout when toggling visibility', async () => {
    const save = vi.fn();
    const store: WorkbenchLayoutStore = {
      load: vi.fn(() => null),
      save,
    };

    const controller = new WorkbenchController({
      layoutStore: store,
      plugins: [new TestLayoutPlugin()],
    });
    await controller.start();
    save.mockClear();

    controller.toggleSecondarySidebar();
    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({
        visibility: expect.objectContaining({ secondarySidebar: false }),
      })
    );

    controller.dispose();
  });

  it('restores active container per location from snapshot', async () => {
    const store: WorkbenchLayoutStore = {
      load: vi.fn(() => ({
        locations: {
          'test.sidebar': 'primary',
          'test.inspector': 'secondary',
        },
        activeByLocation: {
          primary: 'test.sidebar',
          secondary: 'test.inspector',
        },
        visibility: {
          activityBar: true,
          primarySidebar: true,
          secondarySidebar: true,
        },
      })),
      save: vi.fn(),
    };

    const controller = new WorkbenchController({
      layoutStore: store,
      plugins: [new TestLayoutPlugin()],
    });
    await controller.start();

    const state = controller.api.getSnapshot();
    expect(state.activeContainerByLocation?.primary).toBe('test.sidebar');
    expect(state.activeContainerByLocation?.secondary).toBe('test.inspector');

    controller.dispose();
  });

  it('ignores stale container ids in a persisted snapshot', async () => {
    const store: WorkbenchLayoutStore = {
      load: vi.fn(() => ({
        locations: { 'removed.panel': 'secondary', 'test.sidebar': 'secondary' },
        visibility: { secondarySidebar: true },
      })),
      save: vi.fn(),
    };

    const controller = new WorkbenchController({
      layoutStore: store,
      plugins: [new TestLayoutPlugin()],
    });
    await controller.start();

    const state = controller.api.getSnapshot();
    expect(state.viewLocations['removed.panel']).toBeUndefined();
    expect(state.viewLocations['test.sidebar']).toBe('secondary');

    controller.dispose();
  });
});
