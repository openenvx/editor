import { Select } from '../../primitives/input';
import { SegmentedControl } from '../../primitives/segmented-control';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectInputProps {
  id: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
}

export function SelectInput({
  id,
  value,
  options,
  onChange,
}: SelectInputProps) {
  if (options.length <= 3) {
    return (
      <SegmentedControl onChange={onChange} options={options} value={value} />
    );
  }
  return <Select id={id} onChange={onChange} options={options} value={value} />;
}
