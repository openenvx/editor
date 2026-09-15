import { createPropertyBuilder, LayerDefinition } from '@openenvx/core';
import type {
  CommandContext,
  Layer,
  LayerPreviewContext,
  Page,
  PropertySectionDescriptor,
} from '@openenvx/core';
import { createLayerPreviewBuilder } from '@openenvx/core/preview';
import { createDefaultTransform } from '@openenvx/core/schema';
import { z } from 'zod';

export const canvasCircleSchema = z.object({
  fill: z.string(),
  stroke: z.string().optional(),
  strokeWidth: z.number().optional(),
});

export type CanvasCircleModel = z.infer<typeof canvasCircleSchema>;

export class CanvasCircleLayer extends LayerDefinition<CanvasCircleModel> {
  readonly type = 'canvas.circle';
  readonly treeIcon = 'circle';
  readonly treeDisplayName = 'Circle';

  validate(data: unknown): data is CanvasCircleModel {
    return canvasCircleSchema.safeParse(data).success;
  }

  createDefault(id: string, _page: Page): Layer {
    return {
      data: {
        fill: '#22c55e',
        stroke: '#15803d',
        strokeWidth: 2,
      },
      id,
      transform: { ...createDefaultTransform(), height: 120, width: 120 },
      type: this.type,
    };
  }

  serialize(layer: Layer): CanvasCircleModel {
    return layer.data as CanvasCircleModel;
  }

  deserialize(data: unknown): CanvasCircleModel {
    const parsed = canvasCircleSchema.safeParse(data);
    return parsed.success
      ? parsed.data
      : { fill: '#22c55e', stroke: '#15803d', strokeWidth: 2 };
  }

  properties(_ctx: CommandContext, _layer: Layer): PropertySectionDescriptor[] {
    return createPropertyBuilder()
      .section('shape')
      .color('fill', 'Fill')
      .border('strokeWidth', 'Border')
      .build();
  }

  renderPreview(ctx: LayerPreviewContext<CanvasCircleModel>) {
    return createLayerPreviewBuilder().ellipse(ctx.model.fill, {
      stroke: ctx.model.stroke,
      strokeWidth: ctx.model.strokeWidth,
    });
  }
}
