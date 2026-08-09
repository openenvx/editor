import { applyShellItemOptions } from './descriptor-builder';
import type { ShellItemOptions } from './descriptor-builder';
import type { MenuBuilder, MenuItemDescriptor } from './menu-builder';
import { createMenuBuilder } from './menu-builder';

export type SidebarHeaderTitleBinding = 'editorTitle';

export interface SidebarHeaderActionDescriptor {
  id: string;
  icon: string;
  commandId: string;
  label?: string;
  labelKey?: string;
  when?: string;
  priority?: number;
}

export interface SidebarHeaderDescriptor {
  /** View container this header applies to (one activity-bar panel). */
  containerId: string;
  title?: string;
  titleKey?: string;
  titleBinding?: SidebarHeaderTitleBinding;
  menuItems?: MenuItemDescriptor[];
  actions: SidebarHeaderActionDescriptor[];
  showMoveMenu: boolean;
  priority: number;
}

export interface SidebarHeaderActionOptions extends ShellItemOptions {
  icon: string;
  commandId: string;
  label?: string;
  labelKey?: string;
}

/**
 * Descriptor builder for a container-scoped sidebar header.
 * One winning contribution per {@link SidebarHeaderDescriptor.containerId}.
 */
export class SidebarHeaderBuilder {
  private titleText?: string;
  private titleKeyValue?: string;
  private titleBindingValue?: SidebarHeaderTitleBinding;
  private menuItems?: MenuItemDescriptor[];
  private readonly actionItems: SidebarHeaderActionDescriptor[] = [];
  private moveMenu = true;

  title(text: string): this {
    this.titleText = text;
    return this;
  }

  titleKey(key: string): this {
    this.titleKeyValue = key;
    return this;
  }

  /** Resolve the title at render time from workbench state. */
  titleBinding(binding: SidebarHeaderTitleBinding): this {
    this.titleBindingValue = binding;
    return this;
  }

  /**
   * When set, the title becomes a dropdown trigger using the full
   * workbench menu vocabulary (commands, radio groups, submenus).
   */
  titleMenu(build: (menu: MenuBuilder) => void): this {
    const menu = createMenuBuilder();
    build(menu);
    this.menuItems = menu.build();
    return this;
  }

  action(id: string, options: SidebarHeaderActionOptions): this {
    this.actionItems.push(
      applyShellItemOptions(
        {
          commandId: options.commandId,
          icon: options.icon,
          id,
          label: options.label,
          labelKey: options.labelKey,
        },
        options
      )
    );
    return this;
  }

  showMoveMenu(show: boolean): this {
    this.moveMenu = show;
    return this;
  }

  build(containerId: string, priority = 0): SidebarHeaderDescriptor {
    return {
      actions: [...this.actionItems].toSorted(
        (a, b) => (a.priority ?? 0) - (b.priority ?? 0)
      ),
      containerId,
      menuItems: this.menuItems,
      priority,
      showMoveMenu: this.moveMenu,
      title: this.titleText,
      titleBinding: this.titleBindingValue,
      titleKey: this.titleKeyValue,
    };
  }
}

export function createSidebarHeaderBuilder(): SidebarHeaderBuilder {
  return new SidebarHeaderBuilder();
}
