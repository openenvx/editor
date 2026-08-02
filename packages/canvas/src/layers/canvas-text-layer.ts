import {
  FontServiceId,
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
import { createLayerPreviewBuilder } from '@openenvx/preview';
import {
  clampTextCurve,
  createDefaultTransform,
  MAX_TEXT_CURVE,
} from '@openenvx/schema';
import { z } from 'zod';

import { fitCanvasTextLayerToContent } from '../fit-text-layer-to-content';
import {
  createSeedFontCatalog,
  toFontDescriptor,
} from '../fonts/canvas-font-catalog';
import {
  DEFAULT_RICH_TEXT_FILL,
  DEFAULT_RICH_TEXT_FONT_FAMILY,
  DEFAULT_RICH_TEXT_FONT_SIZE,
  DEFAULT_RICH_TEXT_LETTER_SPACING,
  RICH_TEXT_LINE_HEIGHT_MULTIPLIER,
} from '../rich-text-typography';

export const canvasTextSchema = z.object({
  align: z.enum(['left', 'center', 'right']).optional(),
  autoFit: z.enum(['none', 'shrink']).optional(),
  curve: z.preprocess(
    (value) => (typeof value === 'number' ? clampTextCurve(value) : value),
    z.number().min(-MAX_TEXT_CURVE).max(MAX_TEXT_CURVE).optional()
  ),
  fill: z.string().optional(),
  fontFamily: z.string().optional(),
  fontSize: z.number().optional(),
  html: z.string(),
  letterSpacing: z.number().optional(),
  lineHeight: z.number().optional(),
  minFontSize: z.number().optional(),
});

export type CanvasTextModel = z.infer<typeof canvasTextSchema>;

const DEFAULT_MODEL: CanvasTextModel = {
  align: 'left',
  autoFit: 'none',
  curve: 0,
  fill: DEFAULT_RICH_TEXT_FILL,
  fontFamily: DEFAULT_RICH_TEXT_FONT_FAMILY,
  fontSize: DEFAULT_RICH_TEXT_FONT_SIZE,
  html: '<p>Text</p>',
  letterSpacing: DEFAULT_RICH_TEXT_LETTER_SPACING,
  lineHeight: RICH_TEXT_LINE_HEIGHT_MULTIPLIER,
  minFontSize: 8,
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

function toFontOptions(
  fonts: { id: string; family: string }[]
): { label: string; value: string }[] {
  return fonts.map((font) => ({ label: font.id, value: font.family }));
}

function buildFontOptions(ctx: CommandContext): {
  options: { label: string; value: string }[];
} {
  if (ctx.services.has(FontServiceId)) {
    const service = ctx.services.get<FontService>(FontServiceId);
    return {
      options: toFontOptions(service.list()),
    };
  }

  return {
    options: toFontOptions(createSeedFontCatalog().map(toFontDescriptor)),
  };
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
    return fitCanvasTextLayerToContent(
      {
        data: { ...DEFAULT_MODEL },
        id,
        transform: { ...createDefaultTransform(), height: 48, width: 240 },
        type: this.type,
      },
      { mode: 'box' }
    );
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
    const scrubCurve = {
      scrub: true,
      precision: 0,
      min: -MAX_TEXT_CURVE,
      max: MAX_TEXT_CURVE,
    };
    const fontOptions = buildFontOptions(ctx);
    return (
      createPropertyBuilder()
        .section('text', 'Text')
        // .richText('html', 'Content')
        .number('fontSize', 'Font size', { numeric: scrubPx })
        .font('fontFamily', fontOptions.options, 'Font')
        .color('fill', 'Fill')
        .align('align', 'Align')
        .number('lineHeight', 'Line spacing', { numeric: scrubLineHeight })
        .number('letterSpacing', 'Letter spacing', { numeric: scrubPx })
        .number('curve', 'Curve', { numeric: scrubCurve })
        .select(
          'autoFit',
          [
            { label: 'None', value: 'none' },
            { label: 'Shrink to fit', value: 'shrink' },
          ],
          'Auto-fit'
        )
        .number('minFontSize', 'Min font size', { numeric: scrubPx })
        .build()
    );
  }

  renderPreview(ctx: LayerPreviewContext<CanvasTextModel>) {
    return createLayerPreviewBuilder().richText(sanitizeHtml(ctx.model.html), {
      align: ctx.model.align,
      autoFit: ctx.model.autoFit,
      curve: ctx.model.curve,
      fill: ctx.model.fill,
      fontFamily: ctx.model.fontFamily,
      fontSize: ctx.model.fontSize,
      letterSpacing: ctx.model.letterSpacing,
      lineHeight: ctx.model.lineHeight,
      minFontSize: ctx.model.minFontSize,
    });
  }
}
