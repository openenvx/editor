import { findLayerById, walkLayers } from '@openenvx/core';
import type { Layer, Scene } from '@openenvx/schema';

import type { RichTextToolbarOptions } from '../block-config';
import type { BlockRegistry } from '../block-registry';

export interface ResolvedRichTextToolbar {
  blockType: boolean;
  link: boolean;
  code: boolean;
  align: boolean;
}

const DEFAULT_TOOLBAR: ResolvedRichTextToolbar = {
  blockType: true,
  link: true,
  code: true,
  align: true,
};

function mergeToolbar(
  base: ResolvedRichTextToolbar,
  override?: RichTextToolbarOptions
): ResolvedRichTextToolbar {
  if (!override) {
    return base;
  }
  return {
    blockType: override.blockType ?? base.blockType,
    link: override.link ?? base.link,
    code: override.code ?? base.code,
    align: override.align ?? base.align,
  };
}

function ancestorPath(scene: Scene, layerId: string): Layer[] {
  for (const page of scene.pages) {
    let found: Layer[] | null = null;
    walkLayers(page.layers, (layer, path) => {
      if (layer.id === layerId) {
        found = path;
      }
    });
    if (found) {
      return found;
    }
  }
  return [];
}

/** Resolve bubble-menu flags for a selectable rich-text layer. */
export function resolveRichTextToolbar(
  layer: Layer,
  scene: Scene,
  registry: BlockRegistry
): ResolvedRichTextToolbar {
  let resolved = DEFAULT_TOOLBAR;
  for (const ancestor of ancestorPath(scene, layer.id)) {
    resolved = mergeToolbar(
      resolved,
      registry.get(ancestor.type)?.childRichTextToolbar
    );
  }
  return mergeToolbar(resolved, registry.get(layer.type)?.richTextToolbar);
}

/** Resolve bubble-menu flags for a composite slot text part. */
export function resolveSlotRichTextToolbar(
  hostId: string,
  part: Layer,
  scene: Scene,
  registry: BlockRegistry
): ResolvedRichTextToolbar {
  const host = findLayerById(scene, hostId);
  let resolved = DEFAULT_TOOLBAR;
  if (host) {
    for (const ancestor of [...ancestorPath(scene, host.id), host]) {
      resolved = mergeToolbar(
        resolved,
        registry.get(ancestor.type)?.childRichTextToolbar
      );
    }
  }
  return mergeToolbar(resolved, registry.get(part.type)?.richTextToolbar);
}
