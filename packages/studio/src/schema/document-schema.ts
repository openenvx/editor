/**
 * Document format authored once in Zod v4. Single source of truth for defaults,
 * validation, and the generated JSON Schema.
 */
import { z } from 'zod';

import { clampTextCurve, MAX_TEXT_CURVE } from './types';

function build(o: typeof z.object) {
  const cornerRadius = o({
    bottomLeft: z.number(),
    bottomRight: z.number(),
    topLeft: z.number(),
    topRight: z.number(),
  });

  const padding = o({
    bottom: z.number(),
    left: z.number(),
    right: z.number(),
    top: z.number(),
  });

  const nodeShadow = o({
    blur: z.number(),
    color: z.string(),
    offsetX: z.number(),
    offsetY: z.number(),
    spread: z.number(),
  });

  const frame = o({
    height: z.number().default(100),
    rotation: z.number().default(0),
    width: z.number().default(200),
    x: z.number().default(0),
    y: z.number().default(0),
  });

  const nodeStyle = o({
    border: o({
      color: z.string(),
      width: z.number(),
    }).optional(),
    cornerRadius: cornerRadius.optional(),
    fill: z.string().optional(),
    flipH: z.boolean().optional(),
    flipV: z.boolean().optional(),
    padding: padding.optional(),
    shadow: nodeShadow.optional(),
  });

  const documentNode: z.ZodTypeAny = z.lazy(() =>
    o({
      allowedPropKeys: z.array(z.string()).optional(),
      children: z.array(documentNode).optional(),
      frame: frame.optional(),
      id: z.string(),
      locked: z.boolean().default(false),
      name: z.string().optional(),
      opacity: z.number().default(1),
      props: z.record(z.string(), z.unknown()).default({}),
      scaleX: z.number().default(1),
      scaleY: z.number().default(1),
      showInLayers: z.boolean().default(true),
      style: nodeStyle.optional(),
      type: z.string(),
      visible: z.boolean().default(true),
      writeMode: z
        .enum(['locked', 'free', 'content', 'properties'])
        .default('free'),
    })
  );

  const artboardGuide = o({
    id: z.string(),
    orientation: z.enum(['horizontal', 'vertical']),
    position: z.number(),
  });

  const artboardSpace = o({
    height: z.number().optional(),
    width: z.number().optional(),
  });

  const artboardPhysical = o({
    bleedMm: z.number().min(0).optional(),
    dpi: z.number().optional(),
    presetId: z.string().optional(),
    safeMm: z.number().min(0).optional(),
    unit: z.enum(['px', 'mm', 'in', 'cm', 'pt']).optional(),
  });

  const artboard = o({
    background: z.string().optional(),
    extensions: z.record(z.string(), z.unknown()).optional(),
    guides: z.array(artboardGuide).optional(),
    id: z.string(),
    name: z.string().default('Artboard 1'),
    nodes: z.array(documentNode).default([]),
    physical: artboardPhysical.optional(),
    space: artboardSpace.default({}),
  });

  const documentAsset = o({
    data: z.string(),
    encoding: z.literal('base64'),
    mimeType: z.string(),
  });

  const frozenNodeSnapshot = o({
    frame: frame.optional(),
    props: z.unknown().optional(),
  });

  const templatePolicy = o({
    allowArtboardResize: z.boolean().default(true),
    allowDeleteLayers: z.boolean().default(true),
    allowDuplicateLayers: z.boolean().default(true),
    allowInsertLayers: z.boolean().default(true),
    frozenNodes: z.record(z.string(), frozenNodeSnapshot).optional(),
    version: z.literal(1).default(1),
  });

  const documentComponent = o({
    id: z.string(),
    name: z.string().optional(),
    nodes: z.array(documentNode).default([]),
  });

  const templateVariable = o({
    id: z.string(),
    key: z.string().regex(/^[A-Za-z][A-Za-z0-9_]*$/, 'Invalid variable key'),
    sample: z.string().optional(),
  });

  const document = o({
    artboards: z.array(artboard).default([]),
    assets: z.record(z.string(), documentAsset).optional(),
    components: z.record(z.string(), documentComponent).optional(),
    templatePolicy: templatePolicy.optional(),
    variables: z
      .array(templateVariable)
      .optional()
      .superRefine((variables, ctx) => {
        if (!variables) {
          return;
        }
        const seen = new Set<string>();
        for (let index = 0; index < variables.length; index += 1) {
          const entry = variables[index]!;
          if (seen.has(entry.key)) {
            ctx.addIssue({
              code: 'custom',
              message: `Duplicate variable key: ${entry.key}`,
              path: [index, 'key'],
            });
          }
          seen.add(entry.key);
        }
      }),
  });

  const editorSession = o({
    activeArtboardId: z.string(),
    primaryNodeId: z.string().nullable().default(null),
    selectedNodeIds: z.array(z.string()).default([]),
  });

  const projectSnapshot = o({
    document,
    session: editorSession,
  });

  const canvasTextProps = o({
    align: z.enum(['left', 'center', 'right']).optional(),
    autoFit: z.enum(['none', 'shrink', 'hug']).optional(),
    curve: z.preprocess(
      (value) => (typeof value === 'number' ? clampTextCurve(value) : value),
      z.number().min(-MAX_TEXT_CURVE).max(MAX_TEXT_CURVE).optional()
    ),
    fill: z.string().optional(),
    fontFamily: z.string().optional(),
    fontSize: z.number().optional(),
    html: z.string().default('<p>Text</p>'),
    letterSpacing: z.number().optional(),
    lineHeight: z.number().optional(),
    minFontSize: z.number().optional(),
  });

  const leafShapes = {
    canvasTextProps,
    editorSession,
    frame,
    nodeShadow,
    padding,
    templatePolicy,
  };

  return { document, documentNode, editorSession, leafShapes, projectSnapshot };
}

const lenient = build(z.object);

export const documentSchemaLenient = lenient.document;

export const documentSchemaCanonical = build(z.strictObject as typeof z.object)
  .document as typeof documentSchemaLenient;

export const editorSessionSchemaLenient = lenient.editorSession;
export const editorSessionSchemaCanonical = build(
  z.strictObject as typeof z.object
).editorSession as typeof editorSessionSchemaLenient;

export const projectSnapshotSchemaLenient = lenient.projectSnapshot;
export const projectSnapshotSchemaCanonical = build(
  z.strictObject as typeof z.object
).projectSnapshot as typeof projectSnapshotSchemaLenient;

export const leafSchemas = {
  canvasTextProps: lenient.leafShapes.canvasTextProps,
  editorSession: lenient.leafShapes.editorSession,
  frame: lenient.leafShapes.frame,
  nodeShadow: lenient.leafShapes.nodeShadow,
  padding: lenient.leafShapes.padding,
  templatePolicy: lenient.leafShapes.templatePolicy,
};

export const frameSchema = leafSchemas.frame;
export const nodeStyleShadowSchema = leafSchemas.nodeShadow;
export const paddingSchema = leafSchemas.padding;
/** @deprecated use frameSchema */
export const transformSchema = frameSchema;
/** @deprecated use nodeStyleShadowSchema */
export const layerStyleShadowSchema = nodeStyleShadowSchema;
