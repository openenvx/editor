export const COMMAND_PALETTE_ALL_TAB_ID = 'all';

export interface CommandPaletteTabDescriptor {
  id: string;
  label: string;
}

export interface CommandPaletteCategoryDescriptor {
  id: string;
  label: string;
}

export interface CommandPaletteItemDescriptor {
  commandId: string;
  label: string;
  categoryId?: string;
  tabId?: string;
  keywords?: string[];
  when?: string;
  shortcut?: string;
}

export interface CommandPaletteDescriptor {
  tabs: CommandPaletteTabDescriptor[];
  categories: CommandPaletteCategoryDescriptor[];
  items: CommandPaletteItemDescriptor[];
}

export interface CommandPaletteOverride {
  commandId: string;
  label?: string;
  categoryId?: string;
  tabId?: string;
  keywords?: string[];
  when?: string;
  shortcut?: string;
  hidden?: boolean;
}

export interface CommandPaletteContributionBuild {
  tabs: CommandPaletteTabDescriptor[];
  categories: CommandPaletteCategoryDescriptor[];
  overrides: CommandPaletteOverride[];
}

function camelToWords(value: string): string {
  return value
    .replaceAll(/([a-z])([A-Z])/g, '$1 $2')
    .replaceAll(/[-_]/g, ' ')
    .trim();
}

function titleCase(value: string): string {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/** VSCode-style default label: 'scene.undo' -> category 'Scene', label 'Undo'. */
export function humanizeCommandId(commandId: string): {
  categoryId?: string;
  categoryLabel?: string;
  label: string;
} {
  const parts = commandId.split('.');
  if (parts.length === 1) {
    return { label: titleCase(camelToWords(parts[0])) };
  }

  const categoryId = parts[0];
  const actionLabel = titleCase(
    parts
      .slice(1)
      .map((part) => camelToWords(part))
      .join(' ')
  );

  return {
    categoryId,
    categoryLabel: titleCase(camelToWords(categoryId)),
    label: actionLabel,
  };
}

export class CommandPaletteBuilder {
  private readonly tabs: CommandPaletteTabDescriptor[] = [];
  private readonly categories: CommandPaletteCategoryDescriptor[] = [];
  private readonly overrides: CommandPaletteOverride[] = [];

  tab(id: string, label: string): this {
    if (id === COMMAND_PALETTE_ALL_TAB_ID) {
      return this;
    }
    this.tabs.push({ id, label });
    return this;
  }

  category(id: string, label: string): this {
    this.categories.push({ id, label });
    return this;
  }

  item(commandId: string): CommandPaletteItemBuilder {
    const override: CommandPaletteOverride = { commandId };
    this.overrides.push(override);
    return new CommandPaletteItemBuilder(override);
  }

  build(): CommandPaletteContributionBuild {
    return {
      tabs: [...this.tabs],
      categories: [...this.categories],
      overrides: [...this.overrides],
    };
  }
}

export class CommandPaletteItemBuilder {
  constructor(private readonly override: CommandPaletteOverride) {}

  label(label: string): this {
    this.override.label = label;
    return this;
  }

  category(categoryId: string): this {
    this.override.categoryId = categoryId;
    return this;
  }

  tab(tabId: string): this {
    this.override.tabId = tabId;
    return this;
  }

  keywords(...keywords: string[]): this {
    this.override.keywords = keywords;
    return this;
  }

  when(expression: string): this {
    this.override.when = expression;
    return this;
  }

  shortcut(shortcut: string): this {
    this.override.shortcut = shortcut;
    return this;
  }

  hide(): this {
    this.override.hidden = true;
    return this;
  }
}

export function createCommandPaletteBuilder(): CommandPaletteBuilder {
  return new CommandPaletteBuilder();
}

function mergeOverrides(
  contributions: CommandPaletteContributionBuild[]
): Map<string, CommandPaletteOverride> {
  const merged = new Map<string, CommandPaletteOverride>();

  for (const contribution of contributions) {
    for (const override of contribution.overrides) {
      const existing = merged.get(override.commandId);
      if (!existing) {
        merged.set(override.commandId, { ...override });
        continue;
      }

      merged.set(override.commandId, {
        commandId: override.commandId,
        categoryId: override.categoryId ?? existing.categoryId,
        tabId: override.tabId ?? existing.tabId,
        hidden: existing.hidden || override.hidden,
        keywords:
          override.keywords || existing.keywords
            ? [...(existing.keywords ?? []), ...(override.keywords ?? [])]
            : undefined,
        label: override.label ?? existing.label,
        shortcut: override.shortcut ?? existing.shortcut,
        when: override.when ?? existing.when,
      });
    }
  }

  return merged;
}

function mergeCategories(
  contributions: CommandPaletteContributionBuild[],
  derived: CommandPaletteCategoryDescriptor[]
): CommandPaletteCategoryDescriptor[] {
  const categories = new Map<string, CommandPaletteCategoryDescriptor>();

  for (const category of derived) {
    categories.set(category.id, category);
  }

  for (const contribution of contributions) {
    for (const category of contribution.categories) {
      if (!categories.has(category.id)) {
        categories.set(category.id, category);
      }
    }
  }

  return [...categories.values()];
}

function mergeTabs(
  contributions: CommandPaletteContributionBuild[],
  t: (key: string, defaultValue?: string) => string
): CommandPaletteTabDescriptor[] {
  const tabs = new Map<string, CommandPaletteTabDescriptor>([
    [
      COMMAND_PALETTE_ALL_TAB_ID,
      {
        id: COMMAND_PALETTE_ALL_TAB_ID,
        label: t('core.commandPalette.all', 'All'),
      },
    ],
  ]);

  for (const contribution of contributions) {
    for (const tab of contribution.tabs) {
      if (!tabs.has(tab.id)) {
        tabs.set(tab.id, tab);
      }
    }
  }

  return [...tabs.values()];
}

/**
 * Merges every registered command (auto-listed, humanized) with contributed
 * overrides (enrich label/category/keywords/shortcut, or hide) and contributed
 * categories, then drops anything failing `when`.
 */
export function buildCommandPalette(
  commandIds: string[],
  contributions: CommandPaletteContributionBuild[],
  evaluateWhen: (when: string | undefined) => boolean,
  t: (key: string, defaultValue?: string) => string
): CommandPaletteDescriptor {
  const overrideMap = mergeOverrides(contributions);
  const derivedCategories = new Map<string, CommandPaletteCategoryDescriptor>();
  const items: CommandPaletteItemDescriptor[] = [];

  for (const commandId of commandIds) {
    const override = overrideMap.get(commandId);
    if (override?.hidden) {
      continue;
    }

    const humanized = humanizeCommandId(commandId);
    const categoryId = override?.categoryId ?? humanized.categoryId;
    const label = override?.label ?? t(`command.${commandId}`, humanized.label);

    if (
      categoryId &&
      humanized.categoryLabel &&
      categoryId === humanized.categoryId &&
      !derivedCategories.has(categoryId)
    ) {
      derivedCategories.set(categoryId, {
        id: categoryId,
        label: t(
          `core.commandPalette.category.${categoryId}`,
          humanized.categoryLabel
        ),
      });
    }

    const item: CommandPaletteItemDescriptor = {
      commandId,
      label,
      ...(categoryId ? { categoryId } : {}),
      ...(override?.tabId ? { tabId: override.tabId } : {}),
      ...(override?.keywords ? { keywords: [...override.keywords] } : {}),
      ...(override?.when ? { when: override.when } : {}),
      ...(override?.shortcut ? { shortcut: override.shortcut } : {}),
    };

    if (!evaluateWhen(item.when)) {
      continue;
    }

    items.push(item);
  }

  const categories = mergeCategories(contributions, [
    ...derivedCategories.values(),
  ]);
  const categoryLabels = new Map(
    categories.map((category) => [category.id, category.label])
  );

  for (const item of items) {
    if (!item.categoryId) {
      continue;
    }

    const categoryLabel = categoryLabels.get(item.categoryId);
    if (categoryLabel) {
      continue;
    }

    categories.push({
      id: item.categoryId,
      label: t(
        `core.commandPalette.category.${item.categoryId}`,
        titleCase(camelToWords(item.categoryId))
      ),
    });
    categoryLabels.set(
      item.categoryId,
      t(
        `core.commandPalette.category.${item.categoryId}`,
        titleCase(camelToWords(item.categoryId))
      )
    );
  }

  return {
    tabs: mergeTabs(contributions, t),
    categories: categories.toSorted((a, b) => a.label.localeCompare(b.label)),
    items: items.toSorted((a, b) => a.label.localeCompare(b.label)),
  };
}
