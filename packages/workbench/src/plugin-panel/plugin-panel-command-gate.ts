import type { PluginPanelDeclaration } from '@openenvx/plugin-protocol';

export function canRunPluginPanelCommand(
  declaration: Pick<PluginPanelDeclaration, 'allowedCommands'>,
  permission: 'read' | 'edit',
  commandId: string
): boolean {
  return (
    permission === 'edit' && declaration.allowedCommands.includes(commandId)
  );
}
