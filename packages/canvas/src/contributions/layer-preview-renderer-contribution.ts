export interface LayerPreviewRendererHostProps {
  descriptor: unknown;
}

export abstract class LayerPreviewRendererContribution {
  abstract readonly kind: string;

  abstract readonly Component: unknown;
}
