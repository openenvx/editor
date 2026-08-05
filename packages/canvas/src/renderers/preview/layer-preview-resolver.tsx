import type { LayerPreviewDescriptor } from '@xmazu/openenvxee-preview';
import type { ComponentType } from 'react';

import { PlaceholderPreviewRenderer } from './placeholder-preview-renderer';
import { usePreviewRendererRegistry } from './preview-renderer-context';

export function LayerPreviewRenderer({
  descriptor,
}: {
  descriptor: LayerPreviewDescriptor;
}) {
  const layerPreviewRenderers = usePreviewRendererRegistry();
  const registration = layerPreviewRenderers.find(
    (entry) => entry.kind === descriptor.kind
  );
  const Component =
    (registration?.Component as ComponentType<{
      descriptor: LayerPreviewDescriptor;
    }>) ?? PlaceholderPreviewRenderer;

  return <Component descriptor={descriptor} />;
}
