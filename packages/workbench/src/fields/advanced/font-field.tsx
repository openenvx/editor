import { FontServiceId } from '@openenvx/core';

import { useWorkbenchContext } from '../../context/workbench-context';
import { FontInput } from '../../inputs/advanced/font-input';
import { getFieldId } from '../../renderers/property-field-types';
import type { PropertyFieldComponent } from '../../renderers/property-field-types';

export const FontFieldRenderer: PropertyFieldComponent = ({
  field,
  value,
  layerId,
  onUpdate,
}) => {
  const { api } = useWorkbenchContext();
  const id = getFieldId(layerId, field.key);
  const fontService = api.getService(FontServiceId);
  const options = fontService
    ? fontService.list().map((font) => ({
        label: font.id,
        value: font.family,
      }))
    : (field.options ?? []).map((opt) => ({
        label: opt.label,
        value: opt.value,
      }));
  const featuredOptions = fontService
    ? fontService.listFeatured().map((font) => ({
        label: font.id,
        value: font.family,
      }))
    : undefined;

  return (
    <FontInput
      ariaLabel={field.label ?? field.key}
      ensureLoaded={
        fontService
          ? (family) => {
              void fontService.ensureLoaded(family);
            }
          : undefined
      }
      featuredOptions={featuredOptions}
      id={id}
      onChange={(next) => onUpdate(field.key, next)}
      options={options}
      value={String(value ?? options[0]?.value ?? '')}
    />
  );
};
