import type { Layer, SlotListFieldConfig } from '@openenvx/core';
import { Plus, Trash2 } from 'lucide-react';

import { Button } from '../../primitives/button';
import { IconButton } from '../../primitives/icon-button';
import { InspectorFieldRow } from '../../primitives/inspector-field-row';
import type { PropertyFieldRendererProps } from '../../renderers/property-field-types';
import { getFieldId } from '../../renderers/property-field-types';

import styles from '../../renderers/property-panel.module.css';

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
    <div className={styles.slotList}>
      {rows.map((row, rowIndex) => (
        <div className={styles.slotListRow} key={row.id}>
          <div className={styles.slotListRowHeader}>
            <span className={styles.slotListRowLabel}>
              {`${slotList.fields[0]?.label ?? 'Item'} ${rowIndex + 1}`}
            </span>
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
          </div>
          {slotList.fields.map((sub) => (
            <InspectorFieldRow
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
            </InspectorFieldRow>
          ))}
        </div>
      ))}
      <Button
        className={styles.slotListAdd}
        size="sm"
        variant="ghost"
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
        <Plus size={12} />
        Add
      </Button>
    </div>
  );
}
