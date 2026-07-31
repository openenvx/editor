import { CheckboxInput } from '../../inputs/basic/checkbox-input';
import { getFieldId } from '../../renderers/property-field-types';
import type { PropertyFieldComponent } from '../../renderers/property-field-types';

export const CheckboxFieldRenderer: PropertyFieldComponent = ({
  field,
  value,
  layerId,
  onUpdate,
}) => {
  const id = getFieldId(layerId, field.key);
  return (
    <CheckboxInput
      ariaLabel={field.label ?? field.key}
      checked={Boolean(value)}
      id={id}
      onChange={(next) => onUpdate(field.key, next)}
    />
  );
};
