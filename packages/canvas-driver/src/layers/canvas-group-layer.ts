import { LayerDefinition } from '@openenvx/studio/core';
import type {
  CommandContext,
  DocumentNode,
  LayerPreviewContext,
  PropertySectionDescriptor,
} from '@openenvx/studio/core';
import { createLayerPreviewBuilder } from '@openenvx/studio/preview';
import type { Artboard } from '@openenvx/studio/schema';
import {
  artboardSpaceSize,
  createDefaultTransform,
} from '@openenvx/studio/schema';
import { z } from 'zod';

const canvasGroupSchema = z.object({
  children: z.array(z.record(z.string(), z.unknown())).optional(),
});

export type CanvasGroupModel = z.infer<typeof canvasGroupSchema>;

export const CANVAS_GROUP_LAYER_TYPE = 'canvas.group';

export class CanvasGroupLayer extends LayerDefinition<CanvasGroupModel> {
  readonly type = CANVAS_GROUP_LAYER_TYPE;
  readonly treeIcon = 'group';
  readonly treeDisplayName = 'Group';

  validate(data: unknown): data is CanvasGroupModel {
    return canvasGroupSchema.safeParse(data).success;
  }

  createDefault(id: string, artboard: Artboard): DocumentNode {
    const { width: pageWidth, height: pageHeight } =
      artboardSpaceSize(artboard);
    const width = 200;
    const height = 200;

    return {
      children: [],
      id,
      frame: {
        ...createDefaultTransform(),
        x: (pageWidth - width) / 2,
        y: (pageHeight - height) / 2,
        width,
        height,
      },
      type: this.type,
    };
  }

  serialize(_node: DocumentNode): CanvasGroupModel {
    return {};
  }

  deserialize(data: unknown): CanvasGroupModel {
    const parsed = canvasGroupSchema.safeParse(data);
    return parsed.success ? parsed.data : {};
  }

  properties(
    _ctx: CommandContext,
    _node: DocumentNode
  ): PropertySectionDescriptor[] {
    return [];
  }

  renderPreview(_ctx: LayerPreviewContext<CanvasGroupModel>) {
    return createLayerPreviewBuilder().rect('transparent', {
      stroke: '#6366f1',
      strokeWidth: 1,
    });
  }
}
