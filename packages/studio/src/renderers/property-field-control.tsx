import { FieldChrome } from './field-chrome';
import { resolveFieldRenderer } from './property-field-registry';
import type {
  PropertyFieldComponent,
  PropertyFieldRendererProps,
} from './property-field-types';

function shouldUseFieldChrome(
  field: PropertyFieldRendererProps['field']
): boolean {
  if (field.layout === 'block') {
    return false;
  }
  return Boolean(field.popup?.fields.length || field.actions?.length);
}

export function PropertyFieldControl(
  props: PropertyFieldRendererProps & {
    customRenderers: Record<string, PropertyFieldComponent>;
  }
) {
  const { customRenderers, ...fieldProps } = props;
  const Renderer = resolveFieldRenderer(fieldProps.field.kind, customRenderers);
  if (!Renderer) {
    console.warn(
      `[workbench] No field renderer registered for kind "${fieldProps.field.kind}". Register DefaultWorkbenchFieldsPlugin or call registerFieldRenderer().`
    );
    return null;
  }

  const primary = <Renderer {...fieldProps} />;

  if (!shouldUseFieldChrome(fieldProps.field)) {
    return primary;
  }

  return <FieldChrome {...fieldProps}>{primary}</FieldChrome>;
}
