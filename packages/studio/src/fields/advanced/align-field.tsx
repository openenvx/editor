import { AlignInput } from '../../inputs/advanced/align-input';
import type { PropertyFieldComponent } from '../../renderers/property-field-types';

export const AlignFieldRenderer: PropertyFieldComponent = ({
  field,
  value,
  onUpdate,
}) => (
  <AlignInput
    onChange={(next) => onUpdate(field.key, next)}
    options={field.options ?? []}
    value={String(value ?? field.options?.[0]?.value ?? 'left')}
  />
);
