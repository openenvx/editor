import type { CanvasExportFormat } from '@openenvx/canvas';
import {
  AssetServiceId,
  Command,
  getActivePage,
  StatusBarContribution,
  type StatusBarBuilder,
  type CommandContext,
} from '@openenvx/core';
import type { Scene } from '@openenvx/core/schema';

import { CanvasDemoExportServiceId } from '../services/canvas-demo-export-service';
import type { CanvasDemoExportService } from '../services/canvas-demo-export-service';
import {
  downloadBlob,
  exportViaService,
} from '../services/export-service-client';

export const CANVAS_DEMO_EXPORT_FORMATS = [
  'svg',
  'png',
  'jpg',
  'pdf',
] as const satisfies readonly CanvasExportFormat[];

export function canvasDemoExportCommandId(format: CanvasExportFormat): string {
  return `canvas-demo.export.${format}`;
}

function getExportService(ctx: CommandContext): CanvasDemoExportService | null {
  if (!ctx.services.has(CanvasDemoExportServiceId)) {
    return null;
  }
  return ctx.services.get(CanvasDemoExportServiceId);
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

export class CanvasDemoExportCommand extends Command {
  constructor(
    readonly id: string,
    private readonly format: CanvasExportFormat
  ) {
    super();
  }

  canExecute(ctx: CommandContext): boolean {
    const exportService = getExportService(ctx);
    return exportService?.getConfig().exportServiceUrl !== null;
  }

  async execute(ctx: CommandContext): Promise<void> {
    const exportService = getExportService(ctx);
    if (!exportService) {
      return;
    }

    const { exportServiceUrl } = exportService.getConfig();
    if (exportServiceUrl === null) {
      exportService.setExportStatus('Export service URL not configured');
      return;
    }

    exportService.setExportStatus('Exporting…');
    exportService.setExportResult(null);

    try {
      const scene = prepareExportScene(ctx);
      const page = getActivePage(scene);
      const result = await exportViaService(exportServiceUrl, {
        format: this.format,
        pageId: page.id,
        scene,
      });
      downloadBlob(result.blob, result.fileName);
      exportService.setExportStatus(`Exported ${this.format.toUpperCase()}`);
    } catch (error) {
      exportService.setExportStatus(
        error instanceof Error ? error.message : 'Export failed'
      );
      exportService.setExportResult(null);
    }
  }
}

export function createCanvasDemoExportCommands(): CanvasDemoExportCommand[] {
  return CANVAS_DEMO_EXPORT_FORMATS.map(
    (format) =>
      new CanvasDemoExportCommand(canvasDemoExportCommandId(format), format)
  );
}

export class CanvasDemoExportStatusBar extends StatusBarContribution {
  contribute(builder: StatusBarBuilder, ctx: CommandContext): void {
    const text = getExportService(ctx)?.getExportStatus();
    if (typeof text !== 'string' || text.length === 0) {
      return;
    }
    builder.left().text(text, {
      id: 'canvas-demo-export-status',
      priority: -20,
    });
  }
}
