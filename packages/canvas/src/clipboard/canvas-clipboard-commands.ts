import {
  getActivePage,
  canInsertLayers,
  findLayerById,
  localize,
} from '@openenvx/core';
import type { CommandContext, Layer } from '@openenvx/core';
import { createDefaultTransform } from '@xmazu/openenvxee-schema';

import { CanvasClipboardServiceId } from '../canvas-service-tokens';
import { fitCanvasTextLayerToContent } from '../fit-text-layer-to-content';
import { CanvasTextLayer } from '../layers/canvas-text-layer';
import type { CanvasClipboardService } from './canvas-clipboard-service';
import {
  cloneLayers,
  createLayerId,
  getLayersBoundingBox,
  offsetLayers,
  positionLayersAtAnchor,
} from './clone-layers-for-paste';
import {
  finalizeCapturedPayload,
  readExternalClipboard,
} from './read-external-clipboard';
import type { ExternalClipboardPayload } from './read-external-clipboard';

const DUPLICATE_OFFSET = { x: 10, y: 10 };
const MAX_PASTED_TEXT_WIDTH = 320;

function getClipboardService(
  ctx: CommandContext
): CanvasClipboardService | null {
  return ctx.services.get<CanvasClipboardService>(CanvasClipboardServiceId);
}

function isCanvasClipboardActive(service: CanvasClipboardService): boolean {
  return service.isEditorActive() && !service.isEditingText();
}

function getSelectedLayers(ctx: CommandContext): Layer[] {
  const scene = ctx.scene.getScene();
  return ctx.selection.selectedLayerIds
    .map((id) => findLayerById(scene, id))
    .filter((layer): layer is Layer => layer !== null);
}

function insertCanvasLayers(
  ctx: CommandContext,
  layers: Layer[],
  options?: { insertIndex?: number; label?: string }
): void {
  if (layers.length === 0) {
    return;
  }

  const page = ctx.scene.getActivePage();
  const insertIndex = options?.insertIndex ?? page.layers.length;
  const activePageId = page.id;

  ctx.scene.apply({
    apply: (scene) => {
      const activePage = getActivePage(scene, activePageId);
      const nextLayers = [...activePage.layers];
      nextLayers.splice(insertIndex, 0, ...layers);
      return {
        ...scene,
        pages: scene.pages.map((entry) =>
          entry.id === activePage.id ? { ...entry, layers: nextLayers } : entry
        ),
      };
    },
    label:
      options?.label ??
      localize(ctx.services, 'canvas.history.insertLayer', {
        defaultValue: 'Insert layers',
      }),
  });
  ctx.scene.setSelection({
    activePageId,
    primaryLayerId: layers[0]?.id ?? null,
    selectedLayerIds: layers.map((layer) => layer.id),
  });
}

function getPasteAnchor(service: CanvasClipboardService): {
  x: number;
  y: number;
} {
  return service.getPasteAnchor();
}

async function layersFromExternalPayload(
  service: CanvasClipboardService,
  ctx: CommandContext,
  anchor: { x: number; y: number },
  payload: ExternalClipboardPayload
): Promise<Layer[] | null> {
  const page = ctx.scene.getActivePage();

  if (payload.kind === 'text') {
    const layer = new CanvasTextLayer().createDefault(
      createLayerId('text'),
      page
    );
    layer.data = payload.model;
    const fitted = fitCanvasTextLayerToContent(
      {
        ...layer,
        data: payload.model,
        transform: {
          ...createDefaultTransform(),
          x: anchor.x,
          y: anchor.y,
          width: MAX_PASTED_TEXT_WIDTH,
          height: 48,
        },
      },
      { maxWidth: MAX_PASTED_TEXT_WIDTH, mode: 'box' }
    );
    return [fitted];
  }

  const layer = await service.createImageLayerFromExternalPaste(page, anchor, {
    blob: payload.blob,
    naturalHeight: payload.naturalHeight,
    naturalWidth: payload.naturalWidth,
  });
  return layer ? [layer] : null;
}

async function pasteInternalLayers(
  ctx: CommandContext,
  service: CanvasClipboardService
): Promise<void> {
  const payload = service.getInternal();
  if (!payload) {
    return;
  }
  const anchor = getPasteAnchor(service);
  const clones = cloneLayers(payload.layers);
  const positioned = positionLayersAtAnchor(clones, payload.origin, anchor);
  insertCanvasLayers(ctx, positioned, {
    label: localize(ctx.services, 'canvas.history.pasteLayers', {
      defaultValue: 'Paste layers',
    }),
  });
}

async function resolveExternalPayload(
  service: CanvasClipboardService
): Promise<ExternalClipboardPayload | null> {
  const captured = service.consumePendingCapturedPayload();
  if (captured) {
    return finalizeCapturedPayload(captured);
  }
  return readExternalClipboard();
}

export async function executePasteExternalLayers(
  ctx: CommandContext
): Promise<boolean> {
  const service = getClipboardService(ctx);
  if (!service || !isCanvasClipboardActive(service)) {
    return false;
  }

  if (service.hasInternal()) {
    await pasteInternalLayers(ctx, service);
    return true;
  }

  const payload = await resolveExternalPayload(service);
  if (!payload) {
    return false;
  }

  const layers = await layersFromExternalPayload(
    service,
    ctx,
    getPasteAnchor(service),
    payload
  );
  if (!layers) {
    return false;
  }

  insertCanvasLayers(ctx, layers, {
    label: localize(ctx.services, 'canvas.history.pasteFromClipboard', {
      defaultValue: 'Paste from clipboard',
    }),
  });
  return true;
}

export function canExecuteCanvasClipboard(ctx: CommandContext): boolean {
  const scene = ctx.scene.getScene();
  const page = getActivePage(scene);
  if (page.layout !== 'absolute') {
    return false;
  }
  const service = getClipboardService(ctx);
  return service ? isCanvasClipboardActive(service) : false;
}

export function canExecuteExternalPaste(ctx: CommandContext): boolean {
  return (
    canExecuteCanvasClipboard(ctx) && canInsertLayers(ctx.scene.getScene())
  );
}

export function canExecuteInternalPaste(ctx: CommandContext): boolean {
  const service = getClipboardService(ctx);
  return (
    canExecuteCanvasClipboard(ctx) &&
    canInsertLayers(ctx.scene.getScene()) &&
    Boolean(service?.hasInternal())
  );
}

export async function executeCopyLayers(ctx: CommandContext): Promise<void> {
  const service = getClipboardService(ctx);
  if (!service) {
    return;
  }

  const selected = getSelectedLayers(ctx);
  if (selected.length === 0) {
    return;
  }

  const layers = structuredClone(selected);
  const origin = getLayersBoundingBox(layers);
  service.setInternal({ layers, origin: { x: origin.x, y: origin.y } });
}

export async function executePasteLayers(ctx: CommandContext): Promise<void> {
  const service = getClipboardService(ctx);
  if (!service?.hasInternal()) {
    return;
  }
  service.markInternalPasteFromShortcut();
  await pasteInternalLayers(ctx, service);
}

export async function executeDuplicateLayers(
  ctx: CommandContext
): Promise<void> {
  const selected = getSelectedLayers(ctx);
  if (selected.length === 0) {
    return;
  }

  const page = ctx.scene.getActivePage();
  const indices = selected.map((layer) => {
    const rootIndex = page.layers.findIndex((entry) => entry.id === layer.id);
    return rootIndex !== -1 ? rootIndex : page.layers.length;
  });
  const insertIndex = Math.max(...indices) + 1;
  const clones = offsetLayers(
    cloneLayers(selected),
    DUPLICATE_OFFSET.x,
    DUPLICATE_OFFSET.y
  );
  insertCanvasLayers(ctx, clones, {
    insertIndex,
    label: localize(ctx.services, 'canvas.history.duplicateLayers', {
      defaultValue: 'Duplicate layers',
    }),
  });
}
