import {
  AssetServiceId,
  EditorService,
  InMemoryAssetService,
  InstantiationService,
  SceneStore,
  WorkbenchEventService,
} from '@openenvx/core';
import type { CommandContext } from '@openenvx/core';
import { createDefaultTransform, normalizeScene } from '@openenvx/schema';
import { describe, expect, it } from 'vitest';

import { CanvasClipboardServiceId } from '../canvas-service-tokens';

import { CanvasClipboardService } from './canvas-clipboard-service';
import {
  executeCopyLayers,
  executeDuplicateLayers,
  executePasteLayers,
} from './canvas-clipboard-commands';

function createContext(sceneStore: SceneStore): CommandContext {
  const scene = sceneStore.getScene();
  const services = new InstantiationService();
  services.registerFactory(AssetServiceId, () => new InMemoryAssetService());
  const clipboard = services.createInstance(CanvasClipboardService);
  services.registerInstance(CanvasClipboardServiceId, clipboard);
  return {
    editor: new EditorService(),
    events: new WorkbenchEventService(),
    scene: sceneStore,
    selection: scene.selection,
    services,
  };
}

describe('canvas clipboard commands', () => {
  it('copies selected layers into internal clipboard', async () => {
    const scene = normalizeScene({
      activePageId: 'p1',
      pages: [
        {
          id: 'p1',
          layout: 'absolute',
          layers: [
            {
              data: { fill: '#000' },
              id: 'rect-1',
              transform: { ...createDefaultTransform(), x: 10, y: 20 },
              type: 'canvas.rect',
            },
          ],
          name: 'Page',
        },
      ],
      selection: {
        activePageId: 'p1',
        primaryLayerId: 'rect-1',
        selectedLayerIds: ['rect-1'],
      },
    });
    const store = new SceneStore(scene);
    const ctx = createContext(store);
    const clipboard = ctx.services.get(CanvasClipboardServiceId);
    clipboard.setEditorActive(true);

    await executeCopyLayers(ctx);

    expect(clipboard.hasInternal()).toBe(true);
    expect(clipboard.getInternal()?.origin).toEqual({ x: 10, y: 20 });
  });

  it('pastes internal clipboard as new layers', async () => {
    const scene = normalizeScene({
      activePageId: 'p1',
      pages: [
        {
          id: 'p1',
          layout: 'absolute',
          layers: [
            {
              data: { fill: '#000' },
              id: 'rect-1',
              transform: { ...createDefaultTransform(), x: 10, y: 20 },
              type: 'canvas.rect',
            },
          ],
          name: 'Page',
        },
      ],
      selection: {
        activePageId: 'p1',
        primaryLayerId: 'rect-1',
        selectedLayerIds: ['rect-1'],
      },
    });
    const store = new SceneStore(scene);
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
        {
          data: { fill: '#000' },
          id: 'rect-1',
          transform: { ...createDefaultTransform(), x: 10, y: 20 },
          type: 'canvas.rect',
        },
      ],
      origin: { x: 10, y: 20 },
    });

    await executePasteLayers(ctx);

    const page = store.getScene().pages[0]!;
    expect(page.layers).toHaveLength(2);
    expect(page.layers[1]!.id).not.toBe('rect-1');
    expect(store.getScene().selection.selectedLayerIds).toHaveLength(1);
  });

  it('duplicates selected layers with offset', async () => {
    const scene = normalizeScene({
      activePageId: 'p1',
      pages: [
        {
          id: 'p1',
          layout: 'absolute',
          layers: [
            {
              data: { fill: '#000' },
              id: 'rect-1',
              transform: { ...createDefaultTransform(), x: 10, y: 20 },
              type: 'canvas.rect',
            },
          ],
          name: 'Page',
        },
      ],
      selection: {
        activePageId: 'p1',
        primaryLayerId: 'rect-1',
        selectedLayerIds: ['rect-1'],
      },
    });
    const store = new SceneStore(scene);
    const ctx = createContext(store);
    const clipboard = ctx.services.get(CanvasClipboardServiceId);
    clipboard.setEditorActive(true);

    await executeDuplicateLayers(ctx);

    const page = store.getScene().pages[0]!;
    expect(page.layers).toHaveLength(2);
    expect(page.layers[1]!.transform?.x).toBe(20);
    expect(page.layers[1]!.transform?.y).toBe(30);
    expect(store.getScene().selection.selectedLayerIds[0]).toBe(page.layers[1]!.id);
  });
});
