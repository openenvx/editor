import {
  mimeTypeForFormat,
  wrapTrimSvgWithCropMarks,
} from '@openenvx/driver-image';
import type { RenderIrDocument } from '@openenvx/preview';
import { toPx } from '@openenvx/schema';

import type { ExportRequest } from '../schemas/export-request';
import type { BrowserRenderBackend } from './browser-renderer';
import { assertExportLimits } from './export-limits';
import { renderExportIrDocument } from './ir-renderer';

export interface ExportDiagnostic {
  nodeId: string;
  code: string;
  message: string;
}

export interface ExportRunnerResult {
  body: Uint8Array;
  contentType: string;
  diagnostics: ExportDiagnostic[];
  fileName: string;
  heightPx: number;
  pageDpi: number;
  pagePresetId?: string;
  pageUnit: string;
  widthPx: number;
  bleedMm?: number;
}

function resolveExportBackground(
  format: ExportRequest['format'],
  pageBackground: string,
  requested?: ExportRequest['background']
): string {
  if (requested) {
    return requested === 'transparent' ? 'transparent' : requested;
  }
  if (format === 'png') {
    return 'transparent';
  }
  if (format === 'jpg') {
    return pageBackground === 'transparent' ? '#ffffff' : pageBackground;
  }
  return pageBackground;
}

function applyCropMarksIfNeeded(
  format: ExportRequest['format'],
  rendered: { svg: string; widthPx: number; heightPx: number },
  page: ExportRequest['document']['page'],
  scale: number
): { svg: string; widthPx: number; heightPx: number; bleedMm: number } {
  const bleedMm = page.bleedMm ?? 0;
  if (bleedMm <= 0 || (format !== 'svg' && format !== 'pdf')) {
    return { ...rendered, bleedMm };
  }

  const dpi = page.dpi ?? 96;
  const bleedPx = Math.round(toPx(bleedMm, 'mm', dpi) * scale);
  const wrapped = wrapTrimSvgWithCropMarks(rendered.svg, {
    bleedPx,
    dpi,
    trimHeightPx: rendered.heightPx,
    trimWidthPx: rendered.widthPx,
  });
  return { ...wrapped, bleedMm };
}

export async function runExport(
  request: ExportRequest,
  browser?: BrowserRenderBackend
): Promise<ExportRunnerResult> {
  assertExportLimits(request.document);

  const page = request.document.page;
  const background = resolveExportBackground(
    request.format,
    page.background ?? '#ffffff',
    request.background
  );
  const scale = request.scale ?? 1;
  const mode = request.mode ?? 'strict';

  const rendered = renderExportIrDocument(
    request.document as RenderIrDocument,
    {
      background,
      mode,
      scale,
    }
  );

  const withMarks = applyCropMarksIfNeeded(
    request.format,
    rendered,
    page,
    scale
  );

  const fileName =
    request.fileName ??
    `artboard.${request.format === 'jpg' ? 'jpg' : request.format}`;

  if (request.format === 'svg') {
    return {
      bleedMm: withMarks.bleedMm > 0 ? withMarks.bleedMm : undefined,
      body: new TextEncoder().encode(withMarks.svg),
      contentType: mimeTypeForFormat('svg'),
      diagnostics: rendered.diagnostics,
      fileName,
      heightPx: withMarks.heightPx,
      pageDpi: page.dpi ?? 96,
      pagePresetId: page.presetId,
      pageUnit: page.unit ?? 'px',
      widthPx: withMarks.widthPx,
    };
  }

  if (!browser) {
    throw new Error(
      'Browser rendering backend is required for raster and PDF export'
    );
  }

  const body = await browser.render({
    background,
    format: request.format,
    quality: request.quality,
    svg: withMarks.svg,
    widthPx: withMarks.widthPx,
    heightPx: withMarks.heightPx,
  });

  return {
    bleedMm: withMarks.bleedMm > 0 ? withMarks.bleedMm : undefined,
    body,
    contentType: mimeTypeForFormat(request.format),
    diagnostics: rendered.diagnostics,
    fileName,
    heightPx: withMarks.heightPx,
    pageDpi: page.dpi ?? 96,
    pagePresetId: page.presetId,
    pageUnit: page.unit ?? 'px',
    widthPx: withMarks.widthPx,
  };
}
