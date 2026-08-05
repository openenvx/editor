import {
  CONTAINER_LAYER_TYPE,
  isContainerLayer,
  mapLayers,
  MIN_LAYER_SIZE,
} from '@openenvx/core';
import type {
  ContainerLayoutModel,
  Layer,
  Page,
  Transform,
} from '@openenvx/core';
import type { LayerStyle } from '@xmazu/openenvxee-schema';

import { getDefaultPageDimensions } from '../page-presets';
import { measureRichTextHeight } from '../rich-text-layout';
import { MIN_RICH_TEXT_FONT_SIZE } from '../rich-text-resize';
import {
  DEFAULT_RICH_TEXT_FONT_FAMILY,
  DEFAULT_RICH_TEXT_LETTER_SPACING,
} from '../rich-text-typography';
import type { normalizeCornerRadius } from '../style-utils';
import { scaleCornerRadius, scalePadding } from '../style-utils';

const CANVAS_TEXT_TYPE = 'canvas.text';
const CANVAS_RECT_TYPE = 'canvas.rect';
const CANVAS_CIRCLE_TYPE = 'canvas.circle';

function scaleValue(value: number, factor: number): number {
  return value * factor;
}

function clampMin(value: number, min: number): number {
  return Math.max(min, value);
}

function bakeTransformScale(transform: Transform): Transform {
  const scaleX = transform.scaleX ?? 1;
  const scaleY = transform.scaleY ?? 1;
  const next: Transform = {
    ...transform,
    width: transform.width * Math.abs(scaleX),
    height: transform.height * Math.abs(scaleY),
  };
  delete next.scaleX;
  delete next.scaleY;
  return next;
}

function scaleTransform(
  transform: Transform | undefined,
  scaleX: number,
  scaleY: number
): Transform {
  const base = bakeTransformScale(
    transform ?? { x: 0, y: 0, width: 0, height: 0, rotation: 0, opacity: 1 }
  );
  return {
    ...base,
    x: scaleValue(base.x, scaleX),
    y: scaleValue(base.y, scaleY),
    width: clampMin(scaleValue(base.width, scaleX), MIN_LAYER_SIZE),
    height: clampMin(scaleValue(base.height, scaleY), MIN_LAYER_SIZE),
  };
}

function scaleLayerStyle(
  style: LayerStyle | undefined,
  scaleX: number,
  scaleY: number
): LayerStyle | undefined {
  if (!style) {
    return undefined;
  }

  const uniform = (value: number) => scaleValue(value, (scaleX + scaleY) / 2);

  return {
    ...style,
    padding: scalePadding(style.padding, scaleX, scaleY),
    cornerRadius: scaleCornerRadius(style.cornerRadius, (scaleX + scaleY) / 2),
    border:
      style.border === undefined
        ? undefined
        : {
            ...style.border,
            width: uniform(style.border.width),
          },
    shadow:
      style.shadow === undefined
        ? undefined
        : {
            ...style.shadow,
            offsetX: scaleValue(style.shadow.offsetX, scaleX),
            offsetY: scaleValue(style.shadow.offsetY, scaleY),
            blur: uniform(style.shadow.blur),
            spread: uniform(style.shadow.spread ?? 0),
          },
  };
}

interface CanvasTextData {
  align?: 'left' | 'center' | 'right';
  fill?: string;
  fontFamily?: string;
  fontSize?: number;
  html: string;
  letterSpacing?: number;
  lineHeight?: number;
}

interface CanvasRectData {
  cornerRadius?: ReturnType<typeof normalizeCornerRadius>;
  fill: string;
  stroke?: string;
  strokeWidth?: number;
}

interface CanvasCircleData {
  fill: string;
  stroke?: string;
  strokeWidth?: number;
}

function scaleTextLayer(layer: Layer, scaleX: number, scaleY: number): Layer {
  const data = layer.data as CanvasTextData;
  const transform = scaleTransform(layer.transform, scaleX, scaleY);
  const averageScale = (scaleX + scaleY) / 2;
  const fontSize = clampMin(
    scaleValue(data.fontSize ?? 24, averageScale),
    MIN_RICH_TEXT_FONT_SIZE
  );
  const letterSpacing = scaleValue(
    data.letterSpacing ?? DEFAULT_RICH_TEXT_LETTER_SPACING,
    averageScale
  );
  const height = measureRichTextHeight({
    align: data.align,
    fontFamily: data.fontFamily ?? DEFAULT_RICH_TEXT_FONT_FAMILY,
    fontSize,
    html: data.html,
    letterSpacing,
    lineHeightMultiplier: data.lineHeight,
    width: transform.width,
  });

  return {
    ...layer,
    data: { ...data, fontSize, letterSpacing },
    style: scaleLayerStyle(layer.style, scaleX, scaleY),
    transform: {
      ...transform,
      height: clampMin(height, MIN_LAYER_SIZE),
    },
  };
}

function scaleRectLayer(layer: Layer, scaleX: number, scaleY: number): Layer {
  const data = layer.data as CanvasRectData;
  const uniform = (value: number) => scaleValue(value, (scaleX + scaleY) / 2);

  return {
    ...layer,
    data: {
      ...data,
      cornerRadius: scaleCornerRadius(data.cornerRadius, (scaleX + scaleY) / 2),
      strokeWidth:
        data.strokeWidth === undefined ? undefined : uniform(data.strokeWidth),
    },
    style: scaleLayerStyle(layer.style, scaleX, scaleY),
    transform: scaleTransform(layer.transform, scaleX, scaleY),
  };
}

function scaleCircleLayer(layer: Layer, scaleX: number, scaleY: number): Layer {
  const data = layer.data as CanvasCircleData;
  const uniform = (value: number) => scaleValue(value, (scaleX + scaleY) / 2);

  return {
    ...layer,
    data: {
      ...data,
      strokeWidth:
        data.strokeWidth === undefined ? undefined : uniform(data.strokeWidth),
    },
    style: scaleLayerStyle(layer.style, scaleX, scaleY),
    transform: scaleTransform(layer.transform, scaleX, scaleY),
  };
}

function scaleContainerLayer(
  layer: Layer,
  scaleX: number,
  scaleY: number
): Layer {
  const data = layer.data as ContainerLayoutModel;
  const uniform = (value: number) => scaleValue(value, (scaleX + scaleY) / 2);

  return {
    ...layer,
    data: {
      ...data,
      gap: data.gap === undefined ? undefined : uniform(data.gap),
    },
    style: scaleLayerStyle(layer.style, scaleX, scaleY),
    transform: scaleTransform(layer.transform, scaleX, scaleY),
  };
}

function scaleLayer(layer: Layer, scaleX: number, scaleY: number): Layer {
  if (layer.type === CANVAS_TEXT_TYPE) {
    return scaleTextLayer(layer, scaleX, scaleY);
  }
  if (layer.type === CANVAS_RECT_TYPE) {
    return scaleRectLayer(layer, scaleX, scaleY);
  }
  if (layer.type === CANVAS_CIRCLE_TYPE) {
    return scaleCircleLayer(layer, scaleX, scaleY);
  }
  if (layer.type === CONTAINER_LAYER_TYPE || isContainerLayer(layer)) {
    return scaleContainerLayer(layer, scaleX, scaleY);
  }

  return {
    ...layer,
    style: scaleLayerStyle(layer.style, scaleX, scaleY),
    transform: scaleTransform(layer.transform, scaleX, scaleY),
  };
}

export function resizeAbsolutePage(
  page: Page,
  newWidth: number,
  newHeight: number,
  presetId?: string
): Page {
  const defaults = getDefaultPageDimensions();
  const oldWidth = page.width ?? defaults.width;
  const oldHeight = page.height ?? defaults.height;

  if (oldWidth === newWidth && oldHeight === newHeight) {
    return presetId ? { ...page, presetId } : page;
  }

  const scaleX = newWidth / oldWidth;
  const scaleY = newHeight / oldHeight;

  return {
    ...page,
    dpi: 96,
    height: newHeight,
    layers: mapLayers(page.layers, (layer) =>
      scaleLayer(layer, scaleX, scaleY)
    ),
    ...(presetId ? { presetId } : { presetId: undefined }),
    unit: 'px',
    width: newWidth,
  };
}
