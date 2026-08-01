import { FontCombobox } from '../../primitives/font-combobox';
import type { SelectOption } from '../basic/select-input';

export interface FontInputProps {
  id: string;
  ariaLabel: string;
  value: string;
  options: SelectOption[];
  featuredOptions?: SelectOption[];
  ensureLoaded?: (family: string) => void;
  onChange: (value: string) => void;
}

export function FontInput({
  id,
  ariaLabel,
  value,
  options,
  featuredOptions,
  ensureLoaded,
  onChange,
}: FontInputProps) {
  return (
    <FontCombobox
      ariaLabel={ariaLabel}
      ensureLoaded={ensureLoaded}
      featuredOptions={featuredOptions}
      id={id}
      onChange={onChange}
      options={options}
      value={value}
    />
  );
}
