import type {
  FrozenLayerSnapshot,
  LayerWriteMode,
  Scene,
} from '@openenvx/schema';

import { getLayerChildren, hasChildLayers, walkLayers } from './layer-tree';
import type { Layer } from './types';

/**
 * Session flag: when false (dashboard authoring), writeMode / showInLayers /
 * templatePolicy do not constrain editing. When true (embed consumer), they do.
 * ponytail: process-wide for the active workbench; set once at shell start.
 */
let templatePolicyEnforced = true;

export function setTemplatePolicyEnforced(enforced: boolean): void {
  templatePolicyEnforced = enforced;
}

export function isTemplatePolicyEnforced(): boolean {
  return templatePolicyEnforced;
}

export function getLayerWriteMode(layer: Layer): LayerWriteMode {
  return layer.writeMode ?? 'free';
}

/** Absent/true = listed in Layers tree for consumers. */
export function isLayerShownInLayers(layer: Layer): boolean {
  return layer.showInLayers !== false;
}

export function isLayerEditable(layer: Layer): boolean {
  if (!isTemplatePolicyEnforced()) {
    return true;
  }
  return getLayerWriteMode(layer) !== 'locked';
}

export function isLayerLocked(layer: Layer): boolean {
  return layer.locked === true;
}

export function isLayerVisible(layer: Layer): boolean {
  return layer.visible !== false;
}

export function isLayerWritable(layer: Layer): boolean {
  return isLayerEditable(layer) && !isLayerLocked(layer);
}

export function canSelectLayer(layer: Layer): boolean {
  if (!isTemplatePolicyEnforced()) {
    return true;
  }
  if (!isLayerShownInLayers(layer)) {
    // Bound widget face parts stay out of the Layers tree but must remain
    // selectable so inline content editing (`writeMode: 'content'`) works.
    return getLayerWriteMode(layer) === 'content';
  }
  return getLayerWriteMode(layer) !== 'locked';
}

export function canTransformLayer(layer: Layer): boolean {
  if (!isLayerWritable(layer)) {
    return false;
  }
  if (!isTemplatePolicyEnforced()) {
    return true;
  }

  const mode = getLayerWriteMode(layer);
  return mode === 'free' || mode === 'properties';
}

export function canEditLayerData(layer: Layer, key?: string): boolean {
  if (!isLayerWritable(layer)) {
    return false;
  }
  if (!isTemplatePolicyEnforced()) {
    return true;
  }

  const mode = getLayerWriteMode(layer);
  if (mode === 'free') {
    return true;
  }
  if (mode !== 'content') {
    return false;
  }
  const allowed = layer.allowedDataKeys;
  if (!allowed || allowed.length === 0) {
    return true;
  }
  if (key === undefined) {
    return true;
  }
  return allowed.includes(key);
}

export function canDeleteLayer(layer: Layer, scene: Scene): boolean {
  // Page/Email frame is structural — never remove from Layers or shortcuts.
  if (layer.type.endsWith('.root')) {
    return false;
  }
  if (!canTransformLayer(layer)) {
    return false;
  }
  if (!isTemplatePolicyEnforced()) {
    return true;
  }

  return scene.templatePolicy?.allowDeleteLayers !== false;
}

export function canDuplicateLayer(layer: Layer, scene: Scene): boolean {
  if (!canTransformLayer(layer)) {
    return false;
  }
  if (!isTemplatePolicyEnforced()) {
    return true;
  }

  return scene.templatePolicy?.allowDuplicateLayers !== false;
}

export function canReorderLayer(layer: Layer): boolean {
  return canTransformLayer(layer);
}

export function canInsertLayers(scene: Scene): boolean {
  if (!isTemplatePolicyEnforced()) {
    return true;
  }
  return scene.templatePolicy?.allowInsertLayers !== false;
}

export function canResizePage(scene: Scene): boolean {
  if (!isTemplatePolicyEnforced()) {
    return true;
  }
  return scene.templatePolicy?.allowPageResize !== false;
}

/**
 * Capture immutable fields from writeMode constraints.
 * - locked: data + transform
 * - content (data-only): transform
 * - properties (transform-only): data
 */
export function buildFrozenLayerSnapshot(
  scene: Scene
): Record<string, FrozenLayerSnapshot> {
  const frozen: Record<string, FrozenLayerSnapshot> = {};

  for (const page of scene.pages) {
    walkLayers(page.layers, (layer) => {
      const mode = getLayerWriteMode(layer);

      if (mode === 'locked') {
        frozen[layer.id] = {
          data: structuredClone(layer.data),
          ...(layer.transform
            ? { transform: structuredClone(layer.transform) }
            : {}),
        };
        return;
      }

      if (mode === 'content' && layer.transform) {
        frozen[layer.id] = {
          transform: structuredClone(layer.transform),
        };
        return;
      }

      if (mode === 'properties') {
        frozen[layer.id] = {
          data: structuredClone(layer.data),
        };
      }
    });
  }

  return frozen;
}

/** Persist freeze snapshots onto `templatePolicy.frozenLayers` for write enforcement. */
export function withFrozenLayerSnapshots(scene: Scene): Scene {
  const policy = scene.templatePolicy;
  return {
    ...scene,
    templatePolicy: {
      allowDeleteLayers: policy?.allowDeleteLayers ?? true,
      allowDuplicateLayers: policy?.allowDuplicateLayers ?? true,
      allowInsertLayers: policy?.allowInsertLayers ?? true,
      allowPageResize: policy?.allowPageResize ?? true,
      version: 1,
      ...policy,
      frozenLayers: buildFrozenLayerSnapshot(scene),
    },
  };
}

function restoreFrozenLayer(
  layer: Layer,
  frozen: Record<string, FrozenLayerSnapshot>
): Layer {
  const snap = frozen[layer.id];
  let next = layer;
  if (snap) {
    next = { ...next };
    if ('data' in snap && snap.data !== undefined) {
      next = { ...next, data: structuredClone(snap.data) as Layer['data'] };
    }
    if (snap.transform !== undefined) {
      next = { ...next, transform: structuredClone(snap.transform) };
    }
  }
  if (!hasChildLayers(next)) {
    return next;
  }
  return {
    ...next,
    data: {
      ...(next.data as object),
      children: getLayerChildren(next).map((child) =>
        restoreFrozenLayer(child, frozen)
      ),
    },
  } as Layer;
}

/** Re-apply `templatePolicy.frozenLayers` snapshots onto matching layers. */
export function applyFrozenLayerPolicy(scene: Scene): Scene {
  if (!isTemplatePolicyEnforced()) {
    return scene;
  }
  const frozen = scene.templatePolicy?.frozenLayers;
  if (!frozen || Object.keys(frozen).length === 0) {
    return scene;
  }
  return {
    ...scene,
    pages: scene.pages.map((page) => ({
      ...page,
      layers: page.layers.map((layer) => restoreFrozenLayer(layer, frozen)),
    })),
  };
}
