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
      {fields.map((cell) => {
        const numeric = cell.field.numeric;
        const scrub = Boolean(numeric?.scrub);
        return (
          <div className={styles.cell} key={cell.label}>
            {scrub ? null : <span className={styles.label}>{cell.label}</span>}
            <NumericInput
              handleIcon={
                scrub ? (
                  <span className={styles.label}>{cell.label}</span>
                ) : undefined
              }
              id={cell.id}
              max={numeric?.max}
              min={numeric?.min}
              onChange={(value) => cell.onChange(value)}
              precision={numeric?.precision}
              scrub={scrub}
              step={numeric?.step}
              unit={numeric?.unit}
              value={Number(cell.value ?? 0)}
              variant="compact"
            />
          </div>
        );
      })}
    </div>
  );
}
