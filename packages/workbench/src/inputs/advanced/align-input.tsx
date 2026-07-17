import { WorkbenchIcon } from '../../icons/workbench-icon';
import { SegmentedControl } from '../../primitives/segmented-control';

export interface AlignOption {
  value: string;
  label: string;
  icon?: string;
}

export interface AlignInputProps {
  value: string;
  options: AlignOption[];
  onChange: (value: string) => void;
}

export function AlignInput({ value, options, onChange }: AlignInputProps) {
  return (
    <SegmentedControl
      onChange={onChange}
      options={options.map((opt) => ({
        icon: opt.icon ? <WorkbenchIcon id={opt.icon} size={14} /> : undefined,
        label: opt.label,
        value: opt.value,
      }))}
      value={value}
    />
  );
}
