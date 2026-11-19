import { parseValidProjectSnapshot } from '@openenvx/editor/schema';
import { Command, type CommandContext } from '@openenvx/studio';

import { requireDocumentStore } from '../../document-store-access';
import { AssetServiceId, EditorServiceId } from '../../tokens';
import { VersionHistoryProviderId } from '../../version-history/version-history-service-id';

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
      ctx.services.get(EditorServiceId)?.getActiveEditor() !== null
    );
  }

  async execute(ctx: CommandContext, args?: unknown): Promise<void> {
    if (!isRestoreVersionArgs(args)) {
      return;
    }
    if (!ctx.services.has(VersionHistoryProviderId)) {
      return;
    }
    const editor = ctx.services.get(EditorServiceId)?.getActiveEditor();
    if (!editor) {
      return;
    }

    const provider = ctx.services.get(VersionHistoryProviderId)!;
    const loaded = await provider.loadVersion(editor.uri, args.versionId);
    const snapshot = parseValidProjectSnapshot(loaded);

    if (ctx.services.has(AssetServiceId)) {
      ctx.services.get(AssetServiceId).hydrate?.(snapshot.document.assets);
    }

    requireDocumentStore(ctx).restoreSnapshot({
      contentRevision: requireDocumentStore(ctx).getContentRevision() + 1,
      session: snapshot.session,
      document: snapshot.document,
    });
  }
}
