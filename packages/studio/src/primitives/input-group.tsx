import type { PropertyFieldDescriptor } from '@openenvx/core';

import { cn } from '../lib/cn';
import { NumericInput } from './numeric-input';

import styles from './input-group.module.css';

export interface InputGroupField {
  field: PropertyFieldDescriptor;
  label: string;
  value: number | string;
  onChange: (value: number) => void;
  id?: string;
}

export interface InputGroupProps {
  fields: InputGroupField[];
  className?: string;
}

export function InputGroup({ fields, className }: InputGroupProps) {
  return (
    <div className={cn(styles.group, className)}>
      {fields.map((cell) => (
        <div className={styles.cell} key={cell.label}>
          {cell.field.numeric?.scrub ? (
            <NumericInput
              handleIcon={<span className={styles.label}>{cell.label}</span>}
              id={cell.id}
              max={cell.field.numeric.max}
              min={cell.field.numeric.min}
              onChange={cell.onChange}
              precision={cell.field.numeric.precision}
              scrub
              step={cell.field.numeric.step}
              unit={cell.field.numeric.unit}
              value={Number(cell.value ?? 0)}
              variant="compact"
            />
          ) : (
            <>
              <span className={styles.label}>{cell.label}</span>
              <input
                className={styles.input}
                id={cell.id}
                onChange={(event) => onChange(cell, event.target.value)}
                type="number"
                value={cell.value}
              />
            </>
          )}
        </div>
      ))}
    </div>
  );
}

function onChange(cell: InputGroupField, raw: string): void {
  const next = Number(raw);
  if (!Number.isNaN(next)) {
    cell.onChange(next);
  }
}
