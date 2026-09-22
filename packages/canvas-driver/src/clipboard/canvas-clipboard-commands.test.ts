import {
  AssetServiceId,
  EditorService,
  InMemoryAssetService,
  InstantiationService,
  SceneStore,
  WorkbenchEventService,
  type CommandContext,
} from '@openenvx/studio';
import { createDefaultFrame, nodeTransform } from '@openenvx/studio/schema';
import { describe, expect, it } from 'vitest';

import { CanvasClipboardServiceId } from '../canvas-service-tokens';
import {
  legacyLayer,
  testArtboard,
  testDocument,
} from '../test/canvas-document-fixtures';

import { CanvasClipboardService } from './canvas-clipboard-service';
import {
  executeCopyLayers,
  executeDuplicateLayers,
  executePasteLayers,
} from './canvas-clipboard-commands';

function createContext(sceneStore: SceneStore): CommandContext {
  const services = new InstantiationService();
  services.registerFactory(AssetServiceId, () => new InMemoryAssetService());
  const clipboard = services.createInstance(CanvasClipboardService);
  services.registerInstance(CanvasClipboardServiceId, clipboard);
  return {
    editor: new EditorService(),
    events: new WorkbenchEventService(),
    scene: sceneStore,
    selection: sceneStore.getSelection(),
    services,
  };
}

function createStoreWithSelection() {
  const scene = testDocument([
    testArtboard({
      id: 'p1',
      nodes: [
        legacyLayer({
          data: { fill: '#000' },
          id: 'rect-1',
          transform: { ...createDefaultFrame(), x: 10, y: 20 },
          type: 'canvas.rect',
        }),
      ],
    }),
  ]);
  return new SceneStore(scene, {
    activeArtboardId: 'p1',
    primaryNodeId: 'rect-1',
    selectedNodeIds: ['rect-1'],
  });
}

describe('canvas clipboard commands', () => {
  it('copies selected layers into internal clipboard', async () => {
    const store = createStoreWithSelection();
    const ctx = createContext(store);
    const clipboard = ctx.services.get(CanvasClipboardServiceId);
    clipboard.setEditorActive(true);

    await executeCopyLayers(ctx);

    expect(clipboard.hasInternal()).toBe(true);
    expect(clipboard.getInternal()?.origin).toEqual({ x: 10, y: 20 });
  });

  it('pastes internal clipboard as new layers', async () => {
    const store = createStoreWithSelection();
    const ctx = createContext(store);
    const clipboard = ctx.services.get(CanvasClipboardServiceId);
    clipboard.setEditorActive(true);
    clipboard.setPointerContext({
      artboardHeight: 1920,
      artboardWidth: 1080,
      containerHeight: 800,
      containerWidth: 600,
      panX: 0,
      panY: 0,
      zoom: 1,
    });
    clipboard.setLastPointer({ screenX: 540, screenY: 960 });
    clipboard.setInternal({
      layers: [
        legacyLayer({
          data: { fill: '#000' },
          id: 'rect-1',
          transform: { ...createDefaultFrame(), x: 10, y: 20 },
          type: 'canvas.rect',
        }),
      ],
      origin: { x: 10, y: 20 },
    });

    await executePasteLayers(ctx);

    const artboard = store.getScene().artboards[0]!;
    expect(artboard.nodes).toHaveLength(2);
    expect(artboard.nodes[1]!.id).not.toBe('rect-1');
    expect(store.getSelection().selectedNodeIds).toHaveLength(1);
  });

  it('duplicates selected layers with offset', async () => {
    const store = createStoreWithSelection();
    const ctx = createContext(store);
    const clipboard = ctx.services.get(CanvasClipboardServiceId);
    clipboard.setEditorActive(true);

    await executeDuplicateLayers(ctx);

    const artboard = store.getScene().artboards[0]!;
    expect(artboard.nodes).toHaveLength(2);
    expect(nodeTransform(artboard.nodes[1]!).x).toBe(20);
    expect(nodeTransform(artboard.nodes[1]!).y).toBe(30);
    expect(store.getSelection().selectedNodeIds[0]).toBe(artboard.nodes[1]!.id);
  });
});
