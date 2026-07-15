import { mimeTypeForFormat } from '@openenvx/driver-image';
import type { RenderIrDocument } from '@openenvx/preview';

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

  const fileName =
    request.fileName ??
    `artboard.${request.format === 'jpg' ? 'jpg' : request.format}`;

  if (request.format === 'svg') {
    return {
      body: new TextEncoder().encode(rendered.svg),
      contentType: mimeTypeForFormat('svg'),
      diagnostics: rendered.diagnostics,
      fileName,
      heightPx: rendered.heightPx,
      pageDpi: page.dpi ?? 96,
      pagePresetId: page.presetId,
      pageUnit: page.unit ?? 'px',
      widthPx: rendered.widthPx,
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
    svg: rendered.svg,
    widthPx: rendered.widthPx,
    heightPx: rendered.heightPx,
  });

  return {
    body,
    contentType: mimeTypeForFormat(request.format),
    diagnostics: rendered.diagnostics,
    fileName,
    heightPx: rendered.heightPx,
    pageDpi: page.dpi ?? 96,
    pagePresetId: page.presetId,
    pageUnit: page.unit ?? 'px',
    widthPx: rendered.widthPx,
  };
}
