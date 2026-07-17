import type { RepeaterFieldConfig } from '@openenvx/core';

import { Button } from '../../primitives/button';
import type { PropertyFieldRendererProps } from '../../renderers/property-field-types';

import styles from '../../renderers/property-panel.module.css';

export interface RepeaterInputProps {
  fieldKey: string;
  repeaterFields: RepeaterFieldConfig[];
  value: unknown;
  layerId: string;
  onUpdate: (key: string, value: unknown) => void;
  onCommand: (commandId: string) => void;
  renderField: PropertyFieldRendererProps['renderField'];
}

export function RepeaterInput({
  fieldKey,
  repeaterFields,
  value,
  layerId,
  onUpdate,
  onCommand,
  renderField,
}: RepeaterInputProps) {
  const rows = Array.isArray(value) ? value : [];
  return (
    <div className={styles.repeater}>
      {rows.map((row, rowIndex) => (
        <div className={styles.repeaterRow} key={rowIndex}>
          {repeaterFields.map((sub) => (
            <div className={styles.fieldRowFull} key={sub.key}>
              <span className={styles.label}>{sub.label}</span>
              {renderField({
                field: { ...sub, kind: sub.kind },
                layerData:
                  typeof row === 'object' && row !== null
                    ? (row as Record<string, unknown>)
                    : {},
                layerId: `${layerId}-${rowIndex}`,
                onCommand,
                onUpdate: (subKey, subValue) => {
                  const next = [...rows];
                  const current =
                    typeof next[rowIndex] === 'object' &&
                    next[rowIndex] !== null
                      ? { ...(next[rowIndex] as Record<string, unknown>) }
                      : {};
                  current[subKey] = subValue;
                  next[rowIndex] = current;
                  onUpdate(fieldKey, next);
                },
                value:
                  typeof row === 'object' && row !== null
                    ? (row as Record<string, unknown>)[sub.key]
                    : undefined,
              })}
            </div>
          ))}
        </div>
      ))}
      <Button
        onClick={() =>
          onUpdate(fieldKey, [
            ...rows,
            Object.fromEntries(repeaterFields.map((f) => [f.key, ''])),
          ])
        }
        size="sm"
        variant="outline"
      >
        Add row
      </Button>
    </div>
  );
}
