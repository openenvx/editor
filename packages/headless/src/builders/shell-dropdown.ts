import type { DescriptorItemBase } from './descriptor-builder';

export interface ShellDropdownMenuItemDescriptor {
  kind?: 'command';
  commandId: string;
  label?: string;
  labelKey?: string;
  when?: string;
  shortcut?: string;
}

export interface ShellDropdownItemBase extends DescriptorItemBase {
  kind: 'dropdown';
  label?: string;
  labelBinding?: string;
  labelSuffix?: string;
  items: ShellDropdownMenuItemDescriptor[];
}
