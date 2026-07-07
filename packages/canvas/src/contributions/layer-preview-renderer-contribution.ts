import type { LayerPreviewRendererRegistration } from '../registry/canvas-registry-types';

export type { LayerPreviewRendererRegistration };

export interface LayerPreviewRendererHostProps {
  descriptor: unknown;
}

export abstract class LayerPreviewRendererContribution {
  abstract readonly kind: string;

  abstract readonly Component: unknown;
}
