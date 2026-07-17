import type { MenuItemDescriptor } from '@openenvx/headless';
import { isCommandMenuItem, isRadioGroupMenuItem } from '@openenvx/headless';

import { useWorkbenchContext } from '../context/workbench-context';
import { useMenuChoiceProvider } from '../hooks/use-menu-choice-provider';
import { useWorkbenchContextSelector } from '../hooks/use-workbench-selector';
import {
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '../primitives/dropdown-menu';

interface DropdownMenuRendererProps {
  items: MenuItemDescriptor[];
}

function RadioGroupSubmenu({
  label,
  providerId,
}: {
  label: string;
  providerId: string;
}) {
  const provider = useMenuChoiceProvider(providerId);

  if (!provider) {
    return null;
  }

  const choices = provider.getChoices();
  const value = provider.getValue();

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>{label}</DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        <DropdownMenuRadioGroup
          onValueChange={(nextValue) => provider.setValue(nextValue)}
          value={value}
        >
          {choices.map((choice) => (
            <DropdownMenuRadioItem key={choice.value} value={choice.value}>
              {choice.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}

function renderMenuItems(
  items: MenuItemDescriptor[],
  executeCommand: (commandId: string) => Promise<boolean>,
  commandStates: Record<string, { canExecute: boolean }>
) {
  return items.map((item) => {
    if (item.kind === 'separator') {
      return <DropdownMenuSeparator key={item.id} />;
    }

    if (isRadioGroupMenuItem(item)) {
      return (
        <RadioGroupSubmenu
          key={item.id}
          label={item.label}
          providerId={item.providerId}
        />
      );
    }

    if (item.kind === 'submenu') {
      return (
        <DropdownMenuSub key={item.id}>
          <DropdownMenuSubTrigger>{item.label}</DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            {renderMenuItems(item.items, executeCommand, commandStates)}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      );
    }

    if (isCommandMenuItem(item)) {
      const canExecute = commandStates[item.commandId]?.canExecute ?? true;
      return (
        <DropdownMenuItem
          disabled={!canExecute}
          key={item.commandId}
          onSelect={() => void executeCommand(item.commandId)}
          shortcut={item.shortcut}
        >
          {item.label ?? item.commandId}
        </DropdownMenuItem>
      );
    }

    return null;
  });
}

export function DropdownMenuRenderer({ items }: DropdownMenuRendererProps) {
  const { executeCommand } = useWorkbenchContext();
  const commandStates = useWorkbenchContextSelector(
    (state) => state.commandStates
  );

  if (items.length === 0 || !commandStates) {
    return null;
  }

  return <>{renderMenuItems(items, executeCommand, commandStates)}</>;
}
