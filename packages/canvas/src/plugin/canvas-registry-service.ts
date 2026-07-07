import { SimpleServiceContribution } from '@openenvx/core';
import type { PluginContext } from '@openenvx/core';

import { CanvasRegistriesServiceId } from '../canvas-service-tokens';
import {
  CanvasLayerInteractionContribution,
  toCanvasLayerInteractionRegistration,
} from '../contributions/canvas-layer-interaction-contribution';
import { CanvasLayerRendererContribution } from '../contributions/canvas-layer-renderer-contribution';
import { LayerPreviewRendererContribution } from '../contributions/layer-preview-renderer-contribution';
import { CanvasRegistries } from '../registries/canvas-registries';
import type { CanvasRegistriesReader } from '../registry/canvas-registries-reader';

export class CanvasRegistriesService implements CanvasRegistriesReader {
  constructor(private readonly registries: CanvasRegistries) {}

  registerCanvasLayerRenderer(
    contribution: CanvasLayerRendererContribution
  ): void {
    this.registries.canvasLayerRenderers.register(contribution);
  }

  registerLayerPreviewRenderer(
    contribution: LayerPreviewRendererContribution
  ): void {
    this.registries.layerPreviewRenderers.register(contribution);
  }

  registerCanvasLayerInteraction(
    contribution: CanvasLayerInteractionContribution
  ): void {
    this.registries.canvasLayerInteractions.register(contribution);
  }

  getSnapshot() {
    return {
      canvasLayerInteractions: this.registries.canvasLayerInteractions
        .getAll()
        .map(toCanvasLayerInteractionRegistration),
      canvasLayerRenderers: this.registries.canvasLayerRenderers
        .getAll()
        .map((renderer) => ({
          Component: renderer.Component,
          kind: renderer.kind,
        })),
      layerPreviewRenderers: this.registries.layerPreviewRenderers
        .getAll()
        .map((renderer) => ({
          Component: renderer.Component,
          kind: renderer.kind,
        })),
    };
  }
}

export function getCanvasRegistriesService(
  ctx: PluginContext
): CanvasRegistriesService | null {
  if (!ctx.services.has(CanvasRegistriesServiceId)) {
    return null;
  }
  return ctx.services.get(CanvasRegistriesServiceId) as CanvasRegistriesService;
}

export function ensureCanvasRegistriesInstalled(
  ctx: PluginContext
): CanvasRegistriesService {
  const existing = getCanvasRegistriesService(ctx);
  if (existing) {
    return existing;
  }

  const service = createCanvasRegistriesService();
  ctx.register(
    new SimpleServiceContribution(CanvasRegistriesServiceId, () => service)
  );
  return service;
}

export function registerCanvasContribution(
  ctx: PluginContext,
  ...contributions: (
    | CanvasLayerRendererContribution
    | LayerPreviewRendererContribution
    | CanvasLayerInteractionContribution
  )[]
): void {
  const service = ensureCanvasRegistriesInstalled(ctx);

  for (const contribution of contributions) {
    if (contribution instanceof CanvasLayerRendererContribution) {
      service.registerCanvasLayerRenderer(contribution);
      continue;
    }

    if (contribution instanceof LayerPreviewRendererContribution) {
      service.registerLayerPreviewRenderer(contribution);
      continue;
    }

    if (contribution instanceof CanvasLayerInteractionContribution) {
      service.registerCanvasLayerInteraction(contribution);
      continue;
    }

    throw new Error('Unknown canvas contribution type');
  }
}

export function createCanvasRegistriesService(): CanvasRegistriesService {
  return new CanvasRegistriesService(new CanvasRegistries());
}
