import type { CanvasExportFormat } from '@openenvx/canvas';
import type { IrRenderMode, RenderIrDocument } from '@openenvx/preview';
import type { Scene } from '@openenvx/schema';

export type ExportServiceRequest = {
  background?: 'transparent' | 'white' | string;
  dpi?: number;
  fileName?: string;
  format: CanvasExportFormat;
  mode?: IrRenderMode;
  pageId?: string;
  quality?: number;
  scale?: number;
} & (
  | { document: RenderIrDocument; scene?: never }
  | { scene: Scene; document?: never }
);

export interface ExportServiceResponse {
  blob: Blob;
  fileName: string;
  mimeType: string;
  warnings: number;
}

function parseFileName(disposition: string | null): string | null {
  if (!disposition) {
    return null;
  }
  const match = /filename="([^"]+)"/.exec(disposition);
  return match?.[1] ?? null;
}

export async function exportViaService(
  baseUrl: string,
  request: ExportServiceRequest
): Promise<ExportServiceResponse> {
  const root = baseUrl.replace(/\/$/, '');
  const url = root.length > 0 ? `${root}/api/export` : '/api/export';
  const response = await fetch(url, {
    body: JSON.stringify(request),
    headers: { 'content-type': 'application/json' },
    method: 'POST',
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new Error(body?.error ?? `Export failed (${response.status})`);
  }

  const blob = await response.blob();
  const mimeType =
    response.headers.get('content-type') ??
    blob.type ??
    'application/octet-stream';
  const fileName =
    parseFileName(response.headers.get('content-disposition')) ??
    request.fileName ??
    `artboard.${request.format}`;
  const warnings = Number(response.headers.get('x-export-warnings') ?? '0');

  return { blob, fileName, mimeType, warnings };
}

export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}
