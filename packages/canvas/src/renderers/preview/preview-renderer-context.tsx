import { createContext, useContext } from 'react';

import type { LayerPreviewRendererRegistration } from '../../registry/canvas-registry-types';

const PreviewRendererRegistryContext = createContext<
  LayerPreviewRendererRegistration[]
>([]);

export function PreviewRendererRegistryProvider({
  layerPreviewRenderers,
  children,
}: {
  layerPreviewRenderers: LayerPreviewRendererRegistration[];
  children: React.ReactNode;
}) {
  return (
    <PreviewRendererRegistryContext.Provider value={layerPreviewRenderers}>
      {children}
    </PreviewRendererRegistryContext.Provider>
  );
}

export function usePreviewRendererRegistry(): LayerPreviewRendererRegistration[] {
  return useContext(PreviewRendererRegistryContext);
}
