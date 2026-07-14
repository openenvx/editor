import { CanvasDocumentExportServiceId } from '@openenvx/canvas/document-export';
import { LayerRegistryServiceId, Plugin } from '@openenvx/core';
import type { PluginContext } from '@openenvx/core';

import { registerBuiltinSvgSerializers } from './builtin-svg-serializers';
import { ImageDocumentExportService } from './image-document-export-service';
import {
  getDefaultSerializerRegistry,
  type PreviewKindSvgSerializer,
  type PreviewKindSvgSerializerRegisterOptions,
} from './preview-kind-svg-serializer';

export class DriverImagePlugin extends Plugin {
  readonly id = 'driver-image';

  activate(ctx: PluginContext): void {
    const serializers = getDefaultSerializerRegistry();
    registerBuiltinSvgSerializers(serializers);

    const layerRegistry = ctx.services.get(LayerRegistryServiceId);
    ctx.services.registerInstance(
      CanvasDocumentExportServiceId,
      new ImageDocumentExportService(layerRegistry, serializers)
    );
  }
}

export function registerPreviewKindSvgSerializer(
  ctx: PluginContext,
  serializer: PreviewKindSvgSerializer,
  options?: PreviewKindSvgSerializerRegisterOptions
): void {
  const service = ctx.services.get(CanvasDocumentExportServiceId);
  service.registerPreviewSerializer(serializer, options);
}
