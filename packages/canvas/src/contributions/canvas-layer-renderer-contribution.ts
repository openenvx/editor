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
