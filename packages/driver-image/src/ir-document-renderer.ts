import { escapeAttr } from '@openenvx/core';
import type {
  IrRenderDiagnostic,
  IrRenderMode,
  RenderIrDocument,
  RenderIrNode,
} from '@openenvx/preview';
import {
  RENDER_IR_VERSION,
  isLayerPreviewDescriptor,
  isRasterDescriptor,
  isRawSvgDescriptor,
} from '@openenvx/preview';
import type { Layer, Scene } from '@openenvx/schema';
import { createDefaultTransform } from '@openenvx/schema';

import {
  registerBuiltinSvgSerializers,
  serializePreviewDescriptor,
} from './builtin-svg-serializers';
import type { PreviewKindSvgSerializerRegistry } from './preview-kind-svg-serializer';
import { getDefaultSerializerRegistry } from './preview-kind-svg-serializer';
import { createSceneAssetResolver } from './resolve-scene-assets';
import { wrapLayerSvg } from './svg-transform';

export interface IrDocumentRenderOptions {
  background?: string;
  scale?: number;
  mode?: IrRenderMode;
  sanitizeRawSvg?: (svg: string) => string;
  serializers?: PreviewKindSvgSerializerRegistry;
}

export interface IrDocumentRenderResult {
  svg: string;
  diagnostics: IrRenderDiagnostic[];
  widthPx: number;
  heightPx: number;
}

export class IrRenderError extends Error {
  constructor(
    readonly nodeIds: string[],
    message: string
  ) {
    super(message);
    this.name = 'IrRenderError';
  }
}

function placeholderFragment(text: string): string {
  return `<text x="0" y="16" font-size="14" fill="#ef4444">${text}</text>`;
}

function createStubLayer(node: RenderIrNode): Layer {
  return {
    data: {},
    id: node.id,
    transform: node.transform,
    type: 'render-ir.stub',
  };
}

function createStubScene(document: RenderIrDocument): Scene {
  return {
    activePageId: 'render-ir',
    pages: [
      {
        height: document.page.height,
        id: 'render-ir',
        layers: document.nodes.map(createStubLayer),
        layout: 'absolute',
        name: 'Render IR',
        width: document.page.width,
      },
    ],
    schemaVersion: 1,
    selection: {
      activePageId: 'render-ir',
      primaryLayerId: null,
      selectedLayerIds: [],
    },
    ...(document.assets ? { assets: document.assets } : {}),
  };
}

function renderRasterNode(
  node: RenderIrNode,
  resolveAsset: (ref: string) => string
): string {
  const descriptor = node.descriptor;
  if (!isRasterDescriptor(descriptor)) {
    return '';
  }

  const transform = node.transform;
  const href = resolveAsset(descriptor.assetRef);
  const body = `<image href="${escapeAttr(href)}" x="0" y="0" width="${transform.width}" height="${transform.height}" />`;
  const translated = `<g transform="translate(${transform.x} ${transform.y})">${body}</g>`;
  return wrapLayerSvg(translated, {
    ...transform,
    x: 0,
    y: 0,
  });
}

function renderRawNode(
  node: RenderIrNode,
  sanitizeRawSvg?: (svg: string) => string
): string {
  const descriptor = node.descriptor;
  if (!isRawSvgDescriptor(descriptor)) {
    return '';
  }

  const transform = node.transform;
  const sanitized = sanitizeRawSvg
    ? sanitizeRawSvg(descriptor.svg)
    : descriptor.svg;
  const translated = `<g transform="translate(${transform.x} ${transform.y})">${sanitized}</g>`;
  return wrapLayerSvg(translated, {
    ...transform,
    x: 0,
    y: 0,
  });
}

function renderDescriptorNode(
  node: RenderIrNode,
  document: RenderIrDocument,
  serializers: PreviewKindSvgSerializerRegistry,
  resolveAsset: (ref: string) => string,
  mode: IrRenderMode,
  diagnostics: IrRenderDiagnostic[]
): string {
  const transform = node.transform ?? createDefaultTransform();
  const layer = createStubLayer(node);
  const scene = createStubScene(document);
  const descriptor = node.descriptor;

  if (!isLayerPreviewDescriptor(descriptor)) {
    const message = `Unsupported descriptor kind: ${descriptor.kind}`;
    if (mode === 'strict') {
      throw new IrRenderError([node.id], message);
    }

    diagnostics.push({
      code: 'unsupported_descriptor',
      message,
      nodeId: node.id,
    });
    const placeholder = placeholderFragment(message);
    const translated = `<g transform="translate(${transform.x} ${transform.y})">${placeholder}</g>`;
    return wrapLayerSvg(translated, { ...transform, x: 0, y: 0 });
  }

  const serializer = serializers.get(descriptor.kind);

  if (!serializer) {
    const message = `Unknown preview kind: ${descriptor.kind}`;
    if (mode === 'strict') {
      throw new IrRenderError([node.id], message);
    }

    diagnostics.push({
      code: 'unknown_kind',
      message,
      nodeId: node.id,
    });
    const placeholder = placeholderFragment(message);
    const translated = `<g transform="translate(${transform.x} ${transform.y})">${placeholder}</g>`;
    return wrapLayerSvg(translated, { ...transform, x: 0, y: 0 });
  }

  try {
    const body = serializePreviewDescriptor(descriptor, serializers, {
      bounds: {
        height: transform.height,
        width: transform.width,
        x: transform.x,
        y: transform.y,
      },
      layer,
      layerRegistry: {
        get: () => {},
      } as never,
      pageId: 'render-ir',
      resolveAsset,
      scene,
      useRichText: false,
    });

    if (!body) {
      const message = `Empty SVG for preview kind: ${descriptor.kind}`;
      if (mode === 'strict') {
        throw new IrRenderError([node.id], message);
      }

      diagnostics.push({
        code: 'empty_fragment',
        message,
        nodeId: node.id,
      });
      const placeholder = placeholderFragment(message);
      const translated = `<g transform="translate(${transform.x} ${transform.y})">${placeholder}</g>`;
      return wrapLayerSvg(translated, { ...transform, x: 0, y: 0 });
    }

    return wrapLayerSvg(body, transform);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to render node';
    if (mode === 'strict') {
      throw new IrRenderError([node.id], message);
    }

    diagnostics.push({
      code: 'render_failed',
      message,
      nodeId: node.id,
    });
    const placeholder = placeholderFragment(message);
    const translated = `<g transform="translate(${transform.x} ${transform.y})">${placeholder}</g>`;
    return wrapLayerSvg(translated, { ...transform, x: 0, y: 0 });
  }
}

function renderNode(
  node: RenderIrNode,
  document: RenderIrDocument,
  serializers: PreviewKindSvgSerializerRegistry,
  resolveAsset: (ref: string) => string,
  mode: IrRenderMode,
  diagnostics: IrRenderDiagnostic[],
  sanitizeRawSvg?: (svg: string) => string
): string {
  if (isRawSvgDescriptor(node.descriptor)) {
    return renderRawNode(node, sanitizeRawSvg);
  }

  if (isRasterDescriptor(node.descriptor)) {
    return renderRasterNode(node, resolveAsset);
  }

  return renderDescriptorNode(
    node,
    document,
    serializers,
    resolveAsset,
    mode,
    diagnostics
  );
}

export function renderIrDocument(
  document: RenderIrDocument,
  options: IrDocumentRenderOptions = {}
): IrDocumentRenderResult {
  if (document.irVersion !== RENDER_IR_VERSION) {
    throw new Error(
      `Unsupported render IR version: ${document.irVersion}. Expected ${RENDER_IR_VERSION}.`
    );
  }

  const scale = options.scale ?? 1;
  const widthPx = Math.round(document.page.width * scale);
  const heightPx = Math.round(document.page.height * scale);
  const background =
    options.background ?? document.page.background ?? '#ffffff';
  const mode = options.mode ?? 'strict';
  const serializers = options.serializers ?? getDefaultSerializerRegistry();
  registerBuiltinSvgSerializers(serializers);

  const scene = createStubScene(document);
  const resolveAsset = createSceneAssetResolver(scene);
  const diagnostics: IrRenderDiagnostic[] = [];

  const bodies = document.nodes
    .map((node) =>
      renderNode(
        node,
        document,
        serializers,
        resolveAsset,
        mode,
        diagnostics,
        options.sanitizeRawSvg
      )
    )
    .filter(Boolean)
    .join('\n');

  const backgroundRect =
    background === 'transparent'
      ? ''
      : `<rect width="100%" height="100%" fill="${background}" />`;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${widthPx}" height="${heightPx}" viewBox="0 0 ${widthPx} ${heightPx}">${backgroundRect}${bodies}</svg>`;

  return {
    diagnostics,
    heightPx,
    svg,
    widthPx,
  };
}
