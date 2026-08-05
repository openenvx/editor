import type { PluginPanelDeclaration } from '@xmazu/openenvxee-protocol';

export function canRunPluginPanelCommand(
  declaration: Pick<PluginPanelDeclaration, 'allowedCommands'>,
  permission: 'read' | 'edit',
  commandId: string
): boolean {
  return (
    permission === 'edit' && declaration.allowedCommands.includes(commandId)
  );
}
