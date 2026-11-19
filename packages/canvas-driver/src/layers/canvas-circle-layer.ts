import { LayerDefinition } from '@openenvx/editor';
import type { DocumentNode, LayerPreviewContext } from '@openenvx/editor';
import { createLayerPreviewBuilder } from '@openenvx/editor/preview';
import type { Artboard } from '@openenvx/editor/schema';
import { createDefaultFrame } from '@openenvx/editor/schema';
import { createPropertyBuilder } from '@openenvx/studio';
import type {
  CommandContext,
  PropertySectionDescriptor,
} from '@openenvx/studio';
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

  createDefault(id: string, _artboard: Artboard): DocumentNode {
    return {
      props: {
        fill: '#22c55e',
        stroke: '#15803d',
        strokeWidth: 2,
      },
      id,
      frame: { ...createDefaultFrame(), height: 120, width: 120 },
      type: this.type,
    };
  }

  serialize(node: DocumentNode): CanvasCircleModel {
    return node.props as CanvasCircleModel;
  }

  deserialize(data: unknown): CanvasCircleModel {
    const parsed = canvasCircleSchema.safeParse(data);
    return parsed.success
      ? parsed.data
      : { fill: '#22c55e', stroke: '#15803d', strokeWidth: 2 };
  }

  properties(
    _ctx: CommandContext,
    _node: DocumentNode
  ): PropertySectionDescriptor[] {
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
