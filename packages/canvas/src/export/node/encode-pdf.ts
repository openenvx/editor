import { computePageExportDimensions } from '@openenvx/core/schema';
import type { Page } from '@openenvx/core/schema';
import { PDFDocument } from 'pdf-lib';

export async function encodePngBytesToPdf(
  pngBytes: Uint8Array,
  page: Page,
  options: { dpi?: number }
): Promise<Uint8Array> {
  const dimensions = computePageExportDimensions(page, {
    dpi: options.dpi,
    scale: 1,
  });
  const widthPt = (dimensions.widthPx / dimensions.pageDpi) * 72;
  const heightPt = (dimensions.heightPx / dimensions.pageDpi) * 72;
  const pdf = await PDFDocument.create();
  const embedded = await pdf.embedPng(pngBytes);
  const pdfPage = pdf.addPage([widthPt, heightPt]);
  pdfPage.drawImage(embedded, {
    height: heightPt,
    width: widthPt,
    x: 0,
    y: 0,
  });
  const bytes = await pdf.save();
  return new Uint8Array(bytes);
}
