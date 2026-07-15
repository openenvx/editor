import { RichTextInput } from '../../inputs/advanced/rich-text-input';
import { getFieldId } from '../../renderers/property-field-types';
import type { PropertyFieldComponent } from '../../renderers/property-field-types';

export const RichTextFieldRenderer: PropertyFieldComponent = ({
  field,
  value,
  layerId,
  onUpdate,
}) => {
  const id = getFieldId(layerId, field.key);
  return (
    <RichTextInput
      id={id}
      onChange={(next) => onUpdate(field.key, next)}
      value={String(value ?? '')}
    />
  );
};
