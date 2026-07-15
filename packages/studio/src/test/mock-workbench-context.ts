import { DEFAULT_WORKBENCH_LAYOUT } from '@openenvx/headless';
import type { WorkbenchApi, WorkbenchState } from '@openenvx/headless';
import { normalizeScene } from '@openenvx/schema';
import { vi } from 'vitest';

export function createMockWorkbenchApi(
  overrides: Partial<WorkbenchState> = {}
): {
  api: WorkbenchApi;
  executeCommand: ReturnType<typeof vi.fn>;
  state: WorkbenchState;
} {
  const scene = normalizeScene({
    activePageId: 'p1',
    pages: [{ id: 'p1', name: 'Page', layout: 'flow', layers: [] }],
  });
  const state: WorkbenchState = {
    commandPalette: {
      categories: [],
      items: [],
      tabs: [{ id: 'all', label: 'All' }],
    },
    commandStates: {},
    contextKeys: {},
    contextMenu: [],
    editor: null,
    editorPaneKind: 'flow',
    editorPanes: [],
    fieldRenderers: [],
    inspectorPanes: [],
    interaction: { hoveredLayerId: null },
    layerSurface: [],
    layout: DEFAULT_WORKBENCH_LAYOUT,
    overlays: [],
    properties: null,
    revision: 0,
    scene,
    selection: scene.selection,
    statusBar: [],
    statusBarItemRenderers: [],
    toolbarItems: [],
    viewContainers: [],
    ...overrides,
  };
  const executeCommand = vi.fn(async () => true);
  const listeners = new Set<(next: WorkbenchState) => void>();
  const notify = () => {
    for (const listener of listeners) {
      listener(state);
    }
  };
  const api = {
    executeCommand,
    getService: () => {},
    getSnapshot: () => state,
    setHoveredLayer: (layerId: string | null) => {
      if (state.interaction.hoveredLayerId === layerId) {
        return;
      }
      state.interaction = { hoveredLayerId: layerId };
      state.revision += 1;
      notify();
    },
    subscribe: (listener: (next: WorkbenchState) => void) => {
      listeners.add(listener);
      listener(state);
      return () => {
        listeners.delete(listener);
      };
    },
  } as unknown as WorkbenchApi;

  return { api, executeCommand, state };
}
