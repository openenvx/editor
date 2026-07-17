import { ColorPickerPopover } from '../../primitives/color-picker';

export interface ColorInputProps {
  id?: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
}

export function ColorInput({
  id,
  value,
  placeholder,
  onChange,
}: ColorInputProps) {
  return (
    <ColorPickerPopover
      id={id}
      onChange={onChange}
      placeholder={placeholder}
      value={value}
    />
  );
}
