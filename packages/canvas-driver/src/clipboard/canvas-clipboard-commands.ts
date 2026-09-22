import {
  AssetServiceId,
  getActiveArtboard,
  canInsertLayers,
  findNodeById,
  localize,
  updateLayerInTree,
} from '@openenvx/studio';
import type { CommandContext, DocumentNode } from '@openenvx/studio';
import {
  applyNodeTransform,
  artboardRulesLayout,
  createDefaultTransform,
} from '@openenvx/studio/schema';

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

function getSelectedLayers(ctx: CommandContext): DocumentNode[] {
  const scene = ctx.scene.getDocument();
  return ctx.selection.selectedNodeIds
    .map((id) => findNodeById(scene, id))
    .filter((layer): layer is DocumentNode => layer !== null);
}

function insertCanvasLayers(
  ctx: CommandContext,
  layers: DocumentNode[],
  options?: { insertIndex?: number; label?: string }
): void {
  if (layers.length === 0) {
    return;
  }

  const page = ctx.scene.getActiveArtboard();
  const insertIndex = options?.insertIndex ?? page.nodes.length;
  const activeArtboardId = page.id;

  ctx.scene.apply({
    apply: (scene) => {
      const activePage = getActiveArtboard(scene, activeArtboardId);
      const nextLayers = [...activePage.nodes];
      nextLayers.splice(insertIndex, 0, ...layers);
      return {
        ...scene,
        artboards: scene.artboards.map((entry) =>
          entry.id === activePage.id ? { ...entry, nodes: nextLayers } : entry
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
    activeArtboardId,
    primaryNodeId: layers[0]?.id ?? null,
    selectedNodeIds: layers.map((layer) => layer.id),
  });
}

function getPasteAnchor(service: CanvasClipboardService): {
  x: number;
  y: number;
} {
  return service.getPasteAnchor();
}

type ExternalPasteBuild =
  | { kind: 'layers'; layers: DocumentNode[] }
  | { kind: 'image'; paste: ExternalImagePasteResult };

function layersFromExternalPayload(
  service: CanvasClipboardService,
  ctx: CommandContext,
  anchor: { x: number; y: number },
  payload: ExternalClipboardPayload
): ExternalPasteBuild | null {
  const page = ctx.scene.getActiveArtboard();

  if (payload.kind === 'text') {
    const layer = new CanvasTextLayer().createDefault(
      createLayerId('text'),
      page
    );
    const fitted = fitCanvasTextLayerToContent(
      applyNodeTransform(
        {
          ...layer,
          props: payload.model,
        },
        {
          ...createDefaultTransform(),
          opacity: 1,
          x: anchor.x,
          y: anchor.y,
          width: MAX_PASTED_TEXT_WIDTH,
          height: 48,
        }
      ),
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
  patch: (props: Record<string, unknown>) => Record<string, unknown>
): boolean {
  if (!findNodeById(ctx.scene.getDocument(), layerId)) {
    return false;
  }
  // setScene: don't push a second undo step for preview → CDN / flag updates
  const scene = ctx.scene.getDocument();
  ctx.scene.setScene({
    ...scene,
    artboards: scene.artboards.map((page) => ({
      ...page,
      nodes: updateLayerInTree(page.nodes, layerId, (layer) => {
        const props =
          typeof layer.props === 'object' && layer.props !== null
            ? { ...(layer.props as Record<string, unknown>) }
            : {};
        return { ...layer, props: patch(props) };
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
  return patchImageLayerData(ctx, layerId, (props) => {
    props.assetRef = assetRef;
    delete props.uploading;
    return props;
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
    const cleared = patchImageLayerData(ctx, layerId, (props) => {
      delete props.uploading;
      return props;
    });
    // Layer gone and upload failed - drop the unreclaimed object URL.
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
  const scene = ctx.scene.getDocument();
  const page = getActiveArtboard(scene);
  if (artboardRulesLayout(page) !== 'absolute') {
    return false;
  }
  const service = getClipboardService(ctx);
  return service ? isCanvasClipboardActive(service) : false;
}

export function canExecuteExternalPaste(ctx: CommandContext): boolean {
  return (
    canExecuteCanvasClipboard(ctx) && canInsertLayers(ctx.scene.getDocument())
  );
}

export function canExecuteInternalPaste(ctx: CommandContext): boolean {
  const service = getClipboardService(ctx);
  return (
    canExecuteCanvasClipboard(ctx) &&
    canInsertLayers(ctx.scene.getDocument()) &&
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

  const page = ctx.scene.getActiveArtboard();
  const indices = selected.map((layer) => {
    const rootIndex = page.nodes.findIndex((entry) => entry.id === layer.id);
    return rootIndex !== -1 ? rootIndex : page.nodes.length;
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
