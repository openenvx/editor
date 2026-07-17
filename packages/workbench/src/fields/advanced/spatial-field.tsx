import {
  CornerRadiusInput,
  PaddingInput,
  ShadowInput,
} from '../../inputs/advanced/spatial-input';
import { getFieldId } from '../../renderers/property-field-types';
import type { PropertyFieldComponent } from '../../renderers/property-field-types';

export const CornerRadiusFieldRenderer: PropertyFieldComponent = ({
  field,
  value,
  layerId,
  onUpdate,
}) => {
  const id = getFieldId(layerId, field.key);
  return (
    <CornerRadiusInput
      field={field}
      id={id}
      onChange={(next) => onUpdate(field.key, next)}
      value={value}
    />
  );
};

export const PaddingFieldRenderer: PropertyFieldComponent = ({
  field,
  value,
  layerId,
  onUpdate,
}) => {
  const id = getFieldId(layerId, field.key);
  return (
    <PaddingInput
      field={field}
      id={id}
      onChange={(next) => onUpdate(field.key, next)}
      value={value}
    />
  );
};

export const ShadowFieldRenderer: PropertyFieldComponent = ({
  field,
  value,
  onUpdate,
}) => (
  <ShadowInput onChange={(next) => onUpdate(field.key, next)} value={value} />
);
