import { LayerDefinition } from '@openenvx/core';
import type {
  CommandContext,
  Layer,
  LayerPreviewContext,
  Page,
  PropertySectionDescriptor,
} from '@openenvx/core';
import { createLayerPreviewBuilder } from '@openenvx/preview';
import { createDefaultTransform } from '@openenvx/schema';
import { z } from 'zod';

const canvasGroupSchema = z.object({
  children: z.array(z.record(z.string(), z.unknown())),
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

  createDefault(id: string, page: Page): Layer {
    const pageWidth = page.width ?? 800;
    const pageHeight = page.height ?? 600;
    const width = 200;
    const height = 200;

    return {
      data: { children: [] },
      id,
      transform: {
        ...createDefaultTransform(),
        x: (pageWidth - width) / 2,
        y: (pageHeight - height) / 2,
        width,
        height,
      },
      type: this.type,
    };
  }

  serialize(layer: Layer): CanvasGroupModel {
    return layer.data as CanvasGroupModel;
  }

  deserialize(data: unknown): CanvasGroupModel {
    const parsed = canvasGroupSchema.safeParse(data);
    return parsed.success ? parsed.data : { children: [] };
  }

  properties(_ctx: CommandContext, _layer: Layer): PropertySectionDescriptor[] {
    return [];
  }

  renderPreview(_ctx: LayerPreviewContext<CanvasGroupModel>) {
    return createLayerPreviewBuilder().rect('transparent', {
      stroke: '#6366f1',
      strokeWidth: 1,
    });
  }
}
