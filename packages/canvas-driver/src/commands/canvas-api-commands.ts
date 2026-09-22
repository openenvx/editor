import {
  Command,
  canResizePage,
  canTransformLayer,
  findNodeById,
  FontServiceId,
  getActiveArtboard,
  localize,
  updateLayerInTree,
} from '@openenvx/studio/core';
import type {
  CommandContext,
  FontDescriptor,
  FontService,
} from '@openenvx/studio/core';
import {
  applyNodeTransform,
  artboardRulesLayout,
  nodeTransform,
  type Transform,
} from '@openenvx/studio/schema';

import {
  CanvasCommandRequestServiceId,
  CanvasPageResizeServiceId,
} from '../canvas-service-tokens';
import { bytesToDataUrl } from '../export/bytes-to-data-url';
import { CanvasDocumentExportServiceId } from '../export/canvas-document-export-service';
import type { CanvasDocumentExportService } from '../export/canvas-document-export-service';
import { rotateTransformAroundCenter } from '../geometry';
import { resolvePagePreset } from '../page-presets';
import { applyPagePresetResize } from '../page-resize/apply-page-preset-resize';
import type { PageResizeService } from '../page-resize/page-resize-types';
import type { CanvasCommandRequestService } from './canvas-command-request-service';

interface PageSizeArgs {
  width: number;
  height: number;
}

interface PagePresetArgs {
  presetId: string;
}

interface LayerTransformArgs {
  dataPatch?: Record<string, unknown>;
  layerId: string;
  transform: Transform;
}

interface RichTextTransformArgs {
  layerId: string;
  fontSize: number;
  transform: Transform;
}

function getCommandRequests(ctx: CommandContext): CanvasCommandRequestService {
  return ctx.services.get(CanvasCommandRequestServiceId);
}

function getDocumentExporter(
  ctx: CommandContext
): CanvasDocumentExportService | undefined {
  if (!ctx.services.has(CanvasDocumentExportServiceId)) {
    return undefined;
  }
  return ctx.services.get(CanvasDocumentExportServiceId);
}

function canTransformLayerById(ctx: CommandContext, layerId: string): boolean {
  const layer = findNodeById(ctx.scene.getDocument(), layerId);
  return layer ? canTransformLayer(layer) : false;
}

function canTransformPrimaryLayer(ctx: CommandContext): boolean {
  const layer = ctx.scene.getPrimaryLayer();
  return layer ? canTransformLayer(layer) : false;
}

export class SetPageSizeCommand extends Command {
  readonly id = 'canvas.setPageSize';

  canExecute(ctx: CommandContext): boolean {
    const scene = ctx.scene.getDocument();
    return (
      artboardRulesLayout(getActiveArtboard(scene)) === 'absolute' &&
      canResizePage(scene)
    );
  }

  execute(ctx: CommandContext, args?: unknown): void {
    const size = args as PageSizeArgs | undefined;
    if (!size) {
      return;
    }
    const activeArtboardId = ctx.scene.getActiveArtboardId();
    ctx.scene.apply({
      apply: (scene) => ({
        ...scene,
        artboards: scene.artboards.map((page) =>
          page.id === activeArtboardId &&
          artboardRulesLayout(page) === 'absolute'
            ? {
                ...page,
                physical: {
                  ...page.physical,
                  dpi: 96,
                  presetId: undefined,
                  unit: 'px',
                },
                space: {
                  ...page.space,
                  height: size.height,
                  width: size.width,
                },
              }
            : page
        ),
      }),
      label: localize(ctx.services, 'canvas.history.setPageSize', {
        defaultValue: 'Set page size',
      }),
    });
  }
}

function parseNonNegativeMm(
  args: unknown,
  key: 'bleedMm' | 'safeMm'
): number | null {
  const raw =
    typeof args === 'number'
      ? args
      : args && typeof args === 'object' && key in args
        ? (args as Record<string, unknown>)[key]
        : undefined;
  if (typeof raw !== 'number' || !Number.isFinite(raw) || raw < 0) {
    return null;
  }
  return raw;
}

export class SetBleedMmCommand extends Command {
  readonly id = 'canvas.setBleedMm';

  canExecute(ctx: CommandContext): boolean {
    return (
      artboardRulesLayout(getActiveArtboard(ctx.scene.getDocument())) ===
      'absolute'
    );
  }

  execute(ctx: CommandContext, args?: unknown): void {
    const bleedMm = parseNonNegativeMm(args, 'bleedMm');
    if (bleedMm === null) {
      return;
    }
    const activeArtboardId = ctx.scene.getActiveArtboardId();
    ctx.scene.apply({
      apply: (scene) => ({
        ...scene,
        artboards: scene.artboards.map((page) =>
          page.id === activeArtboardId
            ? {
                ...page,
                physical: { ...page.physical, bleedMm },
              }
            : page
        ),
      }),
      label: localize(ctx.services, 'canvas.history.setBleedMm', {
        defaultValue: 'Set bleed',
      }),
    });
  }
}

export class SetSafeMmCommand extends Command {
  readonly id = 'canvas.setSafeMm';

  canExecute(ctx: CommandContext): boolean {
    return (
      artboardRulesLayout(getActiveArtboard(ctx.scene.getDocument())) ===
      'absolute'
    );
  }

  execute(ctx: CommandContext, args?: unknown): void {
    const safeMm = parseNonNegativeMm(args, 'safeMm');
    if (safeMm === null) {
      return;
    }
    const activeArtboardId = ctx.scene.getActiveArtboardId();
    ctx.scene.apply({
      apply: (scene) => ({
        ...scene,
        artboards: scene.artboards.map((page) =>
          page.id === activeArtboardId
            ? {
                ...page,
                physical: { ...page.physical, safeMm },
              }
            : page
        ),
      }),
      label: localize(ctx.services, 'canvas.history.setSafeMm', {
        defaultValue: 'Set safe margin',
      }),
    });
  }
}

export class SetPagePresetCommand extends Command {
  readonly id = 'canvas.setPagePreset';

  canExecute(ctx: CommandContext): boolean {
    const scene = ctx.scene.getDocument();
    return (
      artboardRulesLayout(getActiveArtboard(scene)) === 'absolute' &&
      canResizePage(scene)
    );
  }

  execute(ctx: CommandContext, args?: unknown): void {
    const presetId = (args as PagePresetArgs | undefined)?.presetId;
    if (!presetId) {
      return;
    }

    if (ctx.services.has(CanvasPageResizeServiceId)) {
      const pageResize = ctx.services.get<PageResizeService>(
        CanvasPageResizeServiceId
      );
      const nextScene = pageResize.resizeSceneToPreset(
        ctx.scene.getDocument(),
        presetId
      );
      if (nextScene) {
        ctx.scene.apply({
          apply: () => nextScene,
          label: localize(ctx.services, 'canvas.history.resizePage', {
            defaultValue: 'Resize page',
          }),
        });
        return;
      }
    }

    const preset = resolvePagePreset(presetId);
    if (!preset) {
      return;
    }
    new SetPageSizeCommand().execute(ctx, {
      height: preset.height,
      width: preset.width,
    });
  }
}

export class ResizePagePresetCommand extends Command {
  readonly id = 'canvas.resizePagePreset';

  canExecute(ctx: CommandContext, args?: unknown): boolean {
    if (artboardRulesLayout(ctx.scene.getActiveArtboard()) !== 'absolute') {
      return false;
    }
    if (!canResizePage(ctx.scene.getDocument())) {
      return false;
    }
    return Boolean((args as PagePresetArgs | undefined)?.presetId);
  }

  execute(ctx: CommandContext, args?: unknown): void {
    const presetId = (args as PagePresetArgs | undefined)?.presetId;
    if (!presetId) {
      return;
    }
    applyPagePresetResize(ctx, presetId);
  }
}

export class UpdateLayerTransformCommand extends Command {
  readonly id = 'canvas.updateLayerTransform';

  canExecute(ctx: CommandContext, args?: unknown): boolean {
    const layerArgs = args as LayerTransformArgs | undefined;
    if (layerArgs?.layerId) {
      return canTransformLayerById(ctx, layerArgs.layerId);
    }

    const queued = getCommandRequests(ctx).peekQueuedTransformUpdate();
    if (queued) {
      return canTransformLayerById(ctx, queued.layerId);
    }

    return false;
  }

  execute(ctx: CommandContext, args?: unknown): void {
    const update =
      (args as LayerTransformArgs | undefined) ??
      getCommandRequests(ctx).takeQueuedTransformUpdate();
    if (!update) {
      return;
    }
    applyLayerTransform(
      ctx,
      update.layerId,
      update.transform,
      update.dataPatch
    );
  }
}

interface LayerRotationArgs {
  layerId: string;
  rotation: number;
}

export class SetLayerRotationCommand extends Command {
  readonly id = 'canvas.setLayerRotation';

  canExecute(ctx: CommandContext, args?: unknown): boolean {
    const layerId = (args as LayerRotationArgs | undefined)?.layerId;
    if (!layerId) {
      return false;
    }
    return canTransformLayerById(ctx, layerId);
  }

  execute(ctx: CommandContext, args?: unknown): void {
    const update = args as LayerRotationArgs | undefined;
    if (!update || !Number.isFinite(update.rotation)) {
      return;
    }
    setLayerRotation(ctx, update.layerId, update.rotation);
  }
}

export class RotateLayerLeftCommand extends Command {
  readonly id = 'canvas.rotateLeft';

  canExecute(ctx: CommandContext): boolean {
    return canTransformPrimaryLayer(ctx);
  }

  execute(ctx: CommandContext): void {
    adjustLayerRotation(ctx, -90);
  }
}

export class RotateLayerRightCommand extends Command {
  readonly id = 'canvas.rotateRight';

  canExecute(ctx: CommandContext): boolean {
    return canTransformPrimaryLayer(ctx);
  }

  execute(ctx: CommandContext): void {
    adjustLayerRotation(ctx, 90);
  }
}

export class UpdateRichTextTransformCommand extends Command {
  readonly id = 'canvas.updateRichTextTransform';

  canExecute(ctx: CommandContext, args?: unknown): boolean {
    const richArgs = args as RichTextTransformArgs | undefined;
    if (richArgs?.layerId) {
      return canTransformLayerById(ctx, richArgs.layerId);
    }

    const queued = getCommandRequests(ctx).peekQueuedRichTextTransformUpdate();
    if (queued) {
      return canTransformLayerById(ctx, queued.layerId);
    }

    return false;
  }

  execute(ctx: CommandContext, args?: unknown): void {
    const update =
      (args as RichTextTransformArgs | undefined) ??
      getCommandRequests(ctx).takeQueuedRichTextTransformUpdate();
    if (!update) {
      return;
    }
    ctx.scene.apply({
      apply: (scene) => ({
        ...scene,
        artboards: scene.artboards.map((page) => ({
          ...page,
          nodes: updateLayerInTree(page.nodes, update.layerId, (layer) => {
            const props =
              typeof layer.props === 'object' && layer.props !== null
                ? { ...(layer.props as Record<string, unknown>) }
                : {};
            props.fontSize = update.fontSize;
            return applyNodeTransform({ ...layer, props }, update.transform);
          }),
        })),
      }),
      label: localize(ctx.services, 'canvas.history.updateRichTextTransform', {
        defaultValue: 'Update rich text transform',
      }),
    });
  }
}

export class RegisterCanvasFontCommand extends Command {
  readonly id = 'canvas.registerFont';

  canExecute(ctx: CommandContext, args?: unknown): boolean {
    if (!ctx.services.has(FontServiceId)) {
      return false;
    }
    const font = args as FontDescriptor | undefined;
    return Boolean(font?.id && font?.family);
  }

  execute(ctx: CommandContext, args?: unknown): void {
    const font = args as FontDescriptor | undefined;
    if (!font?.id || !font.family) {
      return;
    }
    ctx.services.get<FontService>(FontServiceId).register(font);
  }
}

export class ExportImageCommand extends Command {
  readonly id = 'canvas.exportImage';

  canExecute(ctx: CommandContext): boolean {
    return Boolean(getDocumentExporter(ctx));
  }

  async execute(
    ctx: CommandContext,
    args?: unknown
  ): Promise<{ mimeType: string; dataUrl: string } | null> {
    const exporter = getDocumentExporter(ctx);
    if (!exporter) {
      return null;
    }
    const scene = ctx.scene.getDocument();
    const page = getActiveArtboard(scene);
    const options =
      args && typeof args === 'object'
        ? (args as {
            background?: 'transparent' | 'white' | string;
            dpi?: number;
            fileName?: string;
            format?: 'png' | 'jpg';
            quality?: number;
            scale?: number;
            strictAssets?: boolean;
            variables?: Record<string, string>;
          })
        : {};
    const format = options.format === 'jpg' ? 'jpg' : 'png';
    const result = await exporter.exportDocument(scene, page.id, {
      background: options.background,
      dpi: options.dpi,
      fileName: options.fileName,
      format,
      quality: options.quality,
      scale: options.scale,
      strictAssets: options.strictAssets,
      variables: options.variables,
    });
    return {
      dataUrl: bytesToDataUrl(result.data, result.mimeType),
      mimeType: result.mimeType,
    };
  }
}

function applyLayerTransform(
  ctx: CommandContext,
  layerId: string,
  transform: Transform,
  dataPatch?: Record<string, unknown>
): void {
  ctx.scene.apply({
    apply: (scene) => ({
      ...scene,
      artboards: scene.artboards.map((page) => ({
        ...page,
        nodes: updateLayerInTree(page.nodes, layerId, (layer) => {
          if (!dataPatch) {
            return applyNodeTransform(layer, transform);
          }

          const props =
            typeof layer.props === 'object' && layer.props !== null
              ? { ...(layer.props as Record<string, unknown>) }
              : {};
          for (const [key, value] of Object.entries(dataPatch)) {
            if (value === undefined) {
              delete props[key];
            } else {
              props[key] = value;
            }
          }
          return applyNodeTransform({ ...layer, props }, transform);
        }),
      })),
    }),
    label: localize(ctx.services, 'canvas.history.updateTransform', {
      defaultValue: 'Update transform',
    }),
  });
}

function setLayerRotation(
  ctx: CommandContext,
  layerId: string,
  rotation: number
): void {
  const layer = findNodeById(ctx.scene.getDocument(), layerId);
  if (!layer?.frame) {
    return;
  }
  applyLayerTransform(
    ctx,
    layerId,
    rotateTransformAroundCenter(nodeTransform(layer), rotation)
  );
}

function adjustLayerRotation(ctx: CommandContext, delta: number): void {
  const layer = ctx.scene.getPrimaryLayer();
  if (!layer?.frame) {
    return;
  }
  setLayerRotation(ctx, layer.id, nodeTransform(layer).rotation + delta);
}
