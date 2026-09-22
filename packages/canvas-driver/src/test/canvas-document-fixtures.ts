import type {
  Artboard,
  Document,
  DocumentNode,
  Transform,
} from '@openenvx/studio/schema';
import {
  migrateLegacyLayerInput,
  normalizeScene,
  withArtboardRulesLayout,
} from '@openenvx/studio/schema';

export function testTransform(partial: Partial<Transform> = {}): Transform {
  return {
    height: 100,
    opacity: 1,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
    width: 100,
    x: 0,
    y: 0,
    ...partial,
  };
}

export function testNode(
  partial: Partial<DocumentNode> & Pick<DocumentNode, 'id' | 'type'>
): DocumentNode {
  const { frame, opacity, scaleX, scaleY, ...rest } = partial;
  const transform = testTransform({
    ...frame,
    opacity: opacity ?? 1,
    scaleX,
    scaleY,
  });
  const { opacity: o, scaleX: sx, scaleY: sy, ...frameOnly } = transform;
  return {
    ...rest,
    frame: frameOnly,
    opacity: o,
    scaleX: sx,
    scaleY: sy,
  };
}

export function testArtboard(
  partial: Partial<Artboard> & Pick<Artboard, 'id'>,
  layout = 'absolute'
): Artboard {
  return withArtboardRulesLayout(
    {
      name: 'Page',
      space: { height: 600, width: 800 },
      ...partial,
      nodes: partial.nodes ?? [],
    },
    layout
  );
}

export function testDocument(
  artboards: Artboard[],
  extras: Omit<Partial<Document>, 'artboards'> = {}
): Document {
  return normalizeScene({ artboards, ...extras });
}

/** Build a document node from legacy test literals (`data` / `transform`). */
export function legacyLayer(input: {
  id: string;
  type: string;
  name?: string;
  data?: Record<string, unknown>;
  transform?: Partial<Transform>;
  children?: DocumentNode[];
  visible?: boolean;
}): DocumentNode {
  return migrateLegacyLayerInput({
    children: input.children,
    data: input.data,
    id: input.id,
    name: input.name,
    transform: input.transform,
    type: input.type,
    visible: input.visible,
  });
}

export function legacyArtboard(input: {
  id: string;
  name?: string;
  layout?: string;
  width?: number;
  height?: number;
  background?: string;
  presetId?: string;
  bleedMm?: number;
  safeMm?: number;
  layers?: ReturnType<typeof legacyLayer>[];
  nodes?: DocumentNode[];
}): Artboard {
  const {
    layout = 'absolute',
    width = 800,
    height = 600,
    layers,
    nodes,
    presetId,
    bleedMm,
    safeMm,
    ...rest
  } = input;
  return testArtboard(
    {
      ...rest,
      background: input.background,
      nodes: nodes ?? layers ?? [],
      physical: {
        bleedMm,
        presetId,
        safeMm,
        dpi: 96,
        unit: 'px',
      },
      space: { width, height },
    },
    layout
  );
}
