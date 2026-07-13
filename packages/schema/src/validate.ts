import { LAYER_WRITE_MODES, SCHEMA_VERSION } from './types';
import type { Layer, Page, Scene } from './types';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

function layerExistsOnPage(page: Page, layerId: string): boolean {
  let exists = false;

  function walk(layers: Layer[]): void {
    for (const layer of layers) {
      if (layer.id === layerId) {
        exists = true;
        return;
      }
      const data = layer.data;
      if (
        data &&
        typeof data === 'object' &&
        'children' in data &&
        Array.isArray((data as { children: unknown }).children)
      ) {
        walk((data as { children: Layer[] }).children);
      }
    }
  }

  walk(page.layers ?? []);
  return exists;
}

export function validateScene(scene: Scene): ValidationResult {
  const errors: string[] = [];

  if (typeof scene.schemaVersion !== 'number') {
    errors.push('schemaVersion must be a number');
  } else if (scene.schemaVersion > SCHEMA_VERSION) {
    errors.push(`Unsupported schemaVersion: ${scene.schemaVersion}`);
  }

  if (!Array.isArray(scene.pages) || scene.pages.length === 0) {
    errors.push('pages must be a non-empty array');
  }

  if (!scene.activePageId) {
    errors.push('activePageId is required');
  } else if (!scene.pages?.some((p) => p.id === scene.activePageId)) {
    errors.push('activePageId must reference an existing page');
  }

  for (const page of scene.pages ?? []) {
    if (!page.id) {
      errors.push('each page must have an id');
    }
    if (page.layout !== 'flow' && page.layout !== 'absolute') {
      errors.push(`page ${page.id}: layout must be flow or absolute`);
    }
    if (page.layout === 'absolute') {
      if (typeof page.width !== 'number' || typeof page.height !== 'number') {
        errors.push(
          `page ${page.id}: absolute layout requires width and height`
        );
      }
    }
    for (const layer of page.layers ?? []) {
      if (!layer.id) {
        errors.push(`page ${page.id}: each layer must have an id`);
      }
      if (!layer.type) {
        errors.push(`layer ${layer.id}: type is required`);
      }
      if (
        layer.writeMode &&
        !LAYER_WRITE_MODES.includes(
          layer.writeMode as (typeof LAYER_WRITE_MODES)[number]
        )
      ) {
        errors.push(`layer ${layer.id}: invalid writeMode`);
      }
    }
  }

  if (scene.templatePolicy && scene.templatePolicy.version !== 1) {
    errors.push('templatePolicy.version must be 1');
  }

  if (scene.selection) {
    const page = scene.pages.find((p) => p.id === scene.selection.activePageId);
    if (page) {
      for (const id of scene.selection.selectedLayerIds) {
        if (!layerExistsOnPage(page, id)) {
          errors.push(`selection references unknown layer: ${id}`);
        }
      }
    } else {
      errors.push('selection.activePageId must reference an existing page');
    }
  }

  return { errors, valid: errors.length === 0 };
}
