import { Input } from '../../primitives/input';

export interface TextInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
}

export function TextInput({ id, value, onChange }: TextInputProps) {
  return (
    <Input
      id={id}
      onChange={(event) => onChange(event.target.value)}
      value={value}
    />
  );
}
