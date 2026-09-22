import {
  AssetServiceId,
  Command,
  type CommandContext,
  VersionHistoryProviderId,
} from '#studio';
import { parseValidProjectSnapshot } from '#studio/schema';

export const VERSION_HISTORY_RESTORE_COMMAND_ID = 'versionHistory.restore';

export interface RestoreVersionArgs {
  versionId: string;
}

function isRestoreVersionArgs(args: unknown): args is RestoreVersionArgs {
  return (
    typeof args === 'object' &&
    args !== null &&
    typeof (args as RestoreVersionArgs).versionId === 'string' &&
    (args as RestoreVersionArgs).versionId.length > 0
  );
}

export class RestoreVersionCommand extends Command {
  readonly id = VERSION_HISTORY_RESTORE_COMMAND_ID;

  canExecute(ctx: CommandContext, args?: unknown): boolean {
    return (
      isRestoreVersionArgs(args) &&
      ctx.services.has(VersionHistoryProviderId) &&
      ctx.editor.getActiveEditor() !== null
    );
  }

  async execute(ctx: CommandContext, args?: unknown): Promise<void> {
    if (!isRestoreVersionArgs(args)) {
      return;
    }
    if (!ctx.services.has(VersionHistoryProviderId)) {
      return;
    }
    const editor = ctx.editor.getActiveEditor();
    if (!editor) {
      return;
    }

    const provider = ctx.services.get(VersionHistoryProviderId);
    const loaded = await provider.loadVersion(editor.uri, args.versionId);
    const snapshot = parseValidProjectSnapshot(loaded);

    if (ctx.services.has(AssetServiceId)) {
      ctx.services.get(AssetServiceId).hydrate?.(snapshot.document.assets);
    }

    ctx.scene.restoreSnapshot({
      contentRevision: ctx.scene.getContentRevision() + 1,
      session: snapshot.session,
      document: snapshot.document,
    });
  }
}
