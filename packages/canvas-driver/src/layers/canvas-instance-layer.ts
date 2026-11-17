import { CANVAS_INSTANCE_LAYER_TYPE, LayerDefinition } from '@openenvx/editor';
import type { DocumentNode, LayerPreviewContext } from '@openenvx/editor';
import { createLayerPreviewBuilder } from '@openenvx/editor/preview';
import type { Artboard } from '@openenvx/editor/schema';
import { artboardSpaceSize, createDefaultFrame } from '@openenvx/editor/schema';
import type {
  CommandContext,
  PropertySectionDescriptor,
} from '@openenvx/studio';
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

  createDefault(id: string, artboard: Artboard): DocumentNode {
    const { width: pageWidth, height: pageHeight } =
      artboardSpaceSize(artboard);
    const width = 120;
    const height = 120;

    return {
      props: { componentId: '' },
      id,
      frame: {
        ...createDefaultFrame(),
        height,
        width,
        x: (pageWidth - width) / 2,
        y: (pageHeight - height) / 2,
      },
      type: this.type,
    };
  }

  serialize(node: DocumentNode): CanvasInstanceModel {
    return node.props as CanvasInstanceModel;
  }

  deserialize(data: unknown): CanvasInstanceModel {
    const parsed = canvasInstanceSchema.safeParse(data);
    return parsed.success ? parsed.data : { componentId: '' };
  }

  properties(
    _ctx: CommandContext,
    _node: DocumentNode
  ): PropertySectionDescriptor[] {
    return [];
  }

  renderPreview(_ctx: LayerPreviewContext<CanvasInstanceModel>) {
    return createLayerPreviewBuilder().rect('transparent', {
      stroke: '#0ea5e9',
      strokeWidth: 1,
    });
  }
}
