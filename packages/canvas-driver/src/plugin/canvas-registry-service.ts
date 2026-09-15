import { SimpleServiceContribution } from '@openenvx/core';
import type { PluginContext } from '@openenvx/core';

import { CanvasRegistriesServiceId } from '../canvas-service-tokens';
import {
  CanvasLayerInteractionContribution,
  toCanvasLayerInteractionRegistration,
} from '../contributions/canvas-layer-interaction-contribution';
import { CanvasLayerRendererContribution } from '../contributions/canvas-layer-renderer-contribution';
import { LayerPreviewRendererContribution } from '../contributions/layer-preview-renderer-contribution';
import {
  CanvasRegistries,
  type CanvasRegistryRegisterOptions,
} from '../registries/canvas-registries';
import type { CanvasRegistriesReader } from '../registry/canvas-registries-reader';

export type CanvasContribution =
  | CanvasLayerRendererContribution
  | LayerPreviewRendererContribution
  | CanvasLayerInteractionContribution;

export class CanvasRegistriesService implements CanvasRegistriesReader {
  constructor(private readonly registries: CanvasRegistries) {}

  registerCanvasLayerRenderer(
    contribution: CanvasLayerRendererContribution,
    options?: CanvasRegistryRegisterOptions
  ): void {
    this.registries.canvasLayerRenderers.register(contribution, options);
  }

  registerLayerPreviewRenderer(
    contribution: LayerPreviewRendererContribution,
    options?: CanvasRegistryRegisterOptions
  ): void {
    this.registries.layerPreviewRenderers.register(contribution, options);
  }

  registerCanvasLayerInteraction(
    contribution: CanvasLayerInteractionContribution,
    options?: CanvasRegistryRegisterOptions
  ): void {
    this.registries.canvasLayerInteractions.register(contribution, options);
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

function getCanvasRegistriesService(
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

export interface RegisterCanvasContributionOptions {
  override?: boolean;
}

export function registerCanvasContribution(
  ctx: PluginContext,
  contributions: CanvasContribution | CanvasContribution[],
  options?: RegisterCanvasContributionOptions
): void {
  const service = ensureCanvasRegistriesInstalled(ctx);
  const entries = Array.isArray(contributions)
    ? contributions
    : [contributions];
  const registerOptions = options?.override ? { override: true } : undefined;

  for (const contribution of entries) {
    if (contribution instanceof CanvasLayerRendererContribution) {
      service.registerCanvasLayerRenderer(contribution, registerOptions);
      continue;
    }

    if (contribution instanceof LayerPreviewRendererContribution) {
      service.registerLayerPreviewRenderer(contribution, registerOptions);
      continue;
    }

    if (contribution instanceof CanvasLayerInteractionContribution) {
      service.registerCanvasLayerInteraction(contribution, registerOptions);
      continue;
    }

    throw new Error('Unknown canvas contribution type');
  }
}

export function createCanvasRegistriesService(): CanvasRegistriesService {
  return new CanvasRegistriesService(new CanvasRegistries());
}
