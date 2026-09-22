import { computeArtboardExportDimensions } from '@openenvx/studio/schema';
import type { Artboard } from '@openenvx/studio/schema';
import { PDFDocument } from 'pdf-lib';

export async function encodePngBytesToPdf(
  pngBytes: Uint8Array,
  artboard: Artboard,
  options: { dpi?: number }
): Promise<Uint8Array> {
  const dimensions = computeArtboardExportDimensions(artboard, {
    dpi: options.dpi,
    scale: 1,
  });
  const widthPt = (dimensions.widthPx / dimensions.artboardDpi) * 72;
  const heightPt = (dimensions.heightPx / dimensions.artboardDpi) * 72;
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
