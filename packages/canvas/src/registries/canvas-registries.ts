import type { CanvasLayerInteractionContribution } from '../contributions/canvas-layer-interaction-contribution';
import type { CanvasLayerRendererContribution } from '../contributions/canvas-layer-renderer-contribution';
import type { LayerPreviewRendererContribution } from '../contributions/layer-preview-renderer-contribution';

class CanvasLayerRendererRegistry {
  private readonly contributions = new Map<
    string,
    CanvasLayerRendererContribution
  >();

  register(contribution: CanvasLayerRendererContribution): void {
    if (this.contributions.has(contribution.kind)) {
      throw new Error(
        `Canvas layer renderer already registered: ${contribution.kind}`
      );
    }
    this.contributions.set(contribution.kind, contribution);
  }

  get(kind: string): CanvasLayerRendererContribution | undefined {
    return this.contributions.get(kind);
  }

  getAll(): CanvasLayerRendererContribution[] {
    return [...this.contributions.values()];
  }
}

class LayerPreviewRendererRegistry {
  private readonly contributions = new Map<
    string,
    LayerPreviewRendererContribution
  >();

  register(contribution: LayerPreviewRendererContribution): void {
    if (this.contributions.has(contribution.kind)) {
      throw new Error(
        `Layer preview renderer already registered: ${contribution.kind}`
      );
    }
    this.contributions.set(contribution.kind, contribution);
  }

  get(kind: string): LayerPreviewRendererContribution | undefined {
    return this.contributions.get(kind);
  }

  getAll(): LayerPreviewRendererContribution[] {
    return [...this.contributions.values()];
  }
}

class CanvasLayerInteractionRegistry {
  private readonly contributions = new Map<
    string,
    CanvasLayerInteractionContribution
  >();

  register(contribution: CanvasLayerInteractionContribution): void {
    if (this.contributions.has(contribution.kind)) {
      throw new Error(
        `Canvas layer interaction already registered: ${contribution.kind}`
      );
    }
    this.contributions.set(contribution.kind, contribution);
  }

  get(kind: string): CanvasLayerInteractionContribution | undefined {
    return this.contributions.get(kind);
  }

  getAll(): CanvasLayerInteractionContribution[] {
    return [...this.contributions.values()];
  }
}

export class CanvasRegistries {
  readonly canvasLayerRenderers = new CanvasLayerRendererRegistry();
  readonly layerPreviewRenderers = new LayerPreviewRendererRegistry();
  readonly canvasLayerInteractions = new CanvasLayerInteractionRegistry();
}
