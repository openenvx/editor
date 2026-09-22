import { findNodeById, mapLayers, MIN_LAYER_SIZE } from '@openenvx/studio/core';
import {
  applyModifications,
  applyNodeTransform,
  type Document,
  type DocumentNode,
  type Modification,
  nodeTransform,
  type Transform,
} from '@openenvx/studio/schema';

import {
  isCurvedText,
  layoutCurvedText,
  stripHtmlToPlainText,
} from './rich-text-arc';
import { measureRichTextContentSize } from './rich-text-content-measure';
import {
  measurePlainTextWidth,
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
  'autoFit',
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
  autoFit?: 'none' | 'shrink' | 'hug';
  curve?: number;
  fontFamily?: string;
  fontSize?: number;
  letterSpacing?: number;
  lineHeight?: number;
}

export interface FitTextLayerOptions {
  /**
   * `height` - keep width, remasure height (templates / column layout).
   * `box` - hug both width and height to content (new inserts / paste).
   */
  mode?: FitTextLayerMode;
  /** Cap for `mode: 'box'` (long pasted lines wrap instead of growing forever). */
  maxWidth?: number;
}

export interface TextBoxFitTransformUpdate {
  dataPatch: Record<string, unknown>;
  transform: Transform;
}

function readTextData(layer: DocumentNode): CanvasTextDataLike | null {
  if (layer.type !== CANVAS_TEXT_TYPE) {
    return null;
  }
  if (typeof layer.props !== 'object' || layer.props === null) {
    return null;
  }
  return layer.props as CanvasTextDataLike;
}

function resolveFitMode(
  data: CanvasTextDataLike,
  options: FitTextLayerOptions
): FitTextLayerMode {
  if (options.mode) {
    return options.mode;
  }
  if (data.autoFit === 'hug') {
    return 'box';
  }
  return 'height';
}

/**
 * If `key` remasures a `canvas.text` box, return the fitted transform + patch.
 * Otherwise `null` - callers should use plain `updateProperty`.
 */
export function resolveTextBoxFitPropertyUpdate(
  scene: Document,
  layerId: string,
  key: string,
  value: unknown
): TextBoxFitTransformUpdate | null {
  if (!TEXT_BOX_FIT_KEYS.has(key)) {
    return null;
  }

  const layer = findNodeById(scene, layerId);
  if (!layer || layer.type !== CANVAS_TEXT_TYPE) {
    return null;
  }

  const props =
    typeof layer.props === 'object' && layer.props !== null
      ? { ...(layer.props as Record<string, unknown>), [key]: value }
      : { [key]: value };
  const fitted = fitCanvasTextLayerToContent({ ...layer, props });
  const before = nodeTransform(layer);
  const after = nodeTransform(fitted);
  if (
    fitted === layer ||
    (before.width === after.width &&
      before.height === after.height &&
      before.x === after.x)
  ) {
    return null;
  }

  return {
    dataPatch: { [key]: value },
    transform: after,
  };
}

/**
 * Remeasure a `canvas.text` transform so the box matches content.
 *
 * Skips `autoFit: 'shrink'` (fixed box by design).
 * Curved text hugs measured TextPath bounds (keeps horizontal center).
 */
export function fitCanvasTextLayerToContent(
  layer: DocumentNode,
  options: FitTextLayerOptions = {}
): DocumentNode {
  const data = readTextData(layer);
  if (!data || typeof data.html !== 'string') {
    return layer;
  }
  if (data.autoFit === 'shrink') {
    return layer;
  }

  const transform = nodeTransform(layer);

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
    const mode = resolveFitMode(data, options);

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

  return applyNodeTransform(layer, {
    ...transform,
    height,
    width,
    x,
  });
}

/**
 * Remasure every eligible `canvas.text` layer: `shrink` skipped, `hug` → box,
 * default / `none` → height (curved text keeps horizontal center).
 */
export function fitSceneCanvasTextToContent(scene: Document): Document {
  return {
    ...scene,
    artboards: scene.artboards.map((artboard) => ({
      ...artboard,
      nodes: mapLayers(artboard.nodes, fitCanvasTextLayerToContent),
    })),
  };
}

/**
 * Apply template modifications then remasure text boxes to the injected copy.
 * Use this when spinning up the editor / live preview with placeholder data.
 */
export function applyModificationsWithTextFit(
  scene: Document,
  modifications: Modification[]
): Document {
  return fitSceneCanvasTextToContent(applyModifications(scene, modifications));
}
