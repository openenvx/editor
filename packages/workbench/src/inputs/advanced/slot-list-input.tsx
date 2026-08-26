import type { Layer, SlotListFieldConfig } from '@openenvx/core';
import { Trash2 } from 'lucide-react';

import { IconButton } from '../../primitives/icon-button';
import { PropertyFieldRow } from '../../primitives/property-field-row';
import {
  PropertyList,
  PropertyListAdd,
  PropertyListRow,
} from '../../primitives/property-list';
import type { PropertyFieldRendererProps } from '../../renderers/property-field-types';
import { getFieldId } from '../../renderers/property-field-types';

export interface SlotListInputProps {
  fieldKey: string;
  slotList: SlotListFieldConfig;
  value: unknown;
  layerId: string;
  onUpdate: (key: string, value: unknown) => void;
  onCommand: (commandId: string) => void;
  renderField: PropertyFieldRendererProps['renderField'];
}

function isPartLayer(value: unknown): value is Layer {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as Layer).id === 'string' &&
    typeof (value as Layer).type === 'string'
  );
}

function partData(part: Layer): Record<string, unknown> {
  return typeof part.data === 'object' && part.data !== null
    ? (part.data as Record<string, unknown>)
    : {};
}

function mintPartId(type: string): string {
  return `${type.replaceAll('.', '-')}-${crypto.randomUUID()}`;
}

export function SlotListInput({
  fieldKey,
  slotList,
  value,
  layerId,
  onUpdate,
  onCommand,
  renderField,
}: SlotListInputProps) {
  const rows = Array.isArray(value) ? value.filter(isPartLayer) : [];

  return (
    <PropertyList>
      {rows.map((row, rowIndex) => (
        <PropertyListRow
          actions={
            <IconButton
              aria-label={`Remove item ${rowIndex + 1}`}
              size="sm"
              onClick={() => {
                onUpdate(
                  fieldKey,
                  rows.filter((_, index) => index !== rowIndex)
                );
              }}
            >
              <Trash2 size={12} />
            </IconButton>
          }
          key={row.id}
          label={`${slotList.fields[0]?.label ?? 'Item'} ${rowIndex + 1}`}
        >
          {slotList.fields.map((sub) => (
            <PropertyFieldRow
              htmlFor={getFieldId(`${layerId}-${row.id}`, sub.key)}
              key={sub.key}
              label={sub.label}
            >
              {renderField({
                field: { ...sub, kind: sub.kind },
                layerData: partData(row),
                layerId: `${layerId}-${row.id}`,
                onCommand,
                onUpdate: (subKey, subValue) => {
                  const next = rows.map((part, index) => {
                    if (index !== rowIndex) {
                      return part;
                    }
                    return {
                      ...part,
                      data: { ...partData(part), [subKey]: subValue },
                    };
                  });
                  onUpdate(fieldKey, next);
                },
                value: partData(row)[sub.key],
              })}
            </PropertyFieldRow>
          ))}
        </PropertyListRow>
      ))}
      <PropertyListAdd
        onClick={() => {
          const template = slotList.newPart;
          if (!isPartLayer(template)) {
            return;
          }
          const nextPart: Layer = {
            ...structuredClone(template),
            id: mintPartId(template.type),
          };
          onUpdate(fieldKey, [...rows, nextPart]);
        }}
      >
        Add
      </PropertyListAdd>
    </PropertyList>
  );
}
