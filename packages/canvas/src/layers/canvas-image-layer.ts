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
    return createPropertyBuilder()
      .section('image')
      .text('assetRef', 'Asset URL or ref')
      .text('alt', 'Alt text')
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
