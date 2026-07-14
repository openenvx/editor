import type {
  CanvasDocumentExportService,
  CanvasExportFormat,
  CanvasExportOptions,
  CanvasExportResult,
  CanvasPreviewSvgSerializer,
} from '@openenvx/canvas/document-export';
import { getActivePage } from '@openenvx/core';
import type { LayerRegistry } from '@openenvx/core';
import type { Scene } from '@openenvx/schema';
import {
  computePageExportDimensions,
  resolvePageBackground,
} from '@openenvx/schema';

import { defaultFileName, mimeTypeForFormat } from './export-mime';
import type {
  PreviewKindSvgSerializerRegistry,
  PreviewKindSvgSerializerRegisterOptions,
} from './preview-kind-svg-serializer';
import { rasterizeSvgToBytes } from './rasterize';
import { renderSvgDocument } from './svg-document-renderer';

function textEncoder(): TextEncoder {
  return new TextEncoder();
}

function encodeSvg(svg: string): Uint8Array {
  return textEncoder().encode(svg);
}

function resolveBackground(
  format: CanvasExportOptions['format'],
  pageBackground: string,
  requested?: CanvasExportOptions['background']
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

export class ImageDocumentExportService implements CanvasDocumentExportService {
  constructor(
    private readonly layerRegistry: LayerRegistry,
    private readonly serializers: PreviewKindSvgSerializerRegistry
  ) {}

  supportsFormat(format: CanvasExportFormat): boolean {
    return format === 'svg' || format === 'png' || format === 'jpg';
  }

  registerPreviewSerializer(
    serializer: CanvasPreviewSvgSerializer,
    options?: PreviewKindSvgSerializerRegisterOptions
  ): void {
    this.serializers.register(serializer, options);
  }

  async exportDocument(
    scene: Scene,
    pageId: string,
    options: CanvasExportOptions
  ): Promise<CanvasExportResult> {
    const page =
      scene.pages.find((entry) => entry.id === pageId) ?? getActivePage(scene);

    if (page.layout !== 'absolute') {
      throw new Error('Only absolute canvas pages can be exported');
    }

    if (!this.supportsFormat(options.format)) {
      throw new Error(
        'PDF export requires a browser rendering backend. Use the export service.'
      );
    }

    const pageBackground = resolvePageBackground(page);
    const background = resolveBackground(
      options.format,
      pageBackground,
      options.background
    );
    const svg = renderSvgDocument(scene, this.layerRegistry, pageId, {
      background,
      dpi: options.dpi,
      scale: options.scale,
      serializers: this.serializers,
      useRichText: true,
    });
    const dimensions = computePageExportDimensions(page, {
      dpi: options.dpi,
      scale: options.scale,
    });
    const fileName = options.fileName ?? defaultFileName(options.format);

    if (options.format === 'svg') {
      return {
        data: encodeSvg(svg),
        dimensions,
        fileName,
        mimeType: mimeTypeForFormat('svg'),
      };
    }

    const mimeType = mimeTypeForFormat(options.format);
    try {
      const data = await rasterizeSvgToBytes(
        svg,
        dimensions.widthPx,
        dimensions.heightPx,
        options.format === 'jpg' ? 'image/jpeg' : 'image/png',
        options.quality
      );
      return {
        data,
        dimensions,
        fileName,
        mimeType,
      };
    } catch (error) {
      return {
        data: encodeSvg(svg),
        dimensions,
        fileName: defaultFileName('svg'),
        fallback: {
          actualFormat: 'svg',
          reason:
            error instanceof Error ? error.message : 'Rasterization failed',
          requestedFormat: options.format,
        },
        mimeType: mimeTypeForFormat('svg'),
      };
    }
  }
}
