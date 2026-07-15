import {
  IrRenderError,
  renderIrDocument,
  type IrDocumentRenderOptions,
  type IrDocumentRenderResult,
} from '@openenvx/driver-image';
import type { RenderIrDocument } from '@openenvx/preview';

import { sanitizeRawSvg } from './svg-sanitizer';

export { IrRenderError };
export type { IrDocumentRenderOptions, IrDocumentRenderResult };

export function renderExportIrDocument(
  document: RenderIrDocument,
  options: Omit<IrDocumentRenderOptions, 'sanitizeRawSvg'> = {}
): IrDocumentRenderResult {
  return renderIrDocument(document, {
    ...options,
    sanitizeRawSvg,
  });
}
