import { applyShellItemOptions, DescriptorBuilder } from './descriptor-builder';
import type { ShellItemOptions } from './descriptor-builder';
import type {
  ShellDropdownItemBase,
  ShellDropdownMenuItemDescriptor,
} from './shell-dropdown';

export type TopBarPlacement = 'left' | 'center' | 'right';

export const TOP_BAR_PLACEMENTS: readonly TopBarPlacement[] = [
  'left',
  'center',
  'right',
] as const;

export type TopBarTitleBinding = 'editorTitle';

interface TopBarItemBase {
  id: string;
  placement: TopBarPlacement;
  when?: string;
  priority?: number;
  group?: number;
}

export interface TopBarCommandItemDescriptor extends TopBarItemBase {
  kind?: 'command';
  commandId: string;
  args?: unknown;
  icon?: string;
  label?: string;
  labelKey?: string;
  ariaLabel?: string;
  ariaLabelKey?: string;
  toggledWhen?: string;
  variant?: 'icon' | 'label' | 'primary';
  /** Hide the item when its command cannot execute. */
  hideWhenDisabled?: boolean;
}

export interface TopBarSeparatorItemDescriptor extends TopBarItemBase {
  kind: 'separator';
}

export interface TopBarDropdownItemDescriptor
  extends ShellDropdownItemBase, TopBarItemBase {
  kind: 'dropdown';
  icon?: string;
  variant?: 'icon' | 'menu';
}

export interface TopBarTitleItemDescriptor extends TopBarItemBase {
  kind: 'title';
  title?: string;
  titleKey?: string;
  titleBinding?: TopBarTitleBinding;
}

export interface TopBarStatusItemDescriptor extends TopBarItemBase {
  kind: 'status';
  icon?: string;
  label?: string;
  labelKey?: string;
}

export interface TopBarGroupItemDescriptor extends TopBarItemBase {
  kind: 'group';
  groupVariant: 'segmented' | 'inline';
  items: TopBarCommandItemDescriptor[];
}

export type TopBarItemDescriptor =
  | TopBarCommandItemDescriptor
  | TopBarSeparatorItemDescriptor
  | TopBarDropdownItemDescriptor
  | TopBarTitleItemDescriptor
  | TopBarStatusItemDescriptor
  | TopBarGroupItemDescriptor;

export interface TopBarCommandOptions extends ShellItemOptions {
  commandId: string;
  args?: unknown;
  icon?: string;
  label?: string;
  labelKey?: string;
  ariaLabel?: string;
  ariaLabelKey?: string;
  toggledWhen?: string;
  variant?: 'icon' | 'label' | 'primary';
  group?: number;
  hideWhenDisabled?: boolean;
}

export interface TopBarDropdownOptions extends ShellItemOptions {
  icon?: string;
  label?: string;
  labelKey?: string;
  labelBinding?: string;
  labelSuffix?: string;
  items: ShellDropdownMenuItemDescriptor[];
  variant?: 'icon' | 'menu';
  group?: number;
}

export interface TopBarTitleOptions extends ShellItemOptions {
  title?: string;
  titleKey?: string;
  titleBinding?: TopBarTitleBinding;
  group?: number;
}

export interface TopBarStatusOptions extends ShellItemOptions {
  icon?: string;
  label?: string;
  labelKey?: string;
  group?: number;
}

export interface TopBarGroupOptions extends ShellItemOptions {
  groupVariant: 'segmented' | 'inline';
  items: TopBarCommandItemDescriptor[];
  group?: number;
}

class TopBarRegionBuilder {
  constructor(
    private readonly parent: TopBarBuilder,
    private readonly placement: TopBarPlacement
  ) {}

  command(id: string, options: TopBarCommandOptions): this {
    this.parent.append(
      applyShellItemOptions(
        {
          args: options.args,
          ariaLabel: options.ariaLabel,
          ariaLabelKey: options.ariaLabelKey,
          commandId: options.commandId,
          group: options.group,
          hideWhenDisabled: options.hideWhenDisabled,
          icon: options.icon,
          id,
          kind: 'command',
          label: options.label,
          labelKey: options.labelKey,
          placement: this.placement,
          toggledWhen: options.toggledWhen,
          variant: options.variant,
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

  dropdown(id: string, options: TopBarDropdownOptions): this {
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
          variant: options.variant,
        },
        options
      )
    );
    return this;
  }

  title(id: string, options: TopBarTitleOptions): this {
    this.parent.append(
      applyShellItemOptions(
        {
          group: options.group,
          id,
          kind: 'title',
          placement: this.placement,
          title: options.title,
          titleBinding: options.titleBinding,
          titleKey: options.titleKey,
        },
        options
      )
    );
    return this;
  }

  status(id: string, options: TopBarStatusOptions): this {
    this.parent.append(
      applyShellItemOptions(
        {
          group: options.group,
          icon: options.icon,
          id,
          kind: 'status',
          label: options.label,
          labelKey: options.labelKey,
          placement: this.placement,
        },
        options
      )
    );
    return this;
  }

  group(id: string, options: TopBarGroupOptions): this {
    this.parent.append(
      applyShellItemOptions(
        {
          group: options.group,
          groupVariant: options.groupVariant,
          id,
          items: options.items.map((item) => ({
            ...item,
            placement: this.placement,
          })),
          kind: 'group',
          placement: this.placement,
        },
        options
      )
    );
    return this;
  }

  end(): TopBarBuilder {
    return this.parent;
  }

  build(): TopBarItemDescriptor[] {
    return this.parent.build();
  }
}

export class TopBarBuilder extends DescriptorBuilder<TopBarItemDescriptor> {
  append(item: TopBarItemDescriptor): this {
    return this.push(item);
  }

  placement(placement: TopBarPlacement): TopBarRegionBuilder {
    return new TopBarRegionBuilder(this, placement);
  }
}

export function createTopBarBuilder(): TopBarBuilder {
  return new TopBarBuilder();
}

export function isTopBarDropdownItem(
  item: TopBarItemDescriptor
): item is TopBarDropdownItemDescriptor {
  return item.kind === 'dropdown';
}

export function isTopBarGroupItem(
  item: TopBarItemDescriptor
): item is TopBarGroupItemDescriptor {
  return item.kind === 'group';
}
