import { ImageInput } from '../../inputs/advanced/image-input';
import { getFieldId } from '../../renderers/property-field-types';
import type { PropertyFieldComponent } from '../../renderers/property-field-types';

export const ImageFieldRenderer: PropertyFieldComponent = ({
  field,
  value,
  layerId,
  onUpdate,
  onCommand,
}) => {
  const id = getFieldId(layerId, field.key);
  return (
    <ImageInput
      id={id}
      onChange={(next) => onUpdate(field.key, next)}
      onUpload={
        field.uploadCommandId
          ? () => onCommand(field.uploadCommandId as string)
          : undefined
      }
      uploadCommandId={field.uploadCommandId}
      value={String(value ?? '')}
    />
  );
};
