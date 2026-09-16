import { SlotListInput } from '../../inputs/advanced/slot-list-input';
import type { PropertyFieldComponent } from '../../renderers/property-field-types';

export const SlotListFieldRenderer: PropertyFieldComponent = ({
  field,
  value,
  layerId,
  onUpdate,
  onCommand,
  renderField,
}) => {
  if (!field.slotList) {
    return null;
  }
  return (
    <SlotListInput
      fieldKey={field.key}
      layerId={layerId}
      onCommand={onCommand}
      onUpdate={onUpdate}
      renderField={renderField}
      slotList={field.slotList}
      value={value}
    />
  );
};
