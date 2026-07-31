import { mapLayers, MIN_LAYER_SIZE } from '@openenvx/core';
import {
  applyModifications,
  type Layer,
  type Modification,
  type Scene,
} from '@xmazu/openenvxee-schema';

import { isCurvedText } from './rich-text-arc';
import {
  measureRichTextContentSize,
  measureRichTextHeight,
} from './rich-text-layout';
import {
  DEFAULT_RICH_TEXT_FONT_FAMILY,
  DEFAULT_RICH_TEXT_FONT_SIZE,
  DEFAULT_RICH_TEXT_LETTER_SPACING,
} from './rich-text-typography';

const CANVAS_TEXT_TYPE = 'canvas.text';

export type FitTextLayerMode = 'height' | 'box';

interface CanvasTextDataLike {
  html?: unknown;
  align?: 'left' | 'center' | 'right';
  autoFit?: 'none' | 'shrink';
  curve?: number;
  fontFamily?: string;
  fontSize?: number;
  letterSpacing?: number;
  lineHeight?: number;
}

export interface FitTextLayerOptions {
  /**
   * `height` — keep width, remasure height (templates / column layout).
   * `box` — hug both width and height to content (new inserts / paste).
   */
  mode?: FitTextLayerMode;
  /** Cap for `mode: 'box'` (long pasted lines wrap instead of growing forever). */
  maxWidth?: number;
}

function readTextData(layer: Layer): CanvasTextDataLike | null {
  if (layer.type !== CANVAS_TEXT_TYPE) {
    return null;
  }
  if (typeof layer.data !== 'object' || layer.data === null) {
    return null;
  }
  return layer.data as CanvasTextDataLike;
}

/**
 * Remeasure a `canvas.text` transform so the box matches content.
 *
 * Skips `autoFit: 'shrink'` (fixed box by design) and curved text.
 */
export function fitCanvasTextLayerToContent(
  layer: Layer,
  options: FitTextLayerOptions = {}
): Layer {
  const data = readTextData(layer);
  if (!data || typeof data.html !== 'string') {
    return layer;
  }
  if (data.autoFit === 'shrink') {
    return layer;
  }
  if (isCurvedText(data.curve ?? 0)) {
    return layer;
  }

  const transform = layer.transform;
  if (!transform) {
    return layer;
  }

  const mode = options.mode ?? 'height';
  const fontFamily = data.fontFamily ?? DEFAULT_RICH_TEXT_FONT_FAMILY;
  const fontSize = data.fontSize ?? DEFAULT_RICH_TEXT_FONT_SIZE;
  const letterSpacing = data.letterSpacing ?? DEFAULT_RICH_TEXT_LETTER_SPACING;

  let width: number;
  let height: number;

  if (mode === 'box') {
    const size = measureRichTextContentSize({
      align: data.align,
      fontFamily,
      fontSize,
      html: data.html,
      letterSpacing,
      lineHeightMultiplier: data.lineHeight,
      maxWidth: options.maxWidth,
    });
    width = Math.max(MIN_LAYER_SIZE, size.width);
    height = Math.max(MIN_LAYER_SIZE, size.height);
  } else {
    width = Math.max(MIN_LAYER_SIZE, transform.width);
    height = Math.max(
      MIN_LAYER_SIZE,
      measureRichTextHeight({
        align: data.align,
        fontFamily,
        fontSize,
        html: data.html,
        letterSpacing,
        lineHeightMultiplier: data.lineHeight,
        width,
      })
    );
  }

  if (
    Math.abs(height - transform.height) < 0.5 &&
    Math.abs(width - transform.width) < 0.5
  ) {
    return layer;
  }

  return {
    ...layer,
    transform: {
      ...transform,
      height,
      width,
    },
  };
}

/** Walk the scene and remasure every eligible `canvas.text` layer (height mode). */
export function fitSceneCanvasTextToContent(scene: Scene): Scene {
  return {
    ...scene,
    pages: scene.pages.map((page) => ({
      ...page,
      layers: mapLayers(page.layers, fitCanvasTextLayerToContent),
    })),
  };
}

/**
 * Apply template modifications then remasure text boxes to the injected copy.
 * Use this when spinning up the editor / live preview with placeholder data.
 */
export function applyModificationsWithTextFit(
  scene: Scene,
  modifications: Modification[]
): Scene {
  return fitSceneCanvasTextToContent(applyModifications(scene, modifications));
}
