import { createPropertyBuilder, LayerDefinition } from '@openenvx/core';
import type {
  CommandContext,
  Layer,
  LayerPreviewContext,
  Page,
  PropertySectionDescriptor,
} from '@openenvx/core';
import {
  createLayerPreviewBuilder,
  encodeQrToSvg,
} from '@xmazu/openenvxee-preview';
import { createDefaultTransform } from '@xmazu/openenvxee-schema';
import { z } from 'zod';

export const canvasQrSchema = z.object({
  background: z.string().optional(),
  errorCorrection: z.enum(['L', 'M', 'Q', 'H']).optional(),
  foreground: z.string().optional(),
  margin: z.number().optional(),
  url: z.string(),
});

export type CanvasQrModel = z.infer<typeof canvasQrSchema>;

const DEFAULT_URL = 'https://example.com';

export class CanvasQrLayer extends LayerDefinition<CanvasQrModel> {
  readonly type = 'canvas.qr';
  readonly treeIcon = 'qr-code';
  readonly treeDisplayName = 'QR code';

  validate(data: unknown): data is CanvasQrModel {
    return canvasQrSchema.safeParse(data).success;
  }

  createDefault(id: string, _page: Page): Layer {
    return {
      data: {
        background: '#ffffff',
        errorCorrection: 'M',
        foreground: '#000000',
        margin: 1,
        url: DEFAULT_URL,
      },
      id,
      name: 'qr',
      transform: { ...createDefaultTransform(), height: 200, width: 200 },
      type: this.type,
    };
  }

  serialize(layer: Layer): CanvasQrModel {
    return layer.data as CanvasQrModel;
  }

  deserialize(data: unknown): CanvasQrModel {
    const parsed = canvasQrSchema.safeParse(data);
    return parsed.success
      ? parsed.data
      : {
          background: '#ffffff',
          errorCorrection: 'M',
          foreground: '#000000',
          margin: 1,
          url: DEFAULT_URL,
        };
  }

  properties(_ctx: CommandContext, _layer: Layer): PropertySectionDescriptor[] {
    return createPropertyBuilder()
      .section('qr')
      .text('url', 'URL / payload')
      .color('foreground', 'Foreground')
      .color('background', 'Background')
      .select(
        'errorCorrection',
        [
          { label: 'L (~7%)', value: 'L' },
          { label: 'M (~15%)', value: 'M' },
          { label: 'Q (~25%)', value: 'Q' },
          { label: 'H (~30%)', value: 'H' },
        ],
        'Error correction'
      )
      .number('margin', 'Quiet zone')
      .build();
  }

  renderPreview(ctx: LayerPreviewContext<CanvasQrModel>) {
    const svg = encodeQrToSvg(ctx.model.url, {
      background: ctx.model.background,
      errorCorrection: ctx.model.errorCorrection,
      foreground: ctx.model.foreground,
      margin: ctx.model.margin,
    });
    return createLayerPreviewBuilder().svg(svg);
  }
}
