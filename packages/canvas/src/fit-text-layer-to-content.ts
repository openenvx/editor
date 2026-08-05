import { findLayerById, mapLayers, MIN_LAYER_SIZE } from '@openenvx/core';
import {
  applyModifications,
  type Layer,
  type Modification,
  type Scene,
  type Transform,
} from '@xmazu/openenvxee-schema';

import {
  isCurvedText,
  layoutCurvedText,
  stripHtmlToPlainText,
} from './rich-text-arc';
import {
  measurePlainTextWidth,
  measureRichTextContentSize,
  measureRichTextHeight,
} from './rich-text-layout';
import {
  DEFAULT_RICH_TEXT_FONT_FAMILY,
  DEFAULT_RICH_TEXT_FONT_SIZE,
  DEFAULT_RICH_TEXT_LETTER_SPACING,
} from './rich-text-typography';

const CANVAS_TEXT_TYPE = 'canvas.text';

/** Layer data keys that remasure the text box (and keep horizontal center when curved). */
export const TEXT_BOX_FIT_KEYS = new Set([
  'align',
  'curve',
  'fontFamily',
  'fontSize',
  'html',
  'letterSpacing',
  'lineHeight',
]);

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

export interface TextBoxFitTransformUpdate {
  dataPatch: Record<string, unknown>;
  transform: Transform;
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
 * If `key` remasures a `canvas.text` box, return the fitted transform + patch.
 * Otherwise `null` — callers should use plain `updateProperty`.
 */
export function resolveTextBoxFitPropertyUpdate(
  scene: Scene,
  layerId: string,
  key: string,
  value: unknown
): TextBoxFitTransformUpdate | null {
  if (!TEXT_BOX_FIT_KEYS.has(key)) {
    return null;
  }

  const layer = findLayerById(scene, layerId);
  if (!layer || layer.type !== CANVAS_TEXT_TYPE) {
    return null;
  }

  const data =
    typeof layer.data === 'object' && layer.data !== null
      ? { ...(layer.data as Record<string, unknown>), [key]: value }
      : { [key]: value };
  const fitted = fitCanvasTextLayerToContent({ ...layer, data });
  if (fitted === layer || !fitted.transform) {
    return null;
  }

  return {
    dataPatch: { [key]: value },
    transform: fitted.transform,
  };
}

/**
 * Remeasure a `canvas.text` transform so the box matches content.
 *
 * Skips `autoFit: 'shrink'` (fixed box by design).
 * Curved text hugs measured TextPath bounds (keeps horizontal center).
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

  const transform = layer.transform;
  if (!transform) {
    return layer;
  }

  const fontFamily = data.fontFamily ?? DEFAULT_RICH_TEXT_FONT_FAMILY;
  const fontSize = data.fontSize ?? DEFAULT_RICH_TEXT_FONT_SIZE;
  const letterSpacing = data.letterSpacing ?? DEFAULT_RICH_TEXT_LETTER_SPACING;
  const curve = data.curve ?? 0;

  let width: number;
  let height: number;
  let x = transform.x;

  if (isCurvedText(curve)) {
    const plain = stripHtmlToPlainText(data.html);
    const text = plain.length > 0 ? plain : ' ';
    const textWidth = measurePlainTextWidth(
      text,
      fontSize,
      fontFamily,
      letterSpacing
    );
    const layout = layoutCurvedText({
      curve,
      fontFamily,
      fontSize,
      letterSpacing,
      text,
      textWidth,
    });
    width = Math.max(MIN_LAYER_SIZE, layout.width);
    height = Math.max(MIN_LAYER_SIZE, layout.height);
    // Lock the world-space horizontal center while width remasures.
    const centerX = transform.x + transform.width / 2;
    x = centerX - width / 2;
  } else {
    const mode = options.mode ?? 'height';

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
  }

  if (
    Math.abs(height - transform.height) < 0.5 &&
    Math.abs(width - transform.width) < 0.5 &&
    Math.abs(x - transform.x) < 0.5
  ) {
    return layer;
  }

  return {
    ...layer,
    transform: {
      ...transform,
      height,
      width,
      x,
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
