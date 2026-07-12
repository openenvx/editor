import type { PropertyFieldDescriptor } from '@openenvx/core';

/** Opaque path into the inspector host context. Convention documented in extension-guide. */
export type InspectorValuePath = string;

export interface InspectorInputGroupCell {
  path: InspectorValuePath;
  field: PropertyFieldDescriptor;
}
