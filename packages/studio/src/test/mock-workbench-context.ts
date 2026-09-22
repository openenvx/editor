import { vi } from 'vitest';

import { DEFAULT_WORKBENCH_LAYOUT } from '#studio';
import type { FormDialogPayload, WorkbenchApi, WorkbenchState } from '#studio';

import { normalizeSceneForTest } from '../test/document-fixtures';

export function createMockWorkbenchApi(
  overrides: Partial<WorkbenchState> = {}
): {
  api: WorkbenchApi;
  executeCommand: ReturnType<typeof vi.fn>;
  state: WorkbenchState;
} {
  const scene = normalizeSceneForTest({
    pages: [{ id: 'p1', name: 'Page', layout: 'flow', layers: [] }],
  });
  const state: WorkbenchState = {
    activeContainerByLocation: { panel: null, primary: null, secondary: null },
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
    interaction: { hoveredLayerId: null },
    layerSurface: [],
    layout: DEFAULT_WORKBENCH_LAYOUT,
    overlays: [],
    properties: null,
    revision: 0,
    scene,
    selection: {
      activeArtboardId: 'p1',
      primaryNodeId: null,
      selectedNodeIds: [],
    },
    sidebarHeaders: {},
    statusBar: [],
    statusBarItemRenderers: [],
    toolbarItems: [],
    topBarItems: [],
    viewContainers: [],
    viewLocations: {},
    viewPanels: [],
    activeDialog: null,
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
    setActiveContainer: (
      location: 'primary' | 'secondary',
      containerId: string
    ) => {
      state.activeContainerByLocation = {
        ...state.activeContainerByLocation,
        [location]: containerId,
      };
      state.revision += 1;
      notify();
    },
    setPrimarySidebarVisible: (visible: boolean) => {
      state.layout = { ...state.layout, primarySidebar: visible };
      state.revision += 1;
      notify();
    },
    setActivityBarVisible: (visible: boolean) => {
      state.layout = { ...state.layout, activityBar: visible };
      state.revision += 1;
      notify();
    },
    setSecondarySidebarVisible: (visible: boolean) => {
      state.layout = { ...state.layout, secondarySidebar: visible };
      state.revision += 1;
      notify();
    },
    togglePrimarySidebar: () => {
      api.setPrimarySidebarVisible(!state.layout.primarySidebar);
    },
    toggleActivityBar: () => {
      api.setActivityBarVisible(!state.layout.activityBar);
    },
    toggleSecondarySidebar: () => {
      api.setSecondarySidebarVisible(!state.layout.secondarySidebar);
    },
    moveContainer: vi.fn(),
    setContainerOrder: vi.fn(),
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
    closeDialog: () => {
      state.activeDialog = null;
      state.revision += 1;
      notify();
    },
    showConfirm: vi.fn(async () => true),
    resolveDialogConfirm: vi.fn(),
    showForm: vi.fn(async () => {}),
    resolveDialogForm: vi.fn(),
    patchDialogFormPayload: (patch: Partial<FormDialogPayload>) => {
      if (state.activeDialog?.kind !== 'form') {
        return;
      }
      state.activeDialog = {
        kind: 'form',
        payload: { ...state.activeDialog.payload, ...patch },
      };
      state.revision += 1;
      notify();
    },
  } as unknown as WorkbenchApi;

  return { api, executeCommand, state };
}
