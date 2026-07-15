import {
  findLayerById,
  insertLayerIntoContainer,
  removeLayerFromTree,
  updateLayerInTree,
  walkLayers,
} from '@openenvx/core';
import type { WorkbenchApi } from '@openenvx/headless';
import type { Scene } from '@openenvx/schema';

import type {
  CreateLayerChange,
  ProposedChange,
} from '../schemas/proposed-changes';
import { buildLayerFromChange } from './normalize-create-layer';

function setNestedValue(
  target: Record<string, unknown>,
  path: string,
  value: unknown
): void {
  const keys = path.split('.');
  let current = target;
  for (let index = 0; index < keys.length - 1; index += 1) {
    const key = keys[index]!;
    const next = current[key];
    if (typeof next !== 'object' || next === null) {
      current[key] = {};
    }
    current = current[key] as Record<string, unknown>;
  }
  current[keys.at(-1)!] = value;
}

function applyPropertyChangeToScene(
  scene: Scene,
  change: ProposedChange
): Scene {
  if (change.kind !== 'updateProperty') {
    return scene;
  }

  const targetLayer = findLayerById(scene, change.layerId);
  if (!targetLayer) {
    return scene;
  }

  return {
    ...scene,
    pages: scene.pages.map((page) => ({
      ...page,
      layers: updateLayerInTree(page.layers, change.layerId, (layer) => {
        const data =
          typeof layer.data === 'object' && layer.data !== null
            ? { ...(layer.data as Record<string, unknown>) }
            : {};
        if (change.key.includes('.')) {
          setNestedValue(data, change.key, change.value);
        } else {
          data[change.key] = change.value;
        }
        return { ...layer, data };
      }),
    })),
  };
}

function countLayers(scene: Scene): number {
  let count = 0;
  const increment = () => {
    count += 1;
  };
  for (const page of scene.pages) {
    walkLayers(page.layers, increment);
  }
  return count;
}

function applyCreateLayerToScene(
  scene: Scene,
  change: CreateLayerChange
): { scene: Scene; applied: boolean } {
  const pageId = scene.activePageId ?? scene.pages[0]?.id;
  if (!pageId) {
    return { scene, applied: false };
  }
  const layer = buildLayerFromChange(change);
  const before = countLayers(scene);

  const nextScene: Scene = {
    ...scene,
    pages: scene.pages.map((page) => {
      if (page.id !== pageId) {
        return page;
      }
      if (change.parentId) {
        return {
          ...page,
          layers: insertLayerIntoContainer(page.layers, change.parentId, layer),
        };
      }
      return {
        ...page,
        layers: [...page.layers, layer],
      };
    }),
  };

  const applied = countLayers(nextScene) > before;
  return { scene: nextScene, applied };
}

function applyDeleteLayersToScene(scene: Scene, layerIds: string[]): Scene {
  const ids = new Set(layerIds);
  return {
    ...scene,
    pages: scene.pages.map((page) => {
      let layers = page.layers;
      for (const id of ids) {
        layers = removeLayerFromTree(layers, id);
      }
      return { ...page, layers };
    }),
    selection: {
      activePageId: scene.selection.activePageId,
      selectedLayerIds: scene.selection.selectedLayerIds.filter(
        (id) => !ids.has(id)
      ),
      primaryLayerId:
        scene.selection.primaryLayerId &&
        ids.has(scene.selection.primaryLayerId)
          ? null
          : scene.selection.primaryLayerId,
    },
  };
}

/**
 * Apply order: create → select → property → command → delete.
 */
export async function applyProposedChanges(
  api: WorkbenchApi,
  changes: ProposedChange[],
  summary?: string
): Promise<{ applied: number; skipped: number }> {
  const createChanges = changes.filter(
    (change): change is Extract<ProposedChange, { kind: 'createLayer' }> =>
      change.kind === 'createLayer'
  );
  const selectionChanges = changes.filter(
    (change): change is Extract<ProposedChange, { kind: 'selectLayers' }> =>
      change.kind === 'selectLayers'
  );
  const propertyChanges = changes.filter(
    (change): change is Extract<ProposedChange, { kind: 'updateProperty' }> =>
      change.kind === 'updateProperty'
  );
  const commandChanges = changes.filter(
    (change): change is Extract<ProposedChange, { kind: 'executeCommand' }> =>
      change.kind === 'executeCommand'
  );
  const deleteChanges = changes.filter(
    (change): change is Extract<ProposedChange, { kind: 'deleteLayer' }> =>
      change.kind === 'deleteLayer'
  );

  let applied = 0;
  let skipped = 0;

  if (createChanges.length > 0) {
    let createApplied = 0;
    let createSkipped = 0;
    api.scene.apply({
      apply: (scene) => {
        let next = scene;
        for (const change of createChanges) {
          const result = applyCreateLayerToScene(next, change);
          next = result.scene;
          if (result.applied) {
            createApplied += 1;
          } else {
            createSkipped += 1;
          }
        }
        return next;
      },
      label: summary ?? 'Agent create layers',
    });
    applied += createApplied;
    skipped += createSkipped;
  }

  for (const change of selectionChanges) {
    api.selectLayers(change.layerIds, change.primaryLayerId);
    applied += 1;
  }

  if (propertyChanges.length > 0) {
    api.scene.apply({
      apply: (scene) =>
        propertyChanges.reduce(
          (next, change) => applyPropertyChangeToScene(next, change),
          scene
        ),
      label: summary ?? 'Agent changes',
    });
    applied += propertyChanges.length;
  }

  for (const change of commandChanges) {
    const result = await api.runCommand(change.commandId, change.args);
    if (result.executed) {
      applied += 1;
    } else {
      skipped += 1;
    }
  }

  if (deleteChanges.length > 0) {
    const layerIds = deleteChanges.flatMap((change) => change.layerIds);
    api.scene.apply({
      apply: (scene) => applyDeleteLayersToScene(scene, layerIds),
      label: summary ?? 'Agent delete layers',
    });
    applied += deleteChanges.length;
  }

  return { applied, skipped };
}
