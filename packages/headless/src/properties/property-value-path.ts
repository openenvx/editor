import type { PropertyFieldDescriptor } from '@openenvx/core';

/** Opaque path into the property host context. Convention documented in extension-guide. */
export type PropertyValuePath = string;

export interface PropertyInputGroupCell {
  path: PropertyValuePath;
  field: PropertyFieldDescriptor;
}
