import { RENDER_IR_VERSION } from '@openenvx/preview';
import { layerStyleShadowSchema, paddingSchema } from '@openenvx/schema';
import { z } from 'zod';

export const exportFormatSchema = z.enum(['svg', 'png', 'jpg', 'pdf']);

export const exportModeSchema = z.enum(['strict', 'lenient']);

/** Render-IR transform — stricter than Scene (positive size, opacity range). */
const transformSchema = z.object({
  height: z.number().positive(),
  opacity: z.number().min(0).max(1),
  rotation: z.number(),
  scaleX: z.number().optional(),
  scaleY: z.number().optional(),
  width: z.number().positive(),
  x: z.number(),
  y: z.number(),
});

const cornerRadiusSchema = z.union([
  z.number(),
  z.object({
    bottomLeft: z.number(),
    bottomRight: z.number(),
    topLeft: z.number(),
    topRight: z.number(),
  }),
]);

const layerShadowSchema = layerStyleShadowSchema;

const rectDescriptorSchema = z.object({
  cornerRadius: cornerRadiusSchema.optional(),
  fill: z.string(),
  flipH: z.boolean().optional(),
  flipV: z.boolean().optional(),
  kind: z.literal('rect'),
  padding: paddingSchema.optional(),
  shadow: layerShadowSchema.optional(),
  stroke: z.string().optional(),
  strokeWidth: z.number().optional(),
});

const ellipseDescriptorSchema = z.object({
  fill: z.string(),
  kind: z.literal('ellipse'),
  stroke: z.string().optional(),
  strokeWidth: z.number().optional(),
});

const normalizedCropSchema = z.object({
  height: z.number().min(0).max(1),
  width: z.number().min(0).max(1),
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
});

const imageDescriptorSchema = z.object({
  alt: z.string().optional(),
  crop: normalizedCropSchema.optional(),
  kind: z.literal('image'),
  src: z.string(),
});

const richTextDescriptorSchema = z.object({
  align: z.enum(['left', 'center', 'right']).optional(),
  fill: z.string().optional(),
  fontFamily: z.string().optional(),
  fontSize: z.number().optional(),
  html: z.string(),
  kind: z.literal('richText'),
  letterSpacing: z.number().optional(),
  lineHeight: z.number().optional(),
});

const placeholderDescriptorSchema = z.object({
  kind: z.literal('placeholder'),
  text: z.string(),
});

const rawDescriptorSchema = z.object({
  kind: z.literal('raw'),
  svg: z.string().min(1),
});

const rasterDescriptorSchema = z.object({
  assetRef: z.string().min(1),
  kind: z.literal('raster'),
});

const renderIrDescriptorSchema: z.ZodType<{
  kind: string;
  [key: string]: unknown;
}> = z.lazy(() =>
  z.discriminatedUnion('kind', [
    rectDescriptorSchema,
    ellipseDescriptorSchema,
    imageDescriptorSchema,
    richTextDescriptorSchema,
    z.object({
      children: z.array(renderIrDescriptorSchema),
      direction: z.enum(['horizontal', 'vertical']),
      kind: z.literal('stack'),
    }),
    placeholderDescriptorSchema,
    rawDescriptorSchema,
    rasterDescriptorSchema,
  ])
);

const renderIrAssetSchema = z.object({
  data: z.string(),
  encoding: z.literal('base64'),
  mimeType: z.string(),
});

const renderIrPageSchema = z.object({
  background: z.string().optional(),
  dpi: z.number().positive().optional(),
  height: z.number().positive(),
  presetId: z.string().optional(),
  unit: z.enum(['px', 'mm', 'in', 'cm', 'pt']).optional(),
  width: z.number().positive(),
});

const renderIrNodeSchema = z.object({
  descriptor: renderIrDescriptorSchema,
  id: z.string().min(1),
  transform: transformSchema,
});

export const renderIrDocumentSchema = z.object({
  assets: z.record(z.string(), renderIrAssetSchema).optional(),
  irVersion: z.literal(RENDER_IR_VERSION),
  nodes: z.array(renderIrNodeSchema),
  page: renderIrPageSchema,
});

export const exportRequestSchema = z.object({
  background: z
    .union([z.literal('transparent'), z.literal('white'), z.string()])
    .optional(),
  dpi: z.number().positive().optional(),
  document: renderIrDocumentSchema,
  fileName: z.string().optional(),
  format: exportFormatSchema,
  mode: exportModeSchema.optional(),
  quality: z.number().min(0).max(1).optional(),
  scale: z.number().positive().optional(),
});

export type ExportRequest = z.infer<typeof exportRequestSchema>;
export type RenderIrDocumentInput = z.infer<typeof renderIrDocumentSchema>;
