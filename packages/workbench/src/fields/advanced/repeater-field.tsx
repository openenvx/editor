import { RepeaterInput } from '../../inputs/advanced/repeater-input';
import type { PropertyFieldComponent } from '../../renderers/property-field-types';

export const RepeaterFieldRenderer: PropertyFieldComponent = ({
  field,
  value,
  layerId,
  onUpdate,
  onCommand,
  renderField,
}) => (
  <RepeaterInput
    fieldKey={field.key}
    layerId={layerId}
    onCommand={onCommand}
    onUpdate={onUpdate}
    renderField={renderField}
    repeaterFields={field.repeaterFields ?? []}
    value={value}
  />
);
