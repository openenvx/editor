import {
  DEFAULT_CORNER_RADIUS,
  escapeAttr,
  escapeHtml,
  sanitizeHtml,
} from '@openenvx/core';
import type { LayerPreviewDescriptor } from '@openenvx/preview';

import type {
  PreviewKindSvgSerializer,
  PreviewKindSvgSerializerRegistry,
  SvgBounds,
  SvgSerializeContext,
} from './preview-kind-svg-serializer';

const warnedMissingKinds = new Set<string>();

function warnMissingSerializer(kind: string): void {
  if (warnedMissingKinds.has(kind)) {
    return;
  }
  warnedMissingKinds.add(kind);
  console.warn(
    `[driver-image] No SVG serializer registered for preview kind: ${kind}`
  );
}

function stripHtmlToPlainText(html: string): string {
  return html
    .replaceAll(/<br\s*\/?>/gi, '\n')
    .replaceAll(/<\/p>/gi, '\n')
    .replaceAll(/<[^>]+>/g, '')
    .replaceAll('&nbsp;', ' ')
    .trim();
}

const rectSerializer: PreviewKindSvgSerializer = {
  kind: 'rect',
  toSvgFragment(descriptor, ctx) {
    const view = descriptor as Extract<
      LayerPreviewDescriptor,
      { kind: 'rect' }
    >;
    const { bounds } = ctx;
    const corners = view.cornerRadius ?? DEFAULT_CORNER_RADIUS;
    const rx = typeof corners === 'number' ? corners : corners.topLeft;
    return `<rect x="${bounds.x}" y="${bounds.y}" width="${bounds.width}" height="${bounds.height}" fill="${escapeAttr(view.fill)}" stroke="${escapeAttr(view.stroke ?? 'none')}" stroke-width="${view.strokeWidth ?? 0}" rx="${rx}" />`;
  },
};

const ellipseSerializer: PreviewKindSvgSerializer = {
  kind: 'ellipse',
  toSvgFragment(descriptor, ctx) {
    const view = descriptor as Extract<
      LayerPreviewDescriptor,
      { kind: 'ellipse' }
    >;
    const { bounds } = ctx;
    const cx = bounds.x + bounds.width / 2;
    const cy = bounds.y + bounds.height / 2;
    const rx = bounds.width / 2;
    const ry = bounds.height / 2;
    return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${escapeAttr(view.fill)}" stroke="${escapeAttr(view.stroke ?? 'none')}" stroke-width="${view.strokeWidth ?? 0}" />`;
  },
};

const imageSerializer: PreviewKindSvgSerializer = {
  kind: 'image',
  toSvgFragment(descriptor, ctx) {
    const view = descriptor as Extract<
      LayerPreviewDescriptor,
      { kind: 'image' }
    >;
    const { bounds } = ctx;
    const href = ctx.resolveAsset(view.src);
    const preserve = resolveImagePreserveAspectRatio(view);
    return `<image href="${escapeAttr(href)}" x="${bounds.x}" y="${bounds.y}" width="${bounds.width}" height="${bounds.height}" preserveAspectRatio="${preserve}" />`;
  },
};

function resolveImagePreserveAspectRatio(
  view: Extract<LayerPreviewDescriptor, { kind: 'image' }>
): string {
  const fit = view.fit;
  if (fit !== 'cover' && fit !== 'contain' && fit !== 'fill') {
    return 'none';
  }
  if (fit === 'fill') {
    return 'none';
  }
  const focal =
    view.focalPoint &&
    typeof view.focalPoint === 'object' &&
    typeof (view.focalPoint as { x?: unknown }).x === 'number' &&
    typeof (view.focalPoint as { y?: unknown }).y === 'number'
      ? (view.focalPoint as { x: number; y: number })
      : { x: 0.5, y: 0.5 };
  const xAlign = focal.x < 0.33 ? 'xMin' : focal.x > 0.66 ? 'xMax' : 'xMid';
  const yAlign = focal.y < 0.33 ? 'YMin' : focal.y > 0.66 ? 'YMax' : 'YMid';
  const meetOrSlice = fit === 'contain' ? 'meet' : 'slice';
  return `${xAlign}${yAlign} ${meetOrSlice}`;
}

const richTextSerializer: PreviewKindSvgSerializer = {
  kind: 'richText',
  toSvgFragment(descriptor, ctx) {
    const view = descriptor as Extract<
      LayerPreviewDescriptor,
      { kind: 'richText' }
    >;
    const { bounds } = ctx;
    const fill = view.fill ?? '#111827';
    const maxFontSize = view.fontSize ?? 24;
    const fontFamily = view.fontFamily ?? 'sans-serif';
    const align = view.align ?? 'left';
    const lineHeight = view.lineHeight ?? 1.4;
    const letterSpacing = view.letterSpacing ?? 0;
    const curve = view.curve ?? 0;
    const sanitized = sanitizeHtml(view.html);
    const plain = stripHtmlToPlainText(sanitized);
    const minFontSize =
      typeof view.minFontSize === 'number' ? view.minFontSize : 8;
    const fontSize =
      view.autoFit === 'shrink' && Math.abs(curve) < 0.5
        ? fitFontSizeForExport(
            plain,
            bounds.width,
            bounds.height,
            minFontSize,
            maxFontSize,
            lineHeight
          )
        : maxFontSize;

    if (Math.abs(curve) >= 0.5) {
      const pathId = `text-curve-${Math.abs(Math.round(bounds.x * 100))}-${Math.abs(Math.round(bounds.y * 100))}-${Math.abs(Math.round(curve * 10))}`;
      const pathData = buildSvgArcPath(
        bounds.width,
        fontSize,
        curve,
        bounds.x,
        bounds.y
      );
      const anchor =
        align === 'center' ? 'middle' : align === 'right' ? 'end' : 'start';
      const startOffset =
        align === 'center' ? '50%' : align === 'right' ? '100%' : '0%';
      return `<defs><path id="${pathId}" d="${pathData}" fill="none"/></defs><text font-size="${fontSize}" font-family="${escapeAttr(fontFamily)}" fill="${escapeAttr(fill)}" letter-spacing="${letterSpacing}" text-anchor="${anchor}"><textPath href="#${pathId}" startOffset="${startOffset}">${escapeHtml(plain)}</textPath></text>`;
    }

    if (!ctx.useRichText) {
      const anchor =
        align === 'center' ? 'middle' : align === 'right' ? 'end' : 'start';
      const x =
        align === 'center'
          ? bounds.x + bounds.width / 2
          : align === 'right'
            ? bounds.x + bounds.width
            : bounds.x;
      return `<text x="${x}" y="${bounds.y + fontSize}" font-size="${fontSize}" font-family="${escapeAttr(fontFamily)}" fill="${escapeAttr(fill)}" text-anchor="${anchor}" letter-spacing="${letterSpacing}">${escapeHtml(plain)}</text>`;
    }

    const textAlign =
      align === 'center' ? 'center' : align === 'right' ? 'right' : 'left';
    const innerHtml = sanitized.replaceAll(
      '<p>',
      `<p style="margin:0;color:${escapeAttr(fill)};">`
    );

    return `<foreignObject x="${bounds.x}" y="${bounds.y}" width="${bounds.width}" height="${bounds.height}"><div xmlns="http://www.w3.org/1999/xhtml" style="width:100%;height:100%;font-size:${fontSize}px;font-family:${escapeAttr(fontFamily)};color:${escapeAttr(fill)};text-align:${textAlign};line-height:${lineHeight};letter-spacing:${letterSpacing}px;overflow:hidden;word-break:break-word;">${innerHtml}</div></foreignObject>`;
  },
};

/** Approximate shrink-to-fit for SVG export (no DOM). Matches fitFontSize contract. */
function fitFontSizeForExport(
  plain: string,
  width: number,
  height: number,
  minFontSize: number,
  maxFontSize: number,
  lineHeight: number
): number {
  const min = Math.max(1, Math.min(minFontSize, maxFontSize));
  const max = Math.max(min, maxFontSize);
  const measure = (fontSize: number) => {
    const avgCharWidth = Math.max(fontSize * 0.55, 1);
    const charsPerLine = Math.max(1, Math.floor(width / avgCharWidth));
    const lines = Math.max(
      1,
      Math.ceil(Math.max(plain.length, 1) / charsPerLine)
    );
    return lines * fontSize * lineHeight;
  };
  if (measure(max) <= height) {
    return max;
  }
  if (measure(min) > height) {
    return min;
  }
  let low = min;
  let high = max;
  let best = min;
  for (let i = 0; i < 24; i += 1) {
    const mid = (low + high) / 2;
    if (measure(mid) <= height) {
      best = mid;
      low = mid;
    } else {
      high = mid;
    }
  }
  return Math.max(min, Math.min(max, best));
}

function buildSvgArcPath(
  width: number,
  fontSize: number,
  curveDeg: number,
  offsetX: number,
  offsetY: number
): string {
  const safeWidth = Math.max(width, 1);
  const baselineY = offsetY + Math.max(fontSize, 1);
  const absCurve = Math.min(180, Math.abs(curveDeg));
  if (absCurve < 0.5) {
    return `M ${offsetX},${baselineY} L ${offsetX + safeWidth},${baselineY}`;
  }
  const theta = (absCurve * Math.PI) / 180;
  const halfWidth = safeWidth / 2;
  const radius = halfWidth / Math.sin(theta / 2);
  const sagitta = radius * (1 - Math.cos(theta / 2));
  if (curveDeg > 0) {
    return `M ${offsetX},${baselineY} A ${radius},${radius} 0 0 1 ${offsetX + safeWidth},${baselineY}`;
  }
  const yEnds = baselineY + sagitta;
  return `M ${offsetX},${yEnds} A ${radius},${radius} 0 0 0 ${offsetX + safeWidth},${yEnds}`;
}

function stackChildBounds(
  direction: 'horizontal' | 'vertical',
  parent: SvgBounds,
  index: number,
  childCount: number
): SvgBounds {
  if (direction === 'horizontal') {
    const childWidth = parent.width / childCount;
    return {
      x: index * childWidth,
      y: 0,
      width: childWidth,
      height: parent.height,
    };
  }

  const childHeight = parent.height / childCount;
  return {
    x: 0,
    y: index * childHeight,
    width: parent.width,
    height: childHeight,
  };
}

const stackSerializer: PreviewKindSvgSerializer = {
  kind: 'stack',
  toSvgFragment(descriptor, ctx) {
    const view = descriptor as Extract<
      LayerPreviewDescriptor,
      { kind: 'stack' }
    >;
    const { bounds } = ctx;
    const childCount = view.children.length;
    if (childCount === 0) {
      return '';
    }

    const children = view.children
      .map((child, index) =>
        ctx.serializeDescriptor(child, {
          ...ctx,
          bounds: stackChildBounds(view.direction, bounds, index, childCount),
        })
      )
      .filter(Boolean)
      .join('\n');

    if (!children) {
      return '';
    }

    return `<g transform="translate(${bounds.x} ${bounds.y})">${children}</g>`;
  },
};

const placeholderSerializer: PreviewKindSvgSerializer = {
  kind: 'placeholder',
  toSvgFragment(descriptor, ctx) {
    const view = descriptor as Extract<
      LayerPreviewDescriptor,
      { kind: 'placeholder' }
    >;
    const { bounds } = ctx;
    return `<text x="${bounds.x}" y="${bounds.y + 16}" font-size="14" fill="#6b7280">${escapeHtml(view.text)}</text>`;
  },
};

const builtinSerializers: PreviewKindSvgSerializer[] = [
  rectSerializer,
  ellipseSerializer,
  imageSerializer,
  richTextSerializer,
  stackSerializer,
  placeholderSerializer,
];

export function registerBuiltinSvgSerializers(
  registry: PreviewKindSvgSerializerRegistry
): void {
  for (const serializer of builtinSerializers) {
    if (!registry.get(serializer.kind)) {
      registry.register(serializer);
    }
  }
}

export function serializePreviewDescriptor(
  descriptor: LayerPreviewDescriptor,
  registry: PreviewKindSvgSerializerRegistry,
  ctx: Omit<SvgSerializeContext, 'serializeDescriptor'>
): string {
  const serializeDescriptor = (
    child: LayerPreviewDescriptor,
    childCtx: SvgSerializeContext
  ) =>
    serializePreviewDescriptor(child, registry, {
      bounds: childCtx.bounds,
      layer: childCtx.layer,
      layerRegistry: childCtx.layerRegistry,
      pageId: childCtx.pageId,
      resolveAsset: childCtx.resolveAsset,
      scene: childCtx.scene,
      useRichText: childCtx.useRichText,
    });

  const serializer = registry.get(descriptor.kind);
  if (!serializer) {
    warnMissingSerializer(descriptor.kind);
    return '';
  }

  return serializer.toSvgFragment(descriptor, {
    ...ctx,
    serializeDescriptor,
  });
}
