import { Check, ChevronDown } from 'lucide-react';
import { useId, useState } from 'react';
import type { CSSProperties } from 'react';

import { useWorkbenchTranslation } from '../i18n/use-workbench-translation';
import { cn } from '../lib/cn';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from './command';
import { InspectorAnchoredPopover } from './inspector-anchored-popover';

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
  ariaLabel?: string;
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
  ariaLabel,
}: FontComboboxProps) {
  const { t } = useWorkbenchTranslation();
  const [open, setOpen] = useState(false);
  const listboxId = useId();
  const selected = options.find((option) => option.value === value);
  const displayLabel =
    selected?.label ?? (value.trim() ? value : t('font.select'));

  return (
    <div className={styles.root}>
      <InspectorAnchoredPopover
        onOpenChange={setOpen}
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
        <Command className={styles.command}>
          <CommandInput placeholder={t('font.search')} />
          <CommandList className={styles.list} id={listboxId}>
            <CommandEmpty>{t('font.noResults')}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const isSelected = option.value === value;
                return (
                  <CommandItem
                    key={option.value}
                    onSelect={() => {
                      onChange(option.value);
                      setOpen(false);
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
            </CommandGroup>
          </CommandList>
        </Command>
      </InspectorAnchoredPopover>
    </div>
  );
}
