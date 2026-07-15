import { IrRenderError } from './ir-renderer';

export function resolveExportErrorStatus(error: unknown): number {
  if (error instanceof IrRenderError) {
    return 422;
  }
  if (error instanceof Error && error.name === 'ExportLimitError') {
    return 413;
  }
  if (
    error instanceof Error &&
    error.message.includes('Unsupported render IR')
  ) {
    return 400;
  }
  return 400;
}
