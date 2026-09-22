import type { PropertyFieldComponent } from './property-field-types';

export function resolveFieldRenderer(
  kind: string,
  customRenderers: Record<string, PropertyFieldComponent>
): PropertyFieldComponent | null {
  return customRenderers[kind] ?? null;
}

export function buildCustomRendererMap(
  registrations: { kind: string; Component: unknown }[]
): Record<string, PropertyFieldComponent> {
  const map: Record<string, PropertyFieldComponent> = {};
  for (const registration of registrations) {
    map[registration.kind] = registration.Component as PropertyFieldComponent;
  }
  return map;
}
