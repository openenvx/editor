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

export interface ShellDropdownItemBase extends DescriptorItemBase {
  kind: 'dropdown';
  label?: string;
  labelKey?: string;
  labelBinding?: string;
  labelSuffix?: string;
  items: ShellDropdownMenuItemDescriptor[];
}
