import type { LayerPreviewDescriptor } from '@openenvx/studio/preview';
import type { Transform } from '@openenvx/studio/schema';
import Konva from 'konva';

import { DEFAULT_MIN_FONT_SIZE, fitFontSize } from '../fit-font-size';
import { computeImageFitLayout } from '../image-fit';
import { isCanvasContainerLayerType } from '../layers/is-canvas-container-layer';
import { readImageFocalPoint, readImageFit } from '../preview-image-fields';
import { parseShadowColor, parseShadowOpacity } from '../preview-shadow';
import { applyRichTextToGroup } from '../rich-text-konva-driver';
import { measureRichTextHeight } from '../rich-text-layout';
import {
  DEFAULT_RICH_TEXT_FONT_FAMILY,
  DEFAULT_RICH_TEXT_FONT_SIZE,
  DEFAULT_RICH_TEXT_LETTER_SPACING,
  RICH_TEXT_LINE_HEIGHT_MULTIPLIER,
} from '../rich-text-typography';
import {
  cornerRadiusToKonva,
  normalizeCornerRadius,
  normalizePadding,
} from '../style-utils';
import {
  prepareSvgMarkup,
  svgMarkupToDataUrl,
} from '../svg/prepare-svg-markup';
import type { ExportImageSource } from './load-export-image';

type RectView = Extract<LayerPreviewDescriptor, { kind: 'rect' }>;
type EllipseView = Extract<LayerPreviewDescriptor, { kind: 'ellipse' }>;
type ImageView = Extract<LayerPreviewDescriptor, { kind: 'image' }>;
type SvgView = Extract<LayerPreviewDescriptor, { kind: 'svg' }>;
type RichTextView = Extract<LayerPreviewDescriptor, { kind: 'richText' }>;

export type ExportImageLoader = (
  src: string
) => Promise<ExportImageSource | null>;

function resolveRichTextFontSize(
  descriptor: RichTextView,
  width: number,
  height: number
): number {
  const fontSize = descriptor.fontSize ?? DEFAULT_RICH_TEXT_FONT_SIZE;
  if (descriptor.autoFit !== 'shrink' || descriptor.curve) {
    return fontSize;
  }
  const minFontSize = descriptor.minFontSize ?? DEFAULT_MIN_FONT_SIZE;
  const fontFamily = descriptor.fontFamily ?? DEFAULT_RICH_TEXT_FONT_FAMILY;
  const align = descriptor.align ?? 'left';
  const lineHeight = descriptor.lineHeight ?? RICH_TEXT_LINE_HEIGHT_MULTIPLIER;
  const letterSpacing =
    descriptor.letterSpacing ?? DEFAULT_RICH_TEXT_LETTER_SPACING;
  return fitFontSize(
    (size) =>
      measureRichTextHeight({
        align,
        fontFamily,
        fontSize: size,
        html: descriptor.html,
        letterSpacing,
        lineHeightMultiplier: lineHeight,
        width,
      }),
    height,
    minFontSize,
    fontSize
  );
}

function drawRect(
  parent: Konva.Group,
  descriptor: RectView,
  width: number,
  height: number
): void {
  const padding = normalizePadding(descriptor.padding);
  const cornerRadius = cornerRadiusToKonva(
    normalizeCornerRadius(descriptor.cornerRadius)
  );
  const flipH = descriptor.flipH ?? false;
  const flipV = descriptor.flipV ?? false;
  const shadow = descriptor.shadow;
  const innerWidth = Math.max(0, width - padding.left - padding.right);
  const innerHeight = Math.max(0, height - padding.top - padding.bottom);
  const group = new Konva.Group({
    offsetX: flipH ? width : 0,
    offsetY: flipV ? height : 0,
    scaleX: flipH ? -1 : 1,
    scaleY: flipV ? -1 : 1,
  });
  group.add(
    new Konva.Rect({
      cornerRadius,
      fill: 'transparent',
      height,
      shadowBlur: shadow ? Math.max(0, shadow.blur + (shadow.spread ?? 0)) : 0,
      shadowColor: shadow ? parseShadowColor(shadow.color) : undefined,
      shadowOffset: shadow
        ? { x: shadow.offsetX, y: shadow.offsetY }
        : undefined,
      shadowOpacity: shadow ? parseShadowOpacity(shadow.color) : undefined,
      stroke: descriptor.stroke,
      strokeWidth: descriptor.strokeWidth ?? 0,
      width,
    })
  );
  group.add(
    new Konva.Rect({
      cornerRadius,
      fill: descriptor.fill,
      height: innerHeight,
      width: innerWidth,
      x: padding.left,
      y: padding.top,
    })
  );
  parent.add(group);
}

function drawEllipse(
  parent: Konva.Group,
  descriptor: EllipseView,
  width: number,
  height: number
): void {
  parent.add(
    new Konva.Ellipse({
      fill: descriptor.fill,
      radiusX: width / 2,
      radiusY: height / 2,
      stroke: descriptor.stroke,
      strokeWidth: descriptor.strokeWidth ?? 0,
      x: width / 2,
      y: height / 2,
    })
  );
}

async function drawImage(
  parent: Konva.Group,
  descriptor: ImageView,
  width: number,
  height: number,
  imageLoader: ExportImageLoader
): Promise<void> {
  const image = await imageLoader(descriptor.src);
  if (!image) {
    parent.add(
      new Konva.Rect({
        fill: descriptor.uploading === true ? '#e5e7eb' : '#f3f4f6',
        height,
        stroke: '#d1d5db',
        strokeWidth: 1,
        width,
      })
    );
    return;
  }
  const naturalWidth =
    'naturalWidth' in image && typeof image.naturalWidth === 'number'
      ? image.naturalWidth
      : (image as { width: number }).width;
  const naturalHeight =
    'naturalHeight' in image && typeof image.naturalHeight === 'number'
      ? image.naturalHeight
      : (image as { height: number }).height;
  const layout = computeImageFitLayout(
    { height: naturalHeight, width: naturalWidth },
    { height, width },
    readImageFit(descriptor),
    readImageFocalPoint(descriptor)
  );
  parent.add(
    new Konva.Image({
      crop: layout.crop,
      height: layout.draw.height,
      image,
      width: layout.draw.width,
      x: layout.draw.x,
      y: layout.draw.y,
    })
  );
}

async function drawSvg(
  parent: Konva.Group,
  descriptor: SvgView,
  width: number,
  height: number,
  imageLoader: ExportImageLoader
): Promise<void> {
  const src = svgMarkupToDataUrl(
    prepareSvgMarkup(descriptor.svg, {
      fill: descriptor.fill,
      stroke: descriptor.stroke,
      viewBox: descriptor.viewBox,
    })
  );
  const image = await imageLoader(src);
  if (!image) {
    parent.add(
      new Konva.Rect({
        fill: '#f3f4f6',
        height,
        stroke: '#d1d5db',
        strokeWidth: 1,
        width,
      })
    );
    return;
  }
  parent.add(
    new Konva.Image({
      height,
      image,
      width,
      x: 0,
      y: 0,
    })
  );
}

function drawRichText(
  parent: Konva.Group,
  descriptor: RichTextView,
  transform: Transform
): void {
  const fontSize = resolveRichTextFontSize(
    descriptor,
    transform.width,
    transform.height
  );
  const group = new Konva.Group();
  applyRichTextToGroup(
    group,
    {
      align: descriptor.align,
      curve: descriptor.curve,
      fill: descriptor.fill,
      fontFamily: descriptor.fontFamily,
      html: descriptor.html,
      letterSpacing: descriptor.letterSpacing,
      lineHeight: descriptor.lineHeight,
    },
    { ...transform, x: 0, y: 0, rotation: 0 },
    fontSize
  );
  parent.add(group);
}

export async function drawPreviewToKonva(
  parent: Konva.Group,
  view: LayerPreviewDescriptor,
  transform: Transform,
  imageLoader: ExportImageLoader
): Promise<void> {
  const width = transform.width;
  const height = transform.height;
  switch (view.kind) {
    case 'rect': {
      drawRect(parent, view as RectView, width, height);
      break;
    }
    case 'ellipse': {
      drawEllipse(parent, view as EllipseView, width, height);
      break;
    }
    case 'image': {
      await drawImage(parent, view as ImageView, width, height, imageLoader);
      break;
    }
    case 'svg': {
      await drawSvg(parent, view as SvgView, width, height, imageLoader);
      break;
    }
    case 'richText': {
      drawRichText(parent, view as RichTextView, transform);
      break;
    }
    default: {
      parent.add(
        new Konva.Rect({
          fill: '#f3f4f6',
          height,
          stroke: '#d1d5db',
          strokeWidth: 1,
          width,
        })
      );
      break;
    }
  }
}

export function shouldSkipLayerContent(layerType: string): boolean {
  return isCanvasContainerLayerType(layerType);
}
