import { Textarea } from '../../primitives/input';

export interface RichTextInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
}

export function RichTextInput({ id, value, onChange }: RichTextInputProps) {
  return (
    <Textarea
      id={id}
      onChange={(event) => onChange(event.target.value)}
      value={value}
    />
  );
}
