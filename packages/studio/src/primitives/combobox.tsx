import { Check, ChevronDown } from 'lucide-react';
import { useId, useMemo, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';

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
import { Popover, PopoverContent, PopoverTrigger } from './popover';

import styles from './combobox.module.css';

export interface ComboboxOption {
  value: string;
  label: string;
}

export interface ComboboxProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: ComboboxOption[];
  ariaLabel?: string;
  className?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  renderOption?: (option: ComboboxOption) => ReactNode;
  renderValue?: (option: ComboboxOption | undefined) => ReactNode;
  optionStyle?: (option: ComboboxOption) => CSSProperties | undefined;
}

export function Combobox({
  id,
  value,
  onChange,
  options,
  ariaLabel,
  className,
  searchPlaceholder,
  emptyMessage,
  renderOption,
  renderValue,
  optionStyle,
}: ComboboxProps) {
  const { t } = useWorkbenchTranslation();
  const resolvedSearchPlaceholder = searchPlaceholder ?? t('combobox.search');
  const resolvedEmptyMessage = emptyMessage ?? t('combobox.noResults');
  const [open, setOpen] = useState(false);
  const listboxId = useId();

  const selectedOption = useMemo(
    () => options.find((option) => option.value === value),
    [options, value]
  );

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger className={cn(styles.root, className)}>
        <button
          aria-controls={open ? listboxId : undefined}
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-label={ariaLabel}
          className={styles.trigger}
          id={id}
          role="combobox"
          type="button"
        >
          <span className={styles.value}>
            {renderValue
              ? renderValue(selectedOption)
              : (selectedOption?.label ?? t('combobox.select'))}
          </span>
          <ChevronDown aria-hidden className={styles.chevron} size={14} />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        bodyClassName={styles.panelBody}
        className={styles.panel}
        onOpenAutoFocus={(event) => event.preventDefault()}
        side="bottom"
      >
        <Command>
          <CommandInput placeholder={resolvedSearchPlaceholder} />
          <CommandList id={listboxId}>
            <CommandEmpty>{resolvedEmptyMessage}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const selected = option.value === value;
                return (
                  <CommandItem
                    key={option.value}
                    onSelect={() => {
                      onChange(option.value);
                      setOpen(false);
                    }}
                    style={optionStyle?.(option)}
                    value={option.label}
                  >
                    <Check
                      aria-hidden
                      className={cn(
                        styles.itemCheck,
                        selected ? styles.itemCheckVisible : undefined
                      )}
                      size={14}
                    />
                    <span className={styles.itemLabel}>
                      {renderOption ? renderOption(option) : option.label}
                    </span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
