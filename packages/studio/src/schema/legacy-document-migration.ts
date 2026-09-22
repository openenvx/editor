import { applyNodeTransform, defaultFrame } from './node-helpers';
import type { Document, DocumentNode, Frame, Transform } from './types';

export interface LegacyLayerInput {
  id: string;
  type: string;
  data?: Record<string, unknown>;
  props?: Record<string, unknown>;
  children?: LegacyLayerInput[];
  frame?: DocumentNode['frame'];
  transform?: Partial<Transform>;
  writeMode?: DocumentNode['writeMode'];
  locked?: boolean;
  name?: string;
  visible?: boolean;
  showInLayers?: boolean;
  opacity?: number;
  scaleX?: number;
  scaleY?: number;
}

export interface LegacyPageInput {
  id: string;
  name?: string;
  layout?: string;
  width?: number;
  height?: number;
  layers?: LegacyLayerInput[];
  nodes?: LegacyLayerInput[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function frameFromTransform(transform: Record<string, unknown>): Frame {
  const { opacity: _o, scaleX: _sx, scaleY: _sy, ...frame } = transform;
  return { ...defaultFrame(), ...(frame as unknown as Frame) };
}

export function migrateLegacyLayerInput(layer: LegacyLayerInput): DocumentNode {
  const base: DocumentNode = {
    id: layer.id,
    type: layer.type,
    locked: layer.locked ?? false,
    name: layer.name,
    opacity: layer.opacity ?? 1,
    props: {},
    scaleX: layer.scaleX ?? 1,
    scaleY: layer.scaleY ?? 1,
    showInLayers: layer.showInLayers ?? true,
    visible: layer.visible ?? true,
    writeMode: layer.writeMode ?? 'free',
    ...(layer.frame ? { frame: layer.frame } : {}),
  };

  if (layer.children !== undefined) {
    base.children = layer.children.map(migrateLegacyLayerInput);
  }
  if (layer.props) {
    base.props = { ...layer.props };
  }
  if (layer.data) {
    const { children: nested, ...rest } = layer.data;
    base.props = { ...rest, ...base.props };
    if (Array.isArray(nested) && !base.children?.length) {
      base.children = (nested as LegacyLayerInput[]).map(
        migrateLegacyLayerInput
      );
    }
  }

  if (layer.transform && typeof layer.transform === 'object') {
    const transform = {
      ...defaultFrame(),
      ...layer.transform,
      opacity: layer.transform.opacity ?? base.opacity ?? 1,
      scaleX: layer.transform.scaleX ?? base.scaleX ?? 1,
      scaleY: layer.transform.scaleY ?? base.scaleY ?? 1,
    };
    return applyNodeTransform(base, transform);
  }

  return base;
}

function migrateLegacyLayerUnknown(layer: unknown): unknown {
  if (!isRecord(layer)) {
    return layer;
  }
  const hasLegacyShape =
    layer.data !== undefined ||
    layer.transform !== undefined ||
    Array.isArray(layer.layers);
  if (!hasLegacyShape && !Array.isArray(layer.children)) {
    return layer;
  }
  const children = Array.isArray(layer.children)
    ? layer.children.map(migrateLegacyLayerUnknown)
    : undefined;
  const migrated = migrateLegacyLayerInput({
    ...(layer as unknown as LegacyLayerInput),
    children: children as LegacyLayerInput[] | undefined,
  });
  return migrated;
}

function migrateLegacyArtboardUnknown(artboard: unknown): unknown {
  if (!isRecord(artboard)) {
    return artboard;
  }
  const next = { ...artboard };
  const layerList = artboard.layers ?? artboard.nodes;
  if (Array.isArray(layerList)) {
    next.nodes = layerList.map(migrateLegacyLayerUnknown);
    delete next.layers;
  }
  return next;
}

function migrateLegacyPages(pages: unknown[]): Document['artboards'] {
  return pages.filter(isRecord).map((page) => {
    const layers = (page.layers ?? page.nodes ?? []) as LegacyLayerInput[];
    return {
      extensions: {
        layout: typeof page.layout === 'string' ? page.layout : 'flow',
      },
      id: typeof page.id === 'string' ? page.id : 'artboard-1',
      name:
        typeof page.name === 'string'
          ? page.name
          : typeof page.id === 'string'
            ? page.id
            : 'Artboard 1',
      nodes: layers.map((layer) => migrateLegacyLayerInput(layer)),
      physical: isRecord(page.physical)
        ? page.physical
        : { dpi: 96, unit: 'px' as const },
      space:
        page.width !== undefined || page.height !== undefined
          ? {
              width: typeof page.width === 'number' ? page.width : undefined,
              height: typeof page.height === 'number' ? page.height : undefined,
            }
          : isRecord(page.space)
            ? page.space
            : {},
      ...(typeof page.background === 'string'
        ? { background: page.background }
        : {}),
    };
  });
}

function artboardsHaveContent(artboards: unknown): boolean {
  if (!Array.isArray(artboards)) {
    return false;
  }
  return artboards.some((artboard) => {
    if (!isRecord(artboard)) {
      return false;
    }
    const nodes = artboard.nodes ?? artboard.layers;
    return Array.isArray(nodes) && nodes.length > 0;
  });
}

export function migrateTemplatePolicyInput(tp: unknown): unknown {
  if (!isRecord(tp)) {
    return tp;
  }
  const frozenLayers = tp.frozenLayers;
  let frozenNodes = tp.frozenNodes;
  if (!frozenNodes && isRecord(frozenLayers)) {
    frozenNodes = Object.fromEntries(
      Object.entries(frozenLayers).map(([id, snap]) => {
        if (!isRecord(snap)) {
          return [id, snap];
        }
        const props = snap.props ?? snap.data;
        const frame =
          snap.frame ??
          (isRecord(snap.transform)
            ? frameFromTransform(snap.transform)
            : undefined);
        return [
          id,
          {
            ...(props !== undefined ? { props } : {}),
            ...(frame !== undefined ? { frame } : {}),
          },
        ];
      })
    );
  }

  const { frozenLayers: _fl, allowPageResize, ...rest } = tp;
  return {
    ...rest,
    allowArtboardResize:
      typeof tp.allowArtboardResize === 'boolean'
        ? tp.allowArtboardResize
        : typeof allowPageResize === 'boolean'
          ? allowPageResize
          : true,
    ...(frozenNodes !== undefined ? { frozenNodes } : {}),
  };
}

function migrateLegacyComponents(components: unknown): unknown {
  if (!isRecord(components)) {
    return components;
  }
  return Object.fromEntries(
    Object.entries(components).map(([id, component]) => {
      if (!isRecord(component) || !Array.isArray(component.nodes)) {
        return [id, component];
      }
      return [
        id,
        {
          ...component,
          nodes: component.nodes.map(migrateLegacyLayerUnknown),
        },
      ];
    })
  );
}

/** Lift pre-Document JSON (`pages`, `layers`, `transform`, `data`, …) before Zod parse. */
export function migrateLegacyDocumentInput(input: unknown): unknown {
  if (!isRecord(input)) {
    return input;
  }

  const record = { ...input };
  const pages = record.pages;

  if (
    Array.isArray(pages) &&
    pages.length > 0 &&
    !artboardsHaveContent(record.artboards)
  ) {
    record.artboards = migrateLegacyPages(pages);
    delete record.pages;
  } else if (Array.isArray(record.artboards)) {
    record.artboards = record.artboards.map(migrateLegacyArtboardUnknown);
  }

  if (record.templatePolicy !== undefined) {
    record.templatePolicy = migrateTemplatePolicyInput(record.templatePolicy);
  }
  if (record.components !== undefined) {
    record.components = migrateLegacyComponents(record.components);
  }

  return record;
}
