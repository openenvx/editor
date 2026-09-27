import type { DescriptorItemBase } from './descriptor-builder';
import type { RadioGroupMenuItemDescriptor } from './menu-builder';

export interface ShellDropdownCommandMenuItemDescriptor {
  kind?: 'command';
  commandId: string;
  args?: unknown;
  label?: string;
  labelKey?: string;
  when?: string;
  shortcut?: string;
}

export type ShellDropdownMenuItemDescriptor =
  | ShellDropdownCommandMenuItemDescriptor
  | RadioGroupMenuItemDescriptor;

export function isShellDropdownCommandMenuItem(
  item: ShellDropdownMenuItemDescriptor
): item is ShellDropdownCommandMenuItemDescriptor {
  return item.kind === undefined || item.kind === 'command';
}

/** Stable React key for shell dropdown command rows (commandId may repeat with different args). */
export function shellDropdownMenuItemId(
  dropdownId: string,
  item: ShellDropdownCommandMenuItemDescriptor,
  index: number
): string {
  const base = `${dropdownId}-${item.commandId}`;
  if (item.args !== undefined) {
    return `${base}-${JSON.stringify(item.args)}`;
  }
  if (item.labelKey) {
    return `${base}-${item.labelKey}`;
  }
  if (item.label) {
    return `${base}-${item.label}`;
  }
  return `${base}-${index}`;
}

export interface ShellDropdownItemBase extends DescriptorItemBase {
  kind: 'dropdown';
  label?: string;
  labelKey?: string;
  labelBinding?: string;
  labelSuffix?: string;
  items: ShellDropdownMenuItemDescriptor[];
}
