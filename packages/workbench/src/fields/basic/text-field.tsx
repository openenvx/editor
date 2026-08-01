import { TextInput } from '../../inputs/basic/text-input';
import { getFieldId } from '../../renderers/property-field-types';
import type { PropertyFieldComponent } from '../../renderers/property-field-types';

export const TextFieldRenderer: PropertyFieldComponent = ({
  field,
  value,
  layerId,
  onUpdate,
}) => {
  const id = getFieldId(layerId, field.key);
  return (
    <TextInput
      debounceMs={field.debounceMs}
      id={id}
      onChange={(next) => onUpdate(field.key, next)}
      value={String(value ?? '')}
    />
  );
};
