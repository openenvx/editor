import {
  CONTAINER_LAYER_TYPE,
  isContainerLayer,
  mapLayers,
  MIN_LAYER_SIZE,
} from '@openenvx/studio';
import type {
  ContainerLayoutModel,
  DocumentNode,
  Transform,
} from '@openenvx/studio';
import type { Artboard, NodeStyle } from '@openenvx/studio/schema';
import {
  applyNodeTransform,
  artboardSpaceSize,
  nodeTransform,
} from '@openenvx/studio/schema';

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
  transform: Transform,
  scaleX: number,
  scaleY: number
): Transform {
  const base = bakeTransformScale(transform);
  return {
    ...base,
    x: scaleValue(base.x, scaleX),
    y: scaleValue(base.y, scaleY),
    width: clampMin(scaleValue(base.width, scaleX), MIN_LAYER_SIZE),
    height: clampMin(scaleValue(base.height, scaleY), MIN_LAYER_SIZE),
  };
}

function scaleLayerStyle(
  style: NodeStyle | undefined,
  scaleX: number,
  scaleY: number
): NodeStyle | undefined {
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

function scaleTextLayer(
  layer: DocumentNode,
  scaleX: number,
  scaleY: number
): DocumentNode {
  const data = layer.props as unknown as CanvasTextData;
  const scaled = scaleTransform(nodeTransform(layer), scaleX, scaleY);
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
    width: scaled.width,
  });

  return applyNodeTransform(
    {
      ...layer,
      props: { ...data, fontSize, letterSpacing },
      style: scaleLayerStyle(layer.style, scaleX, scaleY),
    },
    {
      ...scaled,
      height: clampMin(height, MIN_LAYER_SIZE),
    }
  );
}

function scaleRectLayer(
  layer: DocumentNode,
  scaleX: number,
  scaleY: number
): DocumentNode {
  const data = layer.props as unknown as CanvasRectData;
  const uniform = (value: number) => scaleValue(value, (scaleX + scaleY) / 2);

  return applyNodeTransform(
    {
      ...layer,
      props: {
        ...data,
        cornerRadius: scaleCornerRadius(
          data.cornerRadius,
          (scaleX + scaleY) / 2
        ),
        strokeWidth:
          data.strokeWidth === undefined
            ? undefined
            : uniform(data.strokeWidth),
      },
      style: scaleLayerStyle(layer.style, scaleX, scaleY),
    },
    scaleTransform(nodeTransform(layer), scaleX, scaleY)
  );
}

function scaleCircleLayer(
  layer: DocumentNode,
  scaleX: number,
  scaleY: number
): DocumentNode {
  const data = layer.props as unknown as CanvasCircleData;
  const uniform = (value: number) => scaleValue(value, (scaleX + scaleY) / 2);

  return applyNodeTransform(
    {
      ...layer,
      props: {
        ...data,
        strokeWidth:
          data.strokeWidth === undefined
            ? undefined
            : uniform(data.strokeWidth),
      },
      style: scaleLayerStyle(layer.style, scaleX, scaleY),
    },
    scaleTransform(nodeTransform(layer), scaleX, scaleY)
  );
}

function scaleContainerLayer(
  layer: DocumentNode,
  scaleX: number,
  scaleY: number
): DocumentNode {
  const data = layer.props as unknown as ContainerLayoutModel;
  const uniform = (value: number) => scaleValue(value, (scaleX + scaleY) / 2);

  return applyNodeTransform(
    {
      ...layer,
      props: {
        ...data,
        gap: data.gap === undefined ? undefined : uniform(data.gap),
      },
      style: scaleLayerStyle(layer.style, scaleX, scaleY),
    },
    scaleTransform(nodeTransform(layer), scaleX, scaleY)
  );
}

function scaleLayer(
  layer: DocumentNode,
  scaleX: number,
  scaleY: number
): DocumentNode {
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

  return applyNodeTransform(
    {
      ...layer,
      style: scaleLayerStyle(layer.style, scaleX, scaleY),
    },
    scaleTransform(nodeTransform(layer), scaleX, scaleY)
  );
}

export function resizeAbsolutePage(
  artboard: Artboard,
  newWidth: number,
  newHeight: number,
  presetId?: string
): Artboard {
  const { width: oldWidth, height: oldHeight } = artboardSpaceSize(artboard);

  if (oldWidth === newWidth && oldHeight === newHeight) {
    return presetId
      ? {
          ...artboard,
          physical: { ...artboard.physical, presetId, dpi: 96, unit: 'px' },
        }
      : artboard;
  }

  const scaleX = newWidth / oldWidth;
  const scaleY = newHeight / oldHeight;

  return {
    ...artboard,
    nodes: mapLayers(artboard.nodes, (layer) =>
      scaleLayer(layer, scaleX, scaleY)
    ),
    physical: {
      ...artboard.physical,
      dpi: 96,
      presetId: presetId ?? undefined,
      unit: 'px',
    },
    space: {
      ...artboard.space,
      height: newHeight,
      width: newWidth,
    },
  };
}
