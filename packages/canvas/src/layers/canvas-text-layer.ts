import { createLayerPreviewBuilder } from '@openenvx/preview';
import {
  createPropertyBuilder,
  escapeHtml,
  LayerDefinition,
  sanitizeHtml,
} from '@openenvx/core';
import type {
  CommandContext,
  FontService,
  Layer,
  LayerPreviewContext,
  Page,
  PropertySectionDescriptor,
} from '@openenvx/core';
import { createDefaultTransform } from '@openenvx/schema';
import { z } from 'zod';

import { CanvasFontServiceId } from '../canvas-service-tokens';
import { CANVAS_FONT_CATALOG } from '../fonts/canvas-font-catalog';
import {
  DEFAULT_RICH_TEXT_FILL,
  DEFAULT_RICH_TEXT_FONT_FAMILY,
  DEFAULT_RICH_TEXT_FONT_SIZE,
  DEFAULT_RICH_TEXT_LETTER_SPACING,
  RICH_TEXT_LINE_HEIGHT_MULTIPLIER,
} from '../rich-text-typography';

export const canvasTextSchema = z.object({
  align: z.enum(['left', 'center', 'right']).optional(),
  fill: z.string().optional(),
  fontFamily: z.string().optional(),
  fontSize: z.number().optional(),
  html: z.string(),
  letterSpacing: z.number().optional(),
  lineHeight: z.number().optional(),
});

export type CanvasTextModel = z.infer<typeof canvasTextSchema>;

const DEFAULT_MODEL: CanvasTextModel = {
  align: 'left',
  fill: DEFAULT_RICH_TEXT_FILL,
  fontFamily: DEFAULT_RICH_TEXT_FONT_FAMILY,
  fontSize: DEFAULT_RICH_TEXT_FONT_SIZE,
  html: '<p>Text</p>',
  letterSpacing: DEFAULT_RICH_TEXT_LETTER_SPACING,
  lineHeight: RICH_TEXT_LINE_HEIGHT_MULTIPLIER,
};

function migrateLegacyTextData(data: unknown): CanvasTextModel | null {
  if (typeof data !== 'object' || data === null) {
    return null;
  }
  const record = data as Record<string, unknown>;
  if (typeof record.text === 'string' && !('html' in record)) {
    return {
      ...DEFAULT_MODEL,
      ...record,
      html: `<p>${escapeHtml(record.text)}</p>`,
    } as CanvasTextModel;
  }
  return null;
}

function buildFontOptions(
  ctx: CommandContext
): { label: string; value: string }[] {
  if (ctx.services.has(CanvasFontServiceId)) {
    return ctx.services
      .get<FontService>(CanvasFontServiceId)
      .list()
      .map((font) => ({ label: font.id, value: font.family }));
  }

  return CANVAS_FONT_CATALOG.map((font) => ({
    label: font.id,
    value: font.family,
  }));
}

export class CanvasTextLayer extends LayerDefinition<CanvasTextModel> {
  readonly type = 'canvas.text';
  readonly treeIcon = 'text';
  readonly treeDisplayName = 'Text';

  validate(data: unknown): data is CanvasTextModel {
    return (
      canvasTextSchema.safeParse(data).success ||
      migrateLegacyTextData(data) !== null
    );
  }

  createDefault(id: string, _page: Page): Layer {
    return {
      data: { ...DEFAULT_MODEL },
      id,
      transform: { ...createDefaultTransform(), height: 48, width: 240 },
      type: this.type,
    };
  }

  serialize(layer: Layer): CanvasTextModel {
    return layer.data as CanvasTextModel;
  }

  deserialize(data: unknown): CanvasTextModel {
    const migrated = migrateLegacyTextData(data);
    if (migrated) {
      return migrated;
    }
    const parsed = canvasTextSchema.safeParse(data);
    return parsed.success ? parsed.data : { ...DEFAULT_MODEL };
  }

  properties(ctx: CommandContext, _layer: Layer): PropertySectionDescriptor[] {
    const scrubPx = { scrub: true, precision: 0 };
    const scrubLineHeight = { scrub: true, precision: 1 };
    return (
      createPropertyBuilder()
        .section('text', 'Text')
        // .richText('html', 'Content')
        .number('fontSize', 'Font size')
        .font('fontFamily', buildFontOptions(ctx), 'Font')
        .color('fill', 'Fill')
        .align('align', 'Align')
        .number('lineHeight', 'Line spacing', { numeric: scrubLineHeight })
        .number('letterSpacing', 'Letter spacing', { numeric: scrubPx })
        .build()
    );
  }

  renderPreview(ctx: LayerPreviewContext<CanvasTextModel>) {
    return createLayerPreviewBuilder().richText(sanitizeHtml(ctx.model.html), {
      align: ctx.model.align,
      fill: ctx.model.fill,
      fontFamily: ctx.model.fontFamily,
      fontSize: ctx.model.fontSize,
      letterSpacing: ctx.model.letterSpacing,
      lineHeight: ctx.model.lineHeight,
    });
  }
}
