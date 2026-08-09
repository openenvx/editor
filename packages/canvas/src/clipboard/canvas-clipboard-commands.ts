import {
  AssetServiceId,
  getActivePage,
  canInsertLayers,
  findLayerById,
  localize,
  updateLayerInTree,
} from '@openenvx/core';
import type { CommandContext, Layer } from '@openenvx/core';
import { createDefaultTransform } from '@openenvx/core/schema';

import { CanvasClipboardServiceId } from '../canvas-service-tokens';
import { fitCanvasTextLayerToContent } from '../fit-text-layer-to-content';
import { CanvasTextLayer } from '../layers/canvas-text-layer';
import type {
  CanvasClipboardService,
  ExternalImagePasteResult,
} from './canvas-clipboard-service';
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

type ExternalPasteBuild =
  | { kind: 'layers'; layers: Layer[] }
  | { kind: 'image'; paste: ExternalImagePasteResult };

function layersFromExternalPayload(
  service: CanvasClipboardService,
  ctx: CommandContext,
  anchor: { x: number; y: number },
  payload: ExternalClipboardPayload
): ExternalPasteBuild | null {
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
    return { kind: 'layers', layers: [fitted] };
  }

  const assets = ctx.services.get(AssetServiceId);
  if (!assets) {
    return null;
  }
  const paste = service.createImageLayerFromExternalPaste(
    page,
    anchor,
    {
      blob: payload.blob,
      naturalHeight: payload.naturalHeight,
      naturalWidth: payload.naturalWidth,
    },
    assets
  );
  return paste ? { kind: 'image', paste } : null;
}

function patchImageLayerData(
  ctx: CommandContext,
  layerId: string,
  patch: (data: Record<string, unknown>) => Record<string, unknown>
): boolean {
  if (!findLayerById(ctx.scene.getScene(), layerId)) {
    return false;
  }
  // setScene: don't push a second undo step for preview → CDN / flag updates
  const scene = ctx.scene.getScene();
  ctx.scene.setScene({
    ...scene,
    pages: scene.pages.map((page) => ({
      ...page,
      layers: updateLayerInTree(page.layers, layerId, (layer) => {
        const data =
          typeof layer.data === 'object' && layer.data !== null
            ? { ...(layer.data as Record<string, unknown>) }
            : {};
        return { ...layer, data: patch(data) };
      }),
    })),
  });
  return true;
}

function applyDurableImagePaste(
  ctx: CommandContext,
  layerId: string,
  assetRef: string
): boolean {
  return patchImageLayerData(ctx, layerId, (data) => {
    data.assetRef = assetRef;
    delete data.uploading;
    return data;
  });
}

async function finalizeImagePaste(
  ctx: CommandContext,
  paste: ExternalImagePasteResult
): Promise<void> {
  const layerId = paste.layer.id;
  try {
    const assetRef = await paste.finalizeUpload();
    if (applyDurableImagePaste(ctx, layerId, assetRef)) {
      paste.revokePreview();
      return;
    }
    // Undone (or deleted) during upload: keep session preview briefly for redo,
    // then swap to the durable ref when the layer returns.
    const unsubscribe = ctx.scene.subscribe(() => {
      if (!applyDurableImagePaste(ctx, layerId, assetRef)) {
        return;
      }
      unsubscribe();
      paste.revokePreview();
    });
    // Drop the object URL if redo never comes; CDN patch still applies later.
    setTimeout(() => {
      paste.revokePreview();
    }, 30_000);
  } catch {
    const cleared = patchImageLayerData(ctx, layerId, (data) => {
      delete data.uploading;
      return data;
    });
    // Layer gone and upload failed — drop the unreclaimed object URL.
    if (!cleared) {
      paste.revokePreview();
    }
  }
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

  const built = layersFromExternalPayload(
    service,
    ctx,
    getPasteAnchor(service),
    payload
  );
  if (!built) {
    return false;
  }

  const layers = built.kind === 'layers' ? built.layers : [built.paste.layer];
  try {
    insertCanvasLayers(ctx, layers, {
      label: localize(ctx.services, 'canvas.history.pasteFromClipboard', {
        defaultValue: 'Paste from clipboard',
      }),
    });
  } catch (error) {
    if (built.kind === 'image') {
      built.paste.revokePreview();
    }
    throw error;
  }

  if (built.kind === 'image') {
    void finalizeImagePaste(ctx, built.paste);
  }
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
