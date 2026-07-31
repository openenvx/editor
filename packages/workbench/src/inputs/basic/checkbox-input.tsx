import { Checkbox } from '../../primitives/checkbox';

export interface CheckboxInputProps {
  id: string;
  ariaLabel: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}

export function CheckboxInput({
  id,
  ariaLabel,
  checked,
  onChange,
}: CheckboxInputProps) {
  return (
    <Checkbox
      aria-label={ariaLabel}
      checked={checked}
      id={id}
      onChange={onChange}
    />
  );
}
