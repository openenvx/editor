import { CANVAS_INSTANCE_LAYER_TYPE, LayerDefinition } from '@openenvx/core';
import type {
  CommandContext,
  Layer,
  LayerPreviewContext,
  Page,
  PropertySectionDescriptor,
} from '@openenvx/core';
import { createLayerPreviewBuilder } from '@xmazu/openenvxee-preview';
import { createDefaultTransform } from '@xmazu/openenvxee-schema';
import { z } from 'zod';

const canvasInstanceSchema = z.object({
  componentId: z.string(),
  overrides: z.record(z.string(), z.record(z.string(), z.unknown())).optional(),
});

export type CanvasInstanceModel = z.infer<typeof canvasInstanceSchema>;

export { CANVAS_INSTANCE_LAYER_TYPE };

export class CanvasInstanceLayer extends LayerDefinition<CanvasInstanceModel> {
  readonly type = CANVAS_INSTANCE_LAYER_TYPE;
  readonly treeIcon = 'group';
  readonly treeDisplayName = 'Component';

  validate(data: unknown): data is CanvasInstanceModel {
    return canvasInstanceSchema.safeParse(data).success;
  }

  createDefault(id: string, page: Page): Layer {
    const pageWidth = page.width ?? 800;
    const pageHeight = page.height ?? 600;
    const width = 120;
    const height = 120;

    return {
      data: { componentId: '' },
      id,
      transform: {
        ...createDefaultTransform(),
        height,
        width,
        x: (pageWidth - width) / 2,
        y: (pageHeight - height) / 2,
      },
      type: this.type,
    };
  }

  serialize(layer: Layer): CanvasInstanceModel {
    return layer.data as CanvasInstanceModel;
  }

  deserialize(data: unknown): CanvasInstanceModel {
    const parsed = canvasInstanceSchema.safeParse(data);
    return parsed.success ? parsed.data : { componentId: '' };
  }

  properties(_ctx: CommandContext, _layer: Layer): PropertySectionDescriptor[] {
    return [];
  }

  renderPreview(_ctx: LayerPreviewContext<CanvasInstanceModel>) {
    return createLayerPreviewBuilder().rect('transparent', {
      stroke: '#0ea5e9',
      strokeWidth: 1,
    });
  }
}
