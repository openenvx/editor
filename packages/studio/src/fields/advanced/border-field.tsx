import { BorderInput } from '../../inputs/advanced/border-input';
import { getFieldId } from '../../renderers/property-field-types';
import type { PropertyFieldComponent } from '../../renderers/property-field-types';

export const BorderFieldRenderer: PropertyFieldComponent = (props) => {
  const { field, value, layerId, layerData, onUpdate } = props;
  const id = getFieldId(layerId, field.key);
  const stroke = String(layerData.stroke ?? '#ffffff');
  return (
    <BorderInput
      actions={field.actions}
      field={field}
      id={id}
      layerData={layerData}
      onBorderChange={(next) => onUpdate(field.key, next)}
      onCommand={props.onCommand}
      onStrokeChange={(next) => onUpdate('stroke', next)}
      onUpdate={onUpdate}
      stroke={stroke}
      value={value}
    />
  );
};
