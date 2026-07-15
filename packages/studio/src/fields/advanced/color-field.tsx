import { ColorInput } from '../../inputs/advanced/color-input';
import { getFieldId } from '../../renderers/property-field-types';
import type { PropertyFieldComponent } from '../../renderers/property-field-types';

export const ColorFieldRenderer: PropertyFieldComponent = ({
  field,
  value,
  layerId,
  onUpdate,
}) => {
  const id = getFieldId(layerId, field.key);
  return (
    <ColorInput
      id={id}
      onChange={(next) => onUpdate(field.key, next)}
      value={String(value ?? 'transparent')}
    />
  );
};
