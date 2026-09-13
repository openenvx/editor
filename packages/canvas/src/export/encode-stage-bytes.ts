import type Konva from 'konva';

import type { CanvasExportFormat } from './canvas-document-export-service';

function mimeTypeForFormat(format: CanvasExportFormat): string {
  switch (format) {
    case 'jpg': {
      return 'image/jpeg';
    }
    case 'png': {
      return 'image/png';
    }
    case 'pdf': {
      return 'application/pdf';
    }
    default: {
      return 'application/octet-stream';
    }
  }
}

function dataUrlToBytes(dataUrl: string): Uint8Array {
  const commaIndex = dataUrl.indexOf(',');
  const base64 = commaIndex !== -1 ? dataUrl.slice(commaIndex + 1) : dataUrl;
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.codePointAt(index) ?? 0;
  }
  return bytes;
}

export function encodeStageToBytes(
  stage: Konva.Stage,
  format: 'png' | 'jpg',
  options?: { pixelRatio?: number; quality?: number }
): Uint8Array {
  const mimeType = mimeTypeForFormat(format);
  const exportConfig: {
    mimeType: string;
    pixelRatio: number;
    quality?: number;
  } = {
    mimeType,
    pixelRatio: options?.pixelRatio ?? 1,
  };
  if (format === 'jpg') {
    exportConfig.quality = options?.quality ?? 0.92;
  }
  const dataUrl = stage.toDataURL(exportConfig);
  return dataUrlToBytes(dataUrl);
}

export { mimeTypeForFormat };
