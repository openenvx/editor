import { applyShellItemOptions, DescriptorBuilder } from './descriptor-builder';
import type { ShellItemOptions } from './descriptor-builder';
import type {
  ShellDropdownItemBase,
  ShellDropdownMenuItemDescriptor,
} from './shell-dropdown';

/** Absolute overlay slots over the editor chrome. */
export type ToolbarPlacement =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

export const TOOLBAR_PLACEMENTS: readonly ToolbarPlacement[] = [
  'top-left',
  'top-center',
  'top-right',
  'bottom-left',
  'bottom-center',
  'bottom-right',
] as const;

interface ToolbarItemBase {
  id: string;
  placement: ToolbarPlacement;
  when?: string;
  priority?: number;
  group?: number;
  /** Context-key when-expression; button renders pressed while true. */
  toggledWhen?: string;
}

export interface ToolbarCommandItemDescriptor extends ToolbarItemBase {
  kind?: 'command';
  icon: string;
  labelKey: string;
  commandId: string;
  args?: unknown;
}

export interface ToolbarSeparatorItemDescriptor extends ToolbarItemBase {
  kind: 'separator';
}

export interface ToolbarDropdownItemDescriptor
  extends ShellDropdownItemBase, ToolbarItemBase {
  variant?: 'toolbar';
  icon?: string;
}

export type ToolbarItemDescriptor =
  | ToolbarCommandItemDescriptor
  | ToolbarSeparatorItemDescriptor
  | ToolbarDropdownItemDescriptor;

export interface ToolbarCommandOptions extends ShellItemOptions {
  icon: string;
  labelKey: string;
  commandId: string;
  args?: unknown;
  group?: number;
  toggledWhen?: string;
}

export interface ToolbarDropdownOptions extends ShellItemOptions {
  icon?: string;
  label?: string;
  labelKey?: string;
  labelBinding?: string;
  labelSuffix?: string;
  items: ShellDropdownMenuItemDescriptor[];
  group?: number;
}

class ToolbarRegionBuilder {
  constructor(
    private readonly parent: ToolbarBuilder,
    private readonly placement: ToolbarPlacement
  ) {}

  command(id: string, options: ToolbarCommandOptions): this {
    this.parent.append(
      applyShellItemOptions(
        {
          args: options.args,
          commandId: options.commandId,
          group: options.group,
          icon: options.icon,
          id,
          kind: 'command',
          labelKey: options.labelKey,
          placement: this.placement,
          toggledWhen: options.toggledWhen,
        },
        options
      )
    );
    return this;
  }

  separator(id: string, options?: ShellItemOptions & { group?: number }): this {
    this.parent.append(
      applyShellItemOptions(
        {
          group: options?.group,
          id,
          kind: 'separator',
          placement: this.placement,
        },
        options
      )
    );
    return this;
  }

  dropdown(id: string, options: ToolbarDropdownOptions): this {
    this.parent.append(
      applyShellItemOptions(
        {
          group: options.group,
          icon: options.icon,
          id,
          items: options.items,
          kind: 'dropdown',
          label: options.label,
          labelBinding: options.labelBinding,
          labelKey: options.labelKey,
          labelSuffix: options.labelSuffix,
          placement: this.placement,
          variant: 'toolbar',
        },
        options
      )
    );
    return this;
  }

  item(descriptor: ToolbarItemDescriptor): this {
    this.parent.append({ ...descriptor, placement: this.placement });
    return this;
  }

  end(): ToolbarBuilder {
    return this.parent;
  }
}

export class ToolbarBuilder extends DescriptorBuilder<ToolbarItemDescriptor> {
  append(item: ToolbarItemDescriptor): this {
    return this.push(item);
  }

  placement(placement: ToolbarPlacement): ToolbarRegionBuilder {
    return new ToolbarRegionBuilder(this, placement);
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

export function isToolbarTopPlacement(placement: ToolbarPlacement): boolean {
  return placement.startsWith('top-');
}
