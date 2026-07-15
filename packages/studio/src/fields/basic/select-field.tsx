import { SelectInput } from '../../inputs/basic/select-input';
import { getFieldId } from '../../renderers/property-field-types';
import type { PropertyFieldComponent } from '../../renderers/property-field-types';

export const SelectFieldRenderer: PropertyFieldComponent = ({
  field,
  value,
  layerId,
  onUpdate,
}) => {
  const id = getFieldId(layerId, field.key);
  const options = (field.options ?? []).map((opt) => ({
    label: opt.label,
    value: opt.value,
  }));
  return (
    <SelectInput
      id={id}
      onChange={(next) => onUpdate(field.key, next)}
      options={options}
      value={String(value ?? field.options?.[0]?.value ?? '')}
    />
  );
};
