import type { CommandPaletteDescriptor } from '@openenvx/headless';
import { COMMAND_PALETTE_ALL_TAB_ID } from '@openenvx/headless';
import { useCallback, useMemo, useState } from 'react';

import { usePresence } from '../hooks/use-presence';
import { useWorkbenchTranslation } from '../i18n/use-workbench-translation';
import { cn } from '../lib/cn';
import { formatShortcut } from '../lib/format-shortcut';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '../primitives/command';

import overlaySurface from '../primitives/overlay-surface.module.css';
import styles from './command-palette.module.css';

const UNCATEGORIZED_GROUP_ID = '__other__';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  commandPalette: CommandPaletteDescriptor;
  commandStates: Record<string, { canExecute: boolean }>;
  executeCommand: (commandId: string) => Promise<boolean>;
}

export function CommandPaletteRenderer({
  open,
  onOpenChange,
  commandPalette,
  commandStates,
  executeCommand,
}: Props) {
  const { t } = useWorkbenchTranslation();
  const { present, state } = usePresence(open);
  const [activeTabId, setActiveTabId] = useState(COMMAND_PALETTE_ALL_TAB_ID);

  const closePalette = useCallback(() => {
    setActiveTabId(COMMAND_PALETTE_ALL_TAB_ID);
    onOpenChange(false);
  }, [onOpenChange]);

  const showTabs = commandPalette.tabs.length > 1;

  const categoryLabels = useMemo(
    () =>
      new Map(
        commandPalette.categories.map((category) => [
          category.id,
          category.label,
        ])
      ),
    [commandPalette.categories]
  );

  const tabFilteredItems = useMemo(() => {
    if (!showTabs || activeTabId === COMMAND_PALETTE_ALL_TAB_ID) {
      return commandPalette.items;
    }

    return commandPalette.items.filter((item) => item.tabId === activeTabId);
  }, [activeTabId, commandPalette.items, showTabs]);

  const groupedItems = useMemo(() => {
    const groups = new Map<string, CommandPaletteDescriptor['items']>();

    for (const item of tabFilteredItems) {
      const groupId = item.categoryId ?? UNCATEGORIZED_GROUP_ID;
      const existing = groups.get(groupId) ?? [];
      existing.push(item);
      groups.set(groupId, existing);
    }

    const orderedGroupIds = [
      ...commandPalette.categories.map((category) => category.id),
      ...(groups.has(UNCATEGORIZED_GROUP_ID) ? [UNCATEGORIZED_GROUP_ID] : []),
    ].filter((groupId, index, all) => all.indexOf(groupId) === index);

    return orderedGroupIds
      .map((groupId) => ({
        heading:
          groupId === UNCATEGORIZED_GROUP_ID
            ? t('commandPalette.other')
            : (categoryLabels.get(groupId) ?? groupId),
        id: groupId,
        items: groups.get(groupId) ?? [],
      }))
      .filter((group) => group.items.length > 0);
  }, [categoryLabels, commandPalette.categories, t, tabFilteredItems]);

  if (!present) {
    return null;
  }

  return (
    <div
      className={cn(styles.backdrop, overlaySurface.backdrop)}
      data-state={state}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          closePalette();
        }
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          closePalette();
        }
      }}
      role="presentation"
    >
      <div
        aria-label={t('commandPalette.title')}
        aria-modal="true"
        className={cn(styles.panel, overlaySurface.surface)}
        data-state={state}
        role="dialog"
      >
        <Command className={styles.command}>
          <CommandInput
            autoFocus
            className={styles.searchInput}
            placeholder={t('commandPalette.search')}
          />
          {showTabs ? (
            <div
              aria-label={t('commandPalette.filters')}
              className={styles.tabs}
              role="tablist"
            >
              {commandPalette.tabs.map((tab) => {
                const selected = tab.id === activeTabId;

                return (
                  <button
                    aria-selected={selected}
                    className={selected ? styles.tabActive : styles.tab}
                    key={tab.id}
                    onClick={() => setActiveTabId(tab.id)}
                    role="tab"
                    type="button"
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          ) : null}
          <CommandList className={styles.list}>
            <CommandEmpty className={styles.empty}>
              {t('commandPalette.noResults')}
            </CommandEmpty>
            {groupedItems.map((group) => (
              <CommandGroup
                className={styles.group}
                heading={group.heading}
                key={group.id}
              >
                {group.items.map((item) => {
                  const canExecute =
                    commandStates[item.commandId]?.canExecute ?? true;

                  return (
                    <CommandItem
                      className={styles.item}
                      disabled={!canExecute}
                      key={item.commandId}
                      keywords={[item.commandId, ...(item.keywords ?? [])]}
                      onSelect={() => {
                        void executeCommand(item.commandId);
                        closePalette();
                      }}
                      value={`${item.label} ${item.commandId}`}
                    >
                      <span className={styles.itemRow}>
                        <span className={styles.itemLabel}>{item.label}</span>
                        {item.shortcut ? (
                          <span className={styles.shortcut}>
                            {formatShortcut(item.shortcut)}
                          </span>
                        ) : null}
                      </span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </div>
    </div>
  );
}
