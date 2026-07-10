import {
  createPropertyBuilder,
  DEFAULT_CORNER_RADIUS,
  LayerDefinition,
} from '@openenvx/core';
import type {
  CommandContext,
  CornerRadiusValue,
  Layer,
  LayerPreviewContext,
  Page,
  PropertySectionDescriptor,
} from '@openenvx/core';
import { createLayerPreviewBuilder } from '@openenvx/preview';
import { createDefaultTransform } from '@openenvx/schema';
import { z } from 'zod';

const cornerRadiusSchema = z.object({
  topLeft: z.number(),
  topRight: z.number(),
  bottomRight: z.number(),
  bottomLeft: z.number(),
});

export const canvasRectSchema = z.object({
  cornerRadius: cornerRadiusSchema.optional(),
  fill: z.string(),
  stroke: z.string().optional(),
  strokeWidth: z.number().optional(),
  padding: z
    .object({
      top: z.number(),
      right: z.number(),
      bottom: z.number(),
      left: z.number(),
    })
    .optional(),
  shadow: z
    .object({
      offsetX: z.number(),
      offsetY: z.number(),
      blur: z.number(),
      spread: z.number(),
      color: z.string(),
    })
    .optional(),
  flipH: z.boolean().optional(),
  flipV: z.boolean().optional(),
});

export type CanvasRectModel = z.infer<typeof canvasRectSchema>;

export class CanvasRectLayer extends LayerDefinition<CanvasRectModel> {
  readonly type = 'canvas.rect';
  readonly treeIcon = 'rect';
  readonly treeDisplayName = 'Rectangle';

  validate(data: unknown): data is CanvasRectModel {
    return canvasRectSchema.safeParse(data).success;
  }

  createDefault(id: string, _page: Page): Layer {
    return {
      data: {
        cornerRadius: {
          ...DEFAULT_CORNER_RADIUS,
          topLeft: 4,
          topRight: 4,
          bottomRight: 4,
          bottomLeft: 4,
        },
        fill: '#3b82f6',
        stroke: '#1d4ed8',
        strokeWidth: 2,
      },
      id,
      transform: { ...createDefaultTransform(), height: 120, width: 160 },
      type: this.type,
    };
  }

  serialize(layer: Layer): CanvasRectModel {
    return layer.data as CanvasRectModel;
  }

  deserialize(data: unknown): CanvasRectModel {
    const parsed = canvasRectSchema.safeParse(data);
    return parsed.success
      ? parsed.data
      : {
          cornerRadius: {
            ...DEFAULT_CORNER_RADIUS,
            topLeft: 4,
            topRight: 4,
            bottomRight: 4,
            bottomLeft: 4,
          },
          fill: '#3b82f6',
          stroke: '#1d4ed8',
          strokeWidth: 2,
        };
  }

  properties(_ctx: CommandContext, _layer: Layer): PropertySectionDescriptor[] {
    const scrub = { scrub: true, precision: 0 };
    return createPropertyBuilder()
      .section('Styles')
      .cornerRadius('cornerRadius', 'Radius')
      .withPopup(
        'boxes',
        (popup) =>
          popup
            .number('topLeft', 'Top', {
              icon: 'cornerTopLeft',
              numeric: scrub,
            })
            .number('topRight', 'Right', {
              icon: 'cornerTopRight',
              numeric: scrub,
            })
            .number('bottomRight', 'Bottom', {
              icon: 'cornerBottomRight',
              numeric: scrub,
            })
            .number('bottomLeft', 'Left', {
              icon: 'cornerBottomLeft',
              numeric: scrub,
            }),
        'Radius'
      )
      .border('strokeWidth', 'Border')
      .color('fill', 'Fill', {
        actions: [
          {
            icon: 'x',
            label: 'Clear fill',
            onClick: { type: 'setValue', key: 'fill', value: 'transparent' },
          },
        ],
      })
      .shadow('shadow', 'Shadow')
      .withPopup(
        'boxes',
        (popup) =>
          popup
            .number('offsetX', 'X', { numeric: scrub })
            .number('offsetY', 'Y', { numeric: scrub })
            .number('blur', 'Blur', { numeric: scrub })
            .number('spread', 'Spread', { numeric: scrub })
            .color('color', 'Color'),
        'Shadow'
      )
      .withActions([
        {
          icon: 'x',
          label: 'Clear shadow',
          onClick: { type: 'setValue', key: 'shadow', value: undefined },
        },
      ])
      .build();
  }

  renderPreview(ctx: LayerPreviewContext<CanvasRectModel>) {
    return createLayerPreviewBuilder().rect(ctx.model.fill, {
      cornerRadius: ctx.model.cornerRadius as CornerRadiusValue | undefined,
      flipH: ctx.model.flipH,
      flipV: ctx.model.flipV,
      padding: ctx.model.padding,
      shadow: ctx.model.shadow,
      stroke: ctx.model.stroke,
      strokeWidth: ctx.model.strokeWidth,
    });
  }
}
