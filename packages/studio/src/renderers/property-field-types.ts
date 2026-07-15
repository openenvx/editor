import type { PropertyFieldDescriptor } from '@openenvx/core';
import type { ComponentType, ReactNode } from 'react';

export interface PropertyFieldRendererProps {
  field: PropertyFieldDescriptor;
  value: unknown;
  layerId: string;
  layerData: Record<string, unknown>;
  onUpdate: (key: string, value: unknown) => void;
  onCommand: (commandId: string) => void;
  renderField: (
    props: Omit<PropertyFieldRendererProps, 'renderField'>
  ) => ReactNode;
}

export type PropertyFieldComponent = ComponentType<PropertyFieldRendererProps>;

export function getFieldId(layerId: string, fieldKey: string): string {
  return `owb-prop-${layerId}-${fieldKey}`;
}
