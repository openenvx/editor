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
    return `<image href="${escapeAttr(href)}" x="${bounds.x}" y="${bounds.y}" width="${bounds.width}" height="${bounds.height}" />`;
  },
};

const richTextSerializer: PreviewKindSvgSerializer = {
  kind: 'richText',
  toSvgFragment(descriptor, ctx) {
    const view = descriptor as Extract<
      LayerPreviewDescriptor,
      { kind: 'richText' }
    >;
    const { bounds } = ctx;
    const fill = view.fill ?? '#111827';
    const fontSize = view.fontSize ?? 24;
    const fontFamily = view.fontFamily ?? 'sans-serif';
    const align = view.align ?? 'left';
    const lineHeight = view.lineHeight ?? 1.4;
    const letterSpacing = view.letterSpacing ?? 0;
    const sanitized = sanitizeHtml(view.html);

    if (!ctx.useRichText) {
      const plain = stripHtmlToPlainText(sanitized);
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
