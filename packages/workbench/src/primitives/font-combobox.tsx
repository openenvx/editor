import { useVirtualizer } from '@tanstack/react-virtual';
import { Check, ChevronDown } from 'lucide-react';
import { useId, useLayoutEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';

import { useWorkbenchTranslation } from '../i18n/use-workbench-translation';
import { cn } from '../lib/cn';
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from './command';
import { PropertyAnchoredPopover } from './property-anchored-popover';

import styles from './font-combobox.module.css';

export interface FontOption {
  value: string;
  label: string;
}

export interface FontComboboxProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: FontOption[];
  /** Preloaded faces shown when search is empty. Falls back to `options`. */
  featuredOptions?: FontOption[];
  /** Load a face before applying preview styles (search hits). */
  ensureLoaded?: (family: string) => void;
  ariaLabel?: string;
}

const ROW_HEIGHT = 36;

export function filterFontOptions(
  options: FontOption[],
  query: string
): FontOption[] {
  const needle = query.trim().toLowerCase();
  if (!needle) {
    return options;
  }
  return options.filter((option) =>
    option.label.toLowerCase().includes(needle)
  );
}

export function visibleFontOptions(
  options: FontOption[],
  featuredOptions: FontOption[] | undefined,
  query: string
): FontOption[] {
  const needle = query.trim();
  if (!needle) {
    return featuredOptions && featuredOptions.length > 0
      ? featuredOptions
      : options;
  }
  return filterFontOptions(options, needle);
}

function fontOptionStyle(option: FontOption): CSSProperties {
  return {
    fontFamily: option.value,
    fontSize: '15px',
    lineHeight: 1.35,
  };
}

export function FontCombobox({
  id,
  value,
  onChange,
  options,
  featuredOptions,
  ensureLoaded,
  ariaLabel,
}: FontComboboxProps) {
  const { t } = useWorkbenchTranslation();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const listRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();
  const selected = options.find((option) => option.value === value);
  const displayLabel =
    selected?.label ?? (value.trim() ? value : t('font.select'));
  const filtered = visibleFontOptions(options, featuredOptions, search);

  const virtualizer = useVirtualizer({
    count: filtered.length,
    enabled: open,
    estimateSize: () => ROW_HEIGHT,
    getScrollElement: () => listRef.current,
    overscan: 8,
  });

  const virtualItems = virtualizer.getVirtualItems();

  useLayoutEffect(() => {
    if (open) {
      virtualizer.measure();
    }
  }, [open, filtered.length, virtualizer]);

  useLayoutEffect(() => {
    if (!(open && ensureLoaded)) {
      return;
    }
    for (const row of virtualItems) {
      const option = filtered[row.index];
      if (option) {
        ensureLoaded(option.value);
      }
    }
  }, [open, ensureLoaded, filtered, virtualItems]);

  return (
    <div className={styles.root}>
      <PropertyAnchoredPopover
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) {
            setSearch('');
          }
        }}
        open={open}
        title={t('font.label')}
        trigger={
          <button
            aria-controls={open ? listboxId : undefined}
            aria-expanded={open}
            aria-haspopup="listbox"
            aria-label={ariaLabel ?? t('font.label')}
            className={styles.trigger}
            id={id}
            role="combobox"
            type="button"
          >
            <span className={styles.value}>{displayLabel}</span>
            <ChevronDown aria-hidden className={styles.chevron} size={14} />
          </button>
        }
      >
        <Command className={styles.command} shouldFilter={false}>
          <CommandInput
            onValueChange={setSearch}
            placeholder={t('font.search')}
            value={search}
          />
          <CommandList className={styles.list} id={listboxId} ref={listRef}>
            {filtered.length === 0 ? (
              <CommandEmpty>{t('font.noResults')}</CommandEmpty>
            ) : (
              <div
                className={styles.virtualViewport}
                style={{ height: virtualizer.getTotalSize() }}
              >
                {virtualItems.map((virtualRow) => {
                  const option = filtered[virtualRow.index];
                  if (!option) {
                    return null;
                  }
                  const isSelected = option.value === value;
                  return (
                    <CommandItem
                      className={styles.virtualRow}
                      key={option.value}
                      onSelect={() => {
                        ensureLoaded?.(option.value);
                        onChange(option.value);
                        setOpen(false);
                        setSearch('');
                      }}
                      style={{
                        height: virtualRow.size,
                        transform: `translateY(${virtualRow.start}px)`,
                      }}
                      value={option.label}
                    >
                      <Check
                        aria-hidden
                        className={cn(
                          styles.itemCheck,
                          isSelected ? styles.itemCheckVisible : undefined
                        )}
                        size={14}
                      />
                      <span
                        className={styles.itemLabel}
                        style={fontOptionStyle(option)}
                      >
                        {option.label}
                      </span>
                    </CommandItem>
                  );
                })}
              </div>
            )}
          </CommandList>
        </Command>
      </PropertyAnchoredPopover>
    </div>
  );
}
