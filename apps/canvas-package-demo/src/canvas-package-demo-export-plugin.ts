import { downloadBytes, exportCanvasDocument } from '@openenvx/canvas-driver';
import {
  Command,
  getActivePage,
  TopBarContribution,
  WorkbenchPlugin,
  type CommandContext,
  type TopBarBuilder,
  type WorkbenchPluginContext,
} from '@openenvx/studio';
import { buildSampleVariableValues } from '@openenvx/studio/schema';

type ExportFormat = 'png' | 'jpg';

const DOWNLOAD_PNG_COMMAND_ID = 'canvas-package-demo.downloadPng';
const DOWNLOAD_JPG_COMMAND_ID = 'canvas-package-demo.downloadJpg';

abstract class DownloadCanvasExportCommand extends Command {
  abstract readonly format: ExportFormat;

  async execute(ctx: CommandContext): Promise<void> {
    const scene = ctx.scene.getScene();
    const page = getActivePage(scene);
    const format = this.format;
    try {
      const result = await exportCanvasDocument(scene, page.id, {
        format,
        variables: buildSampleVariableValues(scene),
      });
      const extension = format === 'jpg' ? 'jpg' : 'png';
      downloadBytes(
        result.data,
        result.mimeType,
        result.fileName ?? `artboard.${extension}`
      );
    } catch (error) {
      console.error(
        `[canvas-package-demo] ${format.toUpperCase()} export failed:`,
        error
      );
    }
  }
}

class DownloadPngCommand extends DownloadCanvasExportCommand {
  readonly id = DOWNLOAD_PNG_COMMAND_ID;
  readonly format = 'png';
}

class DownloadJpgCommand extends DownloadCanvasExportCommand {
  readonly id = DOWNLOAD_JPG_COMMAND_ID;
  readonly format = 'jpg';
}

class CanvasPackageDemoExportTopBarContribution extends TopBarContribution {
  contribute(builder: TopBarBuilder, _ctx: CommandContext): void {
    builder
      .placement('right')
      .command('canvas-package-demo-topbar-png', {
        commandId: DOWNLOAD_PNG_COMMAND_ID,
        label: 'Download PNG',
        priority: 18,
        variant: 'label',
      })
      .command('canvas-package-demo-topbar-jpg', {
        commandId: DOWNLOAD_JPG_COMMAND_ID,
        label: 'Download JPG',
        priority: 19,
        variant: 'label',
      });
  }
}

export class CanvasPackageDemoExportPlugin extends WorkbenchPlugin {
  readonly id = 'canvas-package-demo.export';

  activateWorkbench(ctx: WorkbenchPluginContext): void {
    ctx.register(new DownloadPngCommand(), new DownloadJpgCommand());
    ctx.registerWorkbench(new CanvasPackageDemoExportTopBarContribution());
  }
}

export const canvasPackageDemoExportPlugin =
  new CanvasPackageDemoExportPlugin();
