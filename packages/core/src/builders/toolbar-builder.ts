import { applyShellItemOptions, DescriptorBuilder } from './descriptor-builder';
import type { ShellItemOptions } from './descriptor-builder';
import type {
  ShellDropdownItemBase,
  ShellDropdownMenuItemDescriptor,
} from './shell-dropdown';

export interface ToolbarItemBase {
  id: string;
  when?: string;
  priority?: number;
  group?: number;
}

export interface ToolbarCommandItemDescriptor extends ToolbarItemBase {
  kind?: 'command';
  icon: string;
  labelKey: string;
  commandId: string;
}

export interface ToolbarSeparatorItemDescriptor extends ToolbarItemBase {
  kind: 'separator';
}

export interface ToolbarDropdownItemDescriptor extends ShellDropdownItemBase {
  variant?: 'toolbar';
}

export type ToolbarItemDescriptor =
  | ToolbarCommandItemDescriptor
  | ToolbarSeparatorItemDescriptor
  | ToolbarDropdownItemDescriptor;

export interface ToolbarCommandOptions extends ShellItemOptions {
  icon: string;
  labelKey: string;
  commandId: string;
  group?: number;
}

export interface ToolbarDropdownOptions extends ShellItemOptions {
  label?: string;
  labelBinding?: string;
  labelSuffix?: string;
  items: ShellDropdownMenuItemDescriptor[];
  group?: number;
}

export class ToolbarBuilder extends DescriptorBuilder<ToolbarItemDescriptor> {
  command(id: string, options: ToolbarCommandOptions): this {
    return this.push(
      applyShellItemOptions(
        {
          commandId: options.commandId,
          group: options.group,
          icon: options.icon,
          id,
          kind: 'command',
          labelKey: options.labelKey,
        },
        options
      )
    );
  }

  separator(id: string, options?: ShellItemOptions & { group?: number }): this {
    return this.push(
      applyShellItemOptions(
        {
          group: options?.group,
          id,
          kind: 'separator',
        },
        options
      )
    );
  }

  dropdown(id: string, options: ToolbarDropdownOptions): this {
    return this.push(
      applyShellItemOptions(
        {
          group: options.group,
          id,
          items: options.items,
          kind: 'dropdown',
          label: options.label,
          labelBinding: options.labelBinding,
          labelSuffix: options.labelSuffix,
          variant: 'toolbar',
        },
        options
      )
    );
  }

  item(descriptor: ToolbarItemDescriptor): this {
    return this.push(descriptor);
  }
}

export function createToolbarBuilder(): ToolbarBuilder {
  return new ToolbarBuilder();
}

export function isToolbarDropdownItem(
  item: ToolbarItemDescriptor
): item is ToolbarDropdownItemDescriptor {
  return item.kind === 'dropdown';
}
