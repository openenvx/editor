import {
  CanvasDocumentExportServiceId,
  type CanvasDocumentExportService,
  type CanvasExportFormat,
} from '@openenvx/canvas/document-export';
import { downloadBytes } from '@openenvx/canvas/export-bytes';
import { AssetServiceId, Command, getActivePage, Plugin } from '@openenvx/core';
import type { CommandContext, PluginContext } from '@openenvx/core';
import type { Scene } from '@openenvx/schema';

export const PLAYGROUND_EXPORT_FORMATS = [
  'svg',
  'png',
  'jpg',
] as const satisfies readonly CanvasExportFormat[];

function playgroundExportCommandId(format: CanvasExportFormat): string {
  return `playground.export.${format}`;
}

function getDocumentExporter(
  ctx: CommandContext
): CanvasDocumentExportService | undefined {
  if (!ctx.services.has(CanvasDocumentExportServiceId)) {
    return undefined;
  }
  return ctx.services.get(CanvasDocumentExportServiceId);
}

function prepareExportScene(ctx: CommandContext): Scene {
  const scene = structuredClone(ctx.scene.getScene());
  if (!ctx.services.has(AssetServiceId)) {
    return scene;
  }

  const assets = ctx.services.get(AssetServiceId);
  const referenced = assets.exportReferenced?.(scene);
  if (!referenced || Object.keys(referenced).length === 0) {
    return scene;
  }

  return { ...scene, assets: referenced };
}

class PlaygroundExportCommand extends Command {
  constructor(
    readonly id: string,
    private readonly format: CanvasExportFormat
  ) {
    super();
  }

  canExecute(ctx: CommandContext): boolean {
    const exporter = getDocumentExporter(ctx);
    return exporter?.supportsFormat(this.format) ?? false;
  }

  async execute(ctx: CommandContext): Promise<void> {
    const exporter = getDocumentExporter(ctx);
    if (!exporter) {
      return;
    }

    const scene = prepareExportScene(ctx);
    const page = getActivePage(scene);
    const result = await exporter.exportDocument(scene, page.id, {
      format: this.format,
    });
    const extension = this.format === 'jpg' ? 'jpg' : this.format;

    downloadBytes(
      result.data,
      result.mimeType,
      result.fileName ?? `artboard.${extension}`
    );
  }
}

export class PlaygroundExportPlugin extends Plugin {
  readonly id = 'playground-export';

  activate(ctx: PluginContext): void {
    ctx.register(
      ...PLAYGROUND_EXPORT_FORMATS.map(
        (format) =>
          new PlaygroundExportCommand(playgroundExportCommandId(format), format)
      )
    );
  }
}
