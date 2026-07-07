import type { PropertyFieldDescriptor } from '../builders/property-builder';

/** Opaque path into the inspector host context. Convention documented in extension-guide. */
export type InspectorValuePath = string;

export interface InspectorInputGroupCell {
  path: InspectorValuePath;
  field: PropertyFieldDescriptor;
}
