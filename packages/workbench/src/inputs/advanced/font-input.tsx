import { FontCombobox } from '../../primitives/font-combobox';
import type { SelectOption } from '../basic/select-input';

export interface FontInputProps {
  id: string;
  ariaLabel: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
}

export function FontInput({
  id,
  ariaLabel,
  value,
  options,
  onChange,
}: FontInputProps) {
  return (
    <FontCombobox
      ariaLabel={ariaLabel}
      id={id}
      onChange={onChange}
      options={options}
      value={value}
    />
  );
}
