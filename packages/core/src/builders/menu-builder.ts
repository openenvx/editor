export interface CommandMenuItemDescriptor {
  kind?: 'command';
  commandId: string;
  label?: string;
  when?: string;
  shortcut?: string;
}

export interface SeparatorMenuItemDescriptor {
  kind: 'separator';
  id: string;
}

export interface SubmenuMenuItemDescriptor {
  kind: 'submenu';
  id: string;
  label: string;
  items: MenuItemDescriptor[];
}

export interface RadioGroupMenuItemDescriptor {
  kind: 'radioGroup';
  id: string;
  label: string;
  providerId: string;
}

export type MenuItemDescriptor =
  | CommandMenuItemDescriptor
  | SeparatorMenuItemDescriptor
  | SubmenuMenuItemDescriptor
  | RadioGroupMenuItemDescriptor;

export function isRadioGroupMenuItem(
  item: MenuItemDescriptor
): item is RadioGroupMenuItemDescriptor {
  return item.kind === 'radioGroup';
}

export function isCommandMenuItem(
  item: MenuItemDescriptor
): item is CommandMenuItemDescriptor {
  return item.kind === undefined || item.kind === 'command';
}

export class MenuBuilder {
  private readonly items: MenuItemDescriptor[] = [];

  item(commandId: string): MenuItemBuilder {
    const descriptor: CommandMenuItemDescriptor = { commandId };
    this.items.push(descriptor);
    return new MenuItemBuilder(descriptor);
  }

  separator(id: string): this {
    this.items.push({ id, kind: 'separator' });
    return this;
  }

  submenu(
    id: string,
    label: string,
    configure: (builder: MenuBuilder) => void
  ): this {
    const nested = createMenuBuilder();
    configure(nested);
    this.items.push({ id, items: nested.build(), kind: 'submenu', label });
    return this;
  }

  radioGroup(id: string, providerId: string, label: string): this {
    this.items.push({ id, kind: 'radioGroup', label, providerId });
    return this;
  }

  build(): MenuItemDescriptor[] {
    return [...this.items];
  }
}

export class MenuItemBuilder {
  constructor(private readonly item: CommandMenuItemDescriptor) {}

  label(label: string): this {
    this.item.label = label;
    return this;
  }

  when(expression: string): this {
    this.item.when = expression;
    return this;
  }

  shortcut(shortcut: string): this {
    this.item.shortcut = shortcut;
    return this;
  }
}

export function createMenuBuilder(): MenuBuilder {
  return new MenuBuilder();
}

function isSubmenuMenuItem(
  item: MenuItemDescriptor
): item is SubmenuMenuItemDescriptor {
  return item.kind === 'submenu';
}

export function filterMenuByWhen(
  items: MenuItemDescriptor[],
  evaluateWhen: (when?: string) => boolean
): MenuItemDescriptor[] {
  const filtered: MenuItemDescriptor[] = [];
  for (const item of items) {
    if (isSubmenuMenuItem(item)) {
      const nestedItems = filterMenuByWhen(item.items, evaluateWhen);
      if (nestedItems.length > 0) {
        filtered.push({ ...item, items: nestedItems });
      }
      continue;
    }
    if (isCommandMenuItem(item)) {
      if (evaluateWhen(item.when)) {
        filtered.push(item);
      }
      continue;
    }
    filtered.push(item);
  }
  return filtered;
}

export function filterMenuByCanExecute(
  items: MenuItemDescriptor[],
  canExecute: (commandId: string) => boolean
): MenuItemDescriptor[] {
  const filtered: MenuItemDescriptor[] = [];
  for (const item of items) {
    if (isSubmenuMenuItem(item)) {
      const nestedItems = filterMenuByCanExecute(item.items, canExecute);
      if (nestedItems.length > 0) {
        filtered.push({ ...item, items: nestedItems });
      }
      continue;
    }
    if (isCommandMenuItem(item) && !canExecute(item.commandId)) {
      continue;
    }
    filtered.push(item);
  }
  return filtered;
}

export function mergeMenuContributions(
  contributions: MenuItemDescriptor[][]
): MenuItemDescriptor[] {
  return contributions.flat();
}
