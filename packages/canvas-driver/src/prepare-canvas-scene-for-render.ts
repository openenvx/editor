import {
  applyTemplateVariables,
  applyTemplateVariablesForPreview,
  type Scene,
} from '@openenvx/studio/schema';

import type { CanvasExportOptions } from './export/canvas-document-export-service';
import { fitSceneCanvasTextToContent } from './fit-text-layer-to-content';

/**
 * Canvas raster export and Konva preview both substitute (when requested) then run
 * `fitSceneCanvasTextToContent`. Export without `variables` still remeasures from stored
 * copy (tokens unchanged); pass `buildSampleVariableValues(scene)` for sample WYSIWYG.
 */

export type CanvasSceneSubstitution =
  | { mode: 'preview' }
  | { mode: 'variables'; values: Record<string, string> }
  | { mode: 'none' };

/** Substitute template tokens (when requested) and remeasure eligible `canvas.text` boxes. */
export function prepareCanvasSceneForRender(
  scene: Scene,
  substitution: CanvasSceneSubstitution
): Scene {
  let substituted = scene;
  if (substitution.mode === 'preview') {
    substituted = applyTemplateVariablesForPreview(scene);
  } else if (substitution.mode === 'variables') {
    substituted = applyTemplateVariables(scene, substitution.values);
  }
  return fitSceneCanvasTextToContent(substituted);
}

/** Export pipeline: optional `variables`, then text remasure (including `autoFit: 'hug'`). */
export function resolveCanvasExportScene(
  scene: Scene,
  options: Pick<CanvasExportOptions, 'variables'>
): Scene {
  return prepareCanvasSceneForRender(
    scene,
    options.variables
      ? { mode: 'variables', values: options.variables }
      : { mode: 'none' }
  );
}
