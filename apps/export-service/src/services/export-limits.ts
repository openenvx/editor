import type { RenderIrDocumentInput } from '../schemas/export-request';

export const EXPORT_LIMITS = {
  maxNodes: 1000,
  maxPayloadBytes: 10 * 1024 * 1024,
  maxRawSvgBytesPerNode: 1024 * 1024,
  maxTotalRawSvgBytes: 5 * 1024 * 1024,
} as const;

export class ExportLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ExportLimitError';
  }
}

export function assertExportLimits(
  document: RenderIrDocumentInput,
  payloadBytes?: number
): void {
  if (
    payloadBytes !== undefined &&
    payloadBytes > EXPORT_LIMITS.maxPayloadBytes
  ) {
    throw new ExportLimitError(
      `Export payload exceeds ${EXPORT_LIMITS.maxPayloadBytes} bytes`
    );
  }

  if (document.nodes.length > EXPORT_LIMITS.maxNodes) {
    throw new ExportLimitError(
      `Export exceeds maximum node count of ${EXPORT_LIMITS.maxNodes}`
    );
  }

  let totalRawSvgBytes = 0;
  for (const node of document.nodes) {
    if (node.descriptor.kind !== 'raw') {
      continue;
    }

    const bytes = new TextEncoder().encode(
      (node.descriptor as unknown as { svg: string }).svg
    ).byteLength;
    if (bytes > EXPORT_LIMITS.maxRawSvgBytesPerNode) {
      throw new ExportLimitError(
        `Node ${node.id} raw SVG exceeds ${EXPORT_LIMITS.maxRawSvgBytesPerNode} bytes`
      );
    }
    totalRawSvgBytes += bytes;
  }

  if (totalRawSvgBytes > EXPORT_LIMITS.maxTotalRawSvgBytes) {
    throw new ExportLimitError(
      `Total raw SVG exceeds ${EXPORT_LIMITS.maxTotalRawSvgBytes} bytes`
    );
  }
}
