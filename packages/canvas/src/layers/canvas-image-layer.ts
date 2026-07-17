import { createPropertyBuilder, LayerDefinition } from '@openenvx/core';
import type {
  CommandContext,
  Layer,
  LayerPreviewContext,
  Page,
  PropertySectionDescriptor,
} from '@openenvx/core';
import { createDefaultTransform } from '@openenvx/schema';
import { z } from 'zod';

export const canvasImageSchema = z
  .object({
    alt: z.string().optional(),
    assetRef: z.string(),
    fit: z.enum(['cover', 'contain', 'fill']).optional(),
    focalPoint: z
      .object({
        x: z.number(),
        y: z.number(),
      })
      .optional(),
  })
  .passthrough();

export type CanvasImageModel = z.infer<typeof canvasImageSchema>;

export class CanvasImageLayer extends LayerDefinition<CanvasImageModel> {
  readonly type = 'canvas.image';
  readonly treeIcon = 'image';
  readonly treeDisplayName = 'Image';

  validate(data: unknown): data is CanvasImageModel {
    return canvasImageSchema.safeParse(data).success;
  }

  createDefault(id: string, _page: Page): Layer {
    return {
      data: {
        alt: 'Image',
        assetRef: 'https://placehold.co/400x300',
        fit: 'cover',
        focalPoint: { x: 0.5, y: 0.5 },
      },
      id,
      transform: { ...createDefaultTransform(), height: 240, width: 320 },
      type: this.type,
    };
  }

  serialize(layer: Layer): CanvasImageModel {
    return layer.data as CanvasImageModel;
  }

  deserialize(data: unknown): CanvasImageModel {
    const parsed = canvasImageSchema.safeParse(data);
    return parsed.success
      ? parsed.data
      : { alt: 'Image', assetRef: 'https://placehold.co/400x300' };
  }

  properties(_ctx: CommandContext, _layer: Layer): PropertySectionDescriptor[] {
    const scrub = { scrub: true, precision: 2 };
    return createPropertyBuilder()
      .section('image')
      .text('assetRef', 'Asset URL or ref')
      .text('alt', 'Alt text')
      .select(
        'fit',
        [
          { label: 'Cover', value: 'cover' },
          { label: 'Contain', value: 'contain' },
          { label: 'Fill', value: 'fill' },
        ],
        'Fit'
      )
      .field({
        key: 'focalPoint',
        kind: 'text',
        label: 'Focal point',
      })
      .withPopup(
        'circle',
        (popup) =>
          popup
            .number('x', 'X', { numeric: scrub })
            .number('y', 'Y', { numeric: scrub }),
        'Focal point'
      )
      .build();
  }

  renderPreview(ctx: LayerPreviewContext<CanvasImageModel>) {
    const { assetRef, alt, ...rest } = ctx.model;
    return {
      ...rest,
      alt: alt ?? 'Image',
      kind: 'image' as const,
      src: assetRef,
    };
  }
}
