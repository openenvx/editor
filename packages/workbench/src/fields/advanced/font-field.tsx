import { FontInput } from '../../inputs/advanced/font-input';
import { getFieldId } from '../../renderers/property-field-types';
import type { PropertyFieldComponent } from '../../renderers/property-field-types';

export const FontFieldRenderer: PropertyFieldComponent = ({
  field,
  value,
  layerId,
  onUpdate,
}) => {
  const id = getFieldId(layerId, field.key);
  return (
    <FontInput
      ariaLabel={field.label ?? field.key}
      id={id}
      onChange={(next) => onUpdate(field.key, next)}
      options={(field.options ?? []).map((opt) => ({
        label: opt.label,
        value: opt.value,
      }))}
      value={String(value ?? field.options?.[0]?.value ?? '')}
    />
  );
};
