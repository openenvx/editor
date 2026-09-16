/**
 * Scene format authored once in Zod v4. SINGLE source of truth for defaults,
 * validation, and the generated JSON Schema. TypeScript recursive types live
 * in `./types` (Zod cannot cleanly infer the recursive group type).
 *
 * Built by `build(o)` so lenient (`z.object`) and canonical (`z.strictObject`)
 * variants differ all the way down.
 */
import { z } from 'zod';

import {
  BUILTIN_LAYER_TYPES,
  clampTextCurve,
  MAX_TEXT_CURVE,
  SCHEMA_VERSION,
} from './types';

function build(o: typeof z.object) {
  const cornerRadius = o({
    bottomLeft: z.number().describe('Bottom-left corner radius in pixels.'),
    bottomRight: z.number().describe('Bottom-right corner radius in pixels.'),
    topLeft: z.number().describe('Top-left corner radius in pixels.'),
    topRight: z.number().describe('Top-right corner radius in pixels.'),
  });

  const padding = o({
    bottom: z.number().describe('Bottom padding in pixels.'),
    left: z.number().describe('Left padding in pixels.'),
    right: z.number().describe('Right padding in pixels.'),
    top: z.number().describe('Top padding in pixels.'),
  });

  const layerShadow = o({
    blur: z.number().describe('Shadow blur radius in pixels.'),
    color: z.string().describe('Shadow color.'),
    offsetX: z.number().describe('Shadow horizontal offset in pixels.'),
    offsetY: z.number().describe('Shadow vertical offset in pixels.'),
    spread: z.number().describe('Shadow spread in pixels.'),
  });

  const transform = o({
    height: z.number().default(100).describe('Height in pixels.'),
    opacity: z.number().default(1).describe('Opacity (0-1).'),
    rotation: z.number().default(0).describe('Rotation in degrees.'),
    scaleX: z.number().default(1).describe('Horizontal scale.'),
    scaleY: z.number().default(1).describe('Vertical scale.'),
    width: z.number().default(200).describe('Width in pixels.'),
    x: z.number().default(0).describe('X position in pixels.'),
    y: z.number().default(0).describe('Y position in pixels.'),
  });

  const layerStyle = o({
    border: o({
      color: z.string().describe('Border color.'),
      width: z.number().describe('Border width in pixels.'),
    })
      .optional()
      .describe('Layer border.'),
    cornerRadius: cornerRadius.optional().describe('Per-corner radius.'),
    fill: z.string().optional().describe('Fill color.'),
    flipH: z.boolean().optional().describe('Horizontal flip.'),
    flipV: z.boolean().optional().describe('Vertical flip.'),
    padding: padding.optional().describe('Inner padding.'),
    shadow: layerShadow.optional().describe('Drop shadow.'),
  });

  const layerBase = {
    id: z.string().describe('Unique layer identifier.'),
    locked: z.boolean().default(false).describe('Whether the layer is locked.'),
    name: z
      .string()
      .optional()
      .describe('Optional display name; falls back to the layer type label.'),
    style: layerStyle.optional().describe('Visual style overrides.'),
    transform: transform.optional().describe('Absolute transform box.'),
    visible: z
      .boolean()
      .default(true)
      .describe('Whether the layer is visible on canvas and in export.'),
    writeMode: z
      .enum(['locked', 'free', 'content', 'properties'])
      .default('free')
      .describe('Template write permission mode.'),
    showInLayers: z
      .boolean()
      .default(true)
      .describe(
        'When false, embed consumers hide the layer from the Layers tree and block canvas selection; still renders/exports.'
      ),
    allowedDataKeys: z
      .array(z.string())
      .optional()
      .describe(
        'When writeMode is content, optional allowlist of editable data keys.'
      ),
  };

  const canvasRectData = o({
    cornerRadius: cornerRadius.optional(),
    fill: z.string().default('#3b82f6').describe('Fill color.'),
    flipH: z.boolean().optional(),
    flipV: z.boolean().optional(),
    padding: padding.optional(),
    shadow: layerShadow.optional(),
    stroke: z.string().optional().describe('Stroke color.'),
    strokeWidth: z.number().optional().describe('Stroke width in pixels.'),
  });

  const focalPoint = o({
    x: z
      .number()
      .min(0)
      .max(1)
      .default(0.5)
      .describe('Horizontal focus in the source image (0–1).'),
    y: z
      .number()
      .min(0)
      .max(1)
      .default(0.5)
      .describe('Vertical focus in the source image (0–1).'),
  });

  const canvasImageData = o({
    alt: z.string().optional().describe('Alt text.'),
    assetRef: z.string().describe('Asset URL or scene asset id.'),
    fit: z
      .enum(['cover', 'contain', 'fill'])
      .optional()
      .describe(
        'How the image fills its box. Absent = legacy stretch (fill). Prefer cover for templates.'
      ),
    focalPoint: focalPoint
      .optional()
      .describe('Focus used when fit is cover (defaults to center).'),
  }).passthrough();

  const canvasSvgData = o({
    fill: z.string().optional().describe('Optional tint for monochrome icons.'),
    stroke: z.string().optional().describe('Optional stroke tint.'),
    svg: z
      .string()
      .describe('SVG markup (full <svg> document or inner markup).'),
    viewBox: z
      .string()
      .optional()
      .describe('Optional viewBox; parsed from svg root when absent.'),
  });

  const canvasQrData = o({
    background: z
      .string()
      .optional()
      .describe('QR background / quiet-zone color.'),
    errorCorrection: z
      .enum(['L', 'M', 'Q', 'H'])
      .optional()
      .describe('QR error correction level.'),
    foreground: z.string().optional().describe('QR module color.'),
    margin: z
      .number()
      .optional()
      .describe('Quiet-zone modules around the code.'),
    url: z.string().describe('Payload encoded into the QR (usually a URL).'),
  });

  const canvasTextData = o({
    align: z.enum(['left', 'center', 'right']).optional(),
    autoFit: z
      .enum(['none', 'shrink'])
      .optional()
      .describe(
        'When shrink, font size scales down so text stays inside the fixed box.'
      ),
    curve: z.preprocess(
      (value) => (typeof value === 'number' ? clampTextCurve(value) : value),
      z
        .number()
        .min(-MAX_TEXT_CURVE)
        .max(MAX_TEXT_CURVE)
        .optional()
        .describe(
          `Curve amount (−${MAX_TEXT_CURVE}…${MAX_TEXT_CURVE}); 0 = straight, positive = arch (sides down), negative = bowl (center down). Out-of-range values clamp on normalize.`
        )
    ),
    fill: z.string().optional(),
    fontFamily: z.string().optional(),
    fontSize: z.number().optional(),
    html: z.string().default('<p>Text</p>').describe('Rich text HTML.'),
    letterSpacing: z.number().optional(),
    lineHeight: z.number().optional(),
    minFontSize: z
      .number()
      .optional()
      .describe('Minimum font size for shrink-to-fit. Defaults to 8.'),
  });

  const canvasCircleData = o({
    fill: z.string().default('#22c55e').describe('Fill color.'),
    stroke: z.string().optional(),
    strokeWidth: z.number().optional(),
  });

  const layer: z.ZodTypeAny = z.lazy(() =>
    z.union([
      o({
        ...layerBase,
        data: canvasRectData,
        type: z.literal('canvas.rect'),
      }),
      o({
        ...layerBase,
        data: canvasImageData,
        type: z.literal('canvas.image'),
      }),
      o({
        ...layerBase,
        data: canvasSvgData,
        type: z.literal('canvas.svg'),
      }),
      o({
        ...layerBase,
        data: canvasQrData,
        type: z.literal('canvas.qr'),
      }),
      o({
        ...layerBase,
        data: canvasTextData,
        type: z.literal('canvas.text'),
      }),
      o({
        ...layerBase,
        data: canvasCircleData,
        type: z.literal('canvas.circle'),
      }),
      o({
        ...layerBase,
        data: o({
          children: z
            .array(layer)
            .default([])
            .describe('Child layers in this group.'),
        }),
        type: z.literal('canvas.group'),
      }),
      o({
        ...layerBase,
        data: o({
          componentId: z.string().describe('Id of scene.components entry.'),
          overrides: z
            .record(z.string(), z.record(z.string(), z.unknown()))
            .optional()
            .describe('Optional data overrides keyed by definition layer id.'),
        }),
        type: z.literal('canvas.instance'),
      }),
      o({
        ...layerBase,
        data: o({
          extensionId: z
            .string()
            .min(1)
            .describe('Sandbox extension id (kind: widget).'),
          values: z
            .record(z.string(), z.unknown())
            .default({})
            .describe('Widget synced values / property bag.'),
          manifest: o({
            id: z.string().min(1),
            label: z.string().min(1),
            icon: z.string().optional(),
            kinds: z.array(z.enum(['canvas', 'html'])).min(1),
            fields: z.record(z.string(), z.unknown()),
            defaults: z.record(z.string(), z.unknown()).optional(),
          })
            .optional()
            .describe('Persisted manifest for Inspector without the source.'),
          children: z
            .array(layer)
            .default([])
            .describe('Last rendered face (hidden/locked child layers).'),
          handlers: z
            .record(z.string(), z.record(z.string(), z.string()))
            .optional()
            .describe(
              'Face event map: child layer id → event name → handler id.'
            ),
          label: z.string().optional(),
        }),
        type: z.literal('openenvx.widget'),
      }),
      // Plugin escape hatch - must be last; builtin type strings are excluded
      // so invalid builtin payloads cannot fall through to this branch.
      o({
        ...layerBase,
        data: z.unknown().default({}),
        type: z
          .string()
          .refine(
            (type) =>
              !BUILTIN_LAYER_TYPES.includes(
                type as (typeof BUILTIN_LAYER_TYPES)[number]
              ),
            { message: 'Reserved builtin layer type' }
          )
          .describe('Plugin layer type identifier.'),
      }),
    ])
  );

  const pageGuide = o({
    id: z.string().describe('Unique guide identifier.'),
    orientation: z
      .enum(['horizontal', 'vertical'])
      .describe('Guide axis orientation.'),
    position: z
      .number()
      .describe('Position in artboard pixels (x vertical, y horizontal).'),
  });

  const page = o({
    backgroundColor: z
      .string()
      .optional()
      .describe('Artboard background for export.'),
    dpi: z.number().optional().describe('Dots per inch for print.'),
    guides: z
      .array(pageGuide)
      .optional()
      .describe('User-placed ruler guides in artboard pixels.'),
    height: z.number().optional().describe('Page height in page units.'),
    id: z.string().describe('Unique page identifier.'),
    layers: z
      .array(layer)
      .default([])
      .describe('Top-level layers on the page.'),
    layout: z
      .string()
      .default('flow')
      .describe('Provider-defined page layout / editor-pane kind.'),
    name: z.string().default('Page 1').describe('Display name.'),
    bleedMm: z
      .number()
      .min(0)
      .optional()
      .describe('Bleed outside trim, in millimetres.'),
    presetId: z.string().optional().describe('ISO page size preset id.'),
    safeMm: z
      .number()
      .min(0)
      .optional()
      .describe('Safe/content inset inside trim, in millimetres.'),
    unit: z
      .enum(['px', 'mm', 'in', 'cm', 'pt'])
      .default('px')
      .describe('Length unit for page dimensions.'),
    width: z.number().optional().describe('Page width in page units.'),
  });

  const sceneAsset = o({
    data: z.string().describe('Base64-encoded asset bytes.'),
    encoding: z.literal('base64'),
    mimeType: z.string().describe('MIME type of the asset.'),
  });

  const frozenLayerSnapshot = o({
    data: z.unknown().optional(),
    transform: transform.optional(),
  });

  const templatePolicy = o({
    allowDeleteLayers: z.boolean().default(true),
    allowDuplicateLayers: z.boolean().default(true),
    allowInsertLayers: z.boolean().default(true),
    allowPageResize: z.boolean().default(true),
    frozenLayers: z
      .record(z.string(), frozenLayerSnapshot)
      .optional()
      .describe('Frozen layer snapshots keyed by layer id.'),
    version: z.literal(1).default(1),
  });

  const sceneComponent = o({
    id: z.string().describe('Component id.'),
    layers: z
      .array(layer)
      .default([])
      .describe('Definition layers relative to instance transform.'),
    name: z.string().optional().describe('Display name.'),
  });

  const templateVariable = o({
    id: z.string().describe('Stable variable id.'),
    key: z
      .string()
      .regex(/^[A-Za-z][A-Za-z0-9_]*$/, 'Invalid variable key')
      .describe('Token key used in {{{key}}} syntax.'),
    label: z
      .string()
      .optional()
      .describe('Display label in the variables panel.'),
    sample: z
      .string()
      .optional()
      .describe('Sample value for editor preview and defaults.'),
  });

  const scene = o({
    assets: z
      .record(z.string(), sceneAsset)
      .optional()
      .describe('Inline assets keyed by id.'),
    components: z
      .record(z.string(), sceneComponent)
      .optional()
      .describe('Reusable component definitions for canvas.instance layers.'),
    pages: z
      .array(page)
      .default([])
      .describe('Pages in the scene (at least one after normalize).'),
    schemaVersion: z
      .number()
      .default(SCHEMA_VERSION)
      .refine((version) => version <= SCHEMA_VERSION, {
        message: `Unsupported schemaVersion (max ${SCHEMA_VERSION})`,
      })
      .describe('Schema version for compatibility.'),
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
      })
      .describe('Template variable catalog for inline {{{key}}} tokens.'),
  });

  const editorState = o({
    activePageId: z.string().describe('Focused page id.'),
    primaryLayerId: z
      .string()
      .nullable()
      .default(null)
      .describe('Primary selected layer id, or null.'),
    selectedLayerIds: z
      .array(z.string())
      .default([])
      .describe('Selected layer ids on the active page.'),
  });

  const sceneSnapshot = o({
    editorState,
    scene,
  });

  const leafShapes = {
    canvasCircleData,
    canvasImageData,
    canvasQrData,
    canvasRectData,
    canvasSvgData,
    canvasTextData,
    editorState,
    layerShadow,
    padding,
    templatePolicy,
    transform,
  };

  return { editorState, leafShapes, scene, sceneSnapshot, transform };
}

const lenient = build(z.object);

/** Non-strict: strips unknown keys, fills defaults. Used by normalizeScene. */
export const sceneSchemaLenient = lenient.scene;

/**
 * Strict: rejects unknown keys at every level.
 * Cast keeps lenient leaf types as the inferred parse shape.
 */
export const sceneSchemaCanonical = build(z.strictObject as typeof z.object)
  .scene as typeof sceneSchemaLenient;

export const editorStateSchemaLenient = lenient.editorState;
export const editorStateSchemaCanonical = build(
  z.strictObject as typeof z.object
).editorState as typeof editorStateSchemaLenient;

export const sceneSnapshotSchemaLenient = lenient.sceneSnapshot;
export const sceneSnapshotSchemaCanonical = build(
  z.strictObject as typeof z.object
).sceneSnapshot as typeof sceneSnapshotSchemaLenient;

/** Lenient leaf schemas for compile-time type-drift guards. */
export const leafSchemas = {
  canvasCircleData: lenient.leafShapes.canvasCircleData,
  canvasImageData: lenient.leafShapes.canvasImageData,
  canvasQrData: lenient.leafShapes.canvasQrData,
  canvasRectData: lenient.leafShapes.canvasRectData,
  canvasSvgData: lenient.leafShapes.canvasSvgData,
  canvasTextData: lenient.leafShapes.canvasTextData,
  editorState: lenient.leafShapes.editorState,
  layerShadow: lenient.leafShapes.layerShadow,
  padding: lenient.leafShapes.padding,
  templatePolicy: lenient.leafShapes.templatePolicy,
  transform: lenient.leafShapes.transform,
};

export const transformSchema = leafSchemas.transform;
export const layerStyleShadowSchema = leafSchemas.layerShadow;
export const paddingSchema = leafSchemas.padding;
