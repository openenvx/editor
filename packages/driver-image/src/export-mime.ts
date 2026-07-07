export type ExportFormat = 'svg' | 'png' | 'jpg' | 'pdf';

const MIME_BY_FORMAT: Record<ExportFormat, string> = {
  jpg: 'image/jpeg',
  pdf: 'application/pdf',
  png: 'image/png',
  svg: 'image/svg+xml',
};

const EXTENSION_BY_FORMAT: Record<ExportFormat, string> = {
  jpg: 'jpg',
  pdf: 'pdf',
  png: 'png',
  svg: 'svg',
};

export function mimeTypeForFormat(format: ExportFormat): string {
  return MIME_BY_FORMAT[format];
}

export function extensionForFormat(format: ExportFormat): string {
  return EXTENSION_BY_FORMAT[format];
}

export function defaultFileName(
  format: ExportFormat,
  baseName = 'artboard'
): string {
  return `${baseName}.${extensionForFormat(format)}`;
}
