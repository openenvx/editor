import { createPropertyBuilder, LayerDefinition } from '@openenvx/studio/core';
import type {
  CommandContext,
  DocumentNode,
  LayerPreviewContext,
  PropertySectionDescriptor,
} from '@openenvx/studio/core';
import { createLayerPreviewBuilder } from '@openenvx/studio/preview';
import type { Artboard } from '@openenvx/studio/schema';
import { createDefaultTransform } from '@openenvx/studio/schema';
import { z } from 'zod';

const DEFAULT_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect width="24" height="24" rx="4" fill="currentColor"/></svg>';

export const canvasSvgSchema = z.object({
  fill: z.string().optional(),
  stroke: z.string().optional(),
  svg: z.string(),
  viewBox: z.string().optional(),
});

export type CanvasSvgModel = z.infer<typeof canvasSvgSchema>;

export class CanvasSvgLayer extends LayerDefinition<CanvasSvgModel> {
  readonly type = 'canvas.svg';
  readonly treeIcon = 'image';
  readonly treeDisplayName = 'SVG';

  validate(data: unknown): data is CanvasSvgModel {
    return canvasSvgSchema.safeParse(data).success;
  }

  createDefault(id: string, _artboard: Artboard): DocumentNode {
    return {
      props: {
        fill: '#111827',
        svg: DEFAULT_SVG,
        viewBox: '0 0 24 24',
      },
      id,
      frame: { ...createDefaultTransform(), height: 96, width: 96 },
      type: this.type,
    };
  }

  serialize(node: DocumentNode): CanvasSvgModel {
    return node.props as CanvasSvgModel;
  }

  deserialize(data: unknown): CanvasSvgModel {
    const parsed = canvasSvgSchema.safeParse(data);
    return parsed.success
      ? parsed.data
      : { fill: '#111827', svg: DEFAULT_SVG, viewBox: '0 0 24 24' };
  }

  properties(
    _ctx: CommandContext,
    _node: DocumentNode
  ): PropertySectionDescriptor[] {
    return createPropertyBuilder()
      .section('svg')
      .text('svg', 'SVG markup')
      .text('viewBox', 'ViewBox')
      .color('fill', 'Fill')
      .color('stroke', 'Stroke')
      .build();
  }

  renderPreview(ctx: LayerPreviewContext<CanvasSvgModel>) {
    return createLayerPreviewBuilder().svg(ctx.model.svg, {
      fill: ctx.model.fill,
      stroke: ctx.model.stroke,
      viewBox: ctx.model.viewBox,
    });
  }
}
