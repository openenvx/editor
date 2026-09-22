import { SegmentedControl } from '../../primitives/segmented-control';
import type { PropertyFieldComponent } from '../../renderers/property-field-types';

export const SegmentedFieldRenderer: PropertyFieldComponent = ({
  field,
  value,
  onUpdate,
}) => {
  const options = (field.options ?? []).map((opt) => ({
    label: opt.label,
    value: opt.value,
  }));
  return (
    <SegmentedControl
      onChange={(next) => onUpdate(field.key, next)}
      options={options}
      value={String(value ?? field.options?.[0]?.value ?? '')}
    />
  );
};
