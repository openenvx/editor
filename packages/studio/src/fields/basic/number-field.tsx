import { NumericControl } from '../../inputs/basic/numeric-control';
import { getFieldId } from '../../renderers/property-field-types';
import type { PropertyFieldComponent } from '../../renderers/property-field-types';

export const NumberFieldRenderer: PropertyFieldComponent = ({
  field,
  value,
  layerId,
  onUpdate,
}) => {
  const id = getFieldId(layerId, field.key);
  return (
    <NumericControl
      field={field}
      id={id}
      onChange={(next) => onUpdate(field.key, next)}
      value={value}
    />
  );
};
