import type { CSSProperties } from 'react';

import { useWorkbenchTranslation } from '../i18n/use-workbench-translation';
import { Combobox } from './combobox';
import type { ComboboxOption } from './combobox';

export interface FontComboboxProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: ComboboxOption[];
  ariaLabel?: string;
}

function fontOptionStyle(option: ComboboxOption): CSSProperties {
  return { fontFamily: option.value };
}

export function FontCombobox({
  id,
  value,
  onChange,
  options,
  ariaLabel,
}: FontComboboxProps) {
  const { t } = useWorkbenchTranslation();
  return (
    <Combobox
      ariaLabel={ariaLabel ?? t('font.label')}
      emptyMessage={t('font.noResults')}
      id={id}
      onChange={onChange}
      optionStyle={fontOptionStyle}
      options={options}
      renderOption={(option) => (
        <span style={fontOptionStyle(option)}>{option.label}</span>
      )}
      renderValue={(option) => (
        <span style={option ? fontOptionStyle(option) : undefined}>
          {option?.label ?? t('font.select')}
        </span>
      )}
      searchPlaceholder={t('font.search')}
      value={value}
    />
  );
}
