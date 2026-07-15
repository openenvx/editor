import { Switch } from '../../primitives/switch';

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
    <Switch
      aria-label={ariaLabel}
      checked={checked}
      id={id}
      onChange={onChange}
    />
  );
}
