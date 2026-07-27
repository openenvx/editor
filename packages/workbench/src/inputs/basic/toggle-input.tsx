import { Checkbox } from '../../primitives/checkbox';

export interface ToggleInputProps {
  id: string;
  ariaLabel: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}

export function ToggleInput({
  id,
  ariaLabel,
  checked,
  onChange,
}: ToggleInputProps) {
  return (
    <Checkbox
      aria-label={ariaLabel}
      checked={checked}
      id={id}
      onChange={onChange}
    />
  );
}
