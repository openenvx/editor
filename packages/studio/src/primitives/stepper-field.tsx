import { Minus, Plus } from 'lucide-react';
import type { ReactNode } from 'react';

import { cn } from '../lib/cn';

import styles from './stepper-field.module.css';

export interface StepperFieldProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  icon?: ReactNode;
  step?: number;
  min?: number;
  max?: number;
  id?: string;
  className?: string;
  variant?: 'default' | 'popup';
}

export function StepperField({
  label,
  value,
  onChange,
  icon,
  step = 1,
  min,
  max,
  id,
  className,
  variant = 'default',
}: StepperFieldProps) {
  const clamp = (next: number) => {
    let result = next;
    if (min !== undefined) {
      result = Math.max(min, result);
    }
    if (max !== undefined) {
      result = Math.min(max, result);
    }
    return result;
  };

  const adjust = (delta: number) => {
    onChange(clamp(value + delta));
  };

  const input = (
    <input
      className={cn(
        variant === 'popup' ? styles.popupField : styles.input,
        variant === 'popup' && icon && styles.popupFieldWithIcon
      )}
      id={id}
      onChange={(event) => {
        const next = Number(event.target.value);
        if (!Number.isNaN(next)) {
          onChange(clamp(next));
        }
      }}
      inputMode="decimal"
      type="text"
      value={value}
    />
  );

  if (variant === 'popup') {
    return (
      <div className={cn(styles.popup, className)}>
        {id ? (
          <label className={styles.popupLabel} htmlFor={id}>
            {label}
          </label>
        ) : (
          <span className={styles.popupLabel}>{label}</span>
        )}
        <div className={styles.popupControls}>
          <div className={styles.popupInputGroup}>
            {icon ? <span className={styles.popupIcon}>{icon}</span> : null}
            <div className={styles.popupNumber}>
              {input}
              <div className={styles.popupSteppers}>
                <button
                  aria-label={`Decrease ${label}`}
                  className={styles.popupStepper}
                  onClick={() => adjust(-step)}
                  type="button"
                >
                  <Minus size={12} />
                </button>
                <button
                  aria-label={`Increase ${label}`}
                  className={styles.popupStepper}
                  onClick={() => adjust(step)}
                  type="button"
                >
                  <Plus size={12} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(styles.row, className)}>
      {id ? (
        <label className={styles.label} htmlFor={id}>
          {label}
        </label>
      ) : (
        <span className={styles.label}>{label}</span>
      )}
      <div className={styles.field}>
        {icon ? <span className={styles.icon}>{icon}</span> : null}
        {input}
      </div>
      <div className={styles.steppers}>
        <button
          aria-label={`Decrease ${label}`}
          className={styles.stepper}
          onClick={() => adjust(-step)}
          type="button"
        >
          <Minus size={12} />
        </button>
        <button
          aria-label={`Increase ${label}`}
          className={styles.stepper}
          onClick={() => adjust(step)}
          type="button"
        >
          <Plus size={12} />
        </button>
      </div>
    </div>
  );
}
