import type { CanvasLayerRendererRegistration } from '../registry/canvas-registry-types';

export type { CanvasLayerRendererRegistration };

export interface CanvasLayerRendererHostProps {
  view: unknown;
  width: number;
  height: number;
  hidden?: boolean;
  fontLoadRevision?: number;
}

export abstract class CanvasLayerRendererContribution {
  abstract readonly kind: string;

  abstract readonly Component: unknown;
}
