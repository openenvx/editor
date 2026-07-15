import { useCallback, useEffect, useRef, useState } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';

import { cn } from '../lib/cn';
import { computeScrubValue, formatNumericDisplay } from './numeric-scrub';

import styles from './numeric-input.module.css';

const DRAG_THRESHOLD_PX = 2;

export interface NumericInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'onChange' | 'value'
> {
  value: number;
  onChange: (value: number) => void;
  scrub?: boolean;
  step?: number;
  min?: number;
  max?: number;
  precision?: number;
  unit?: string;
  handleIcon?: ReactNode;
  variant?: 'default' | 'compact';
}

export function NumericInput({
  value,
  onChange,
  scrub = false,
  step = 1,
  min,
  max,
  precision,
  unit,
  handleIcon,
  variant = 'default',
  className,
  id,
  disabled,
  ...props
}: NumericInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const handleRef = useRef<HTMLButtonElement>(null);
  const dragState = useRef({
    active: false,
    moved: false,
    startValue: 0,
    accumulatedPixels: 0,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [draft, setDraft] = useState<string | null>(null);

  const displayValue = draft ?? formatNumericDisplay(value, precision);

  const commitValue = useCallback(
    (next: number) => {
      onChange(next);
      setDraft(null);
    },
    [onChange]
  );

  const endDrag = useCallback(() => {
    const state = dragState.current;
    if (!state.active) {
      return;
    }
    state.active = false;
    setIsDragging(false);
    document.exitPointerLock?.();
  }, []);

  useEffect(() => {
    if (!scrub) {
      return;
    }

    const onPointerMove = (event: PointerEvent) => {
      const state = dragState.current;
      if (!state.active) {
        return;
      }

      state.accumulatedPixels += event.movementX;
      if (Math.abs(state.accumulatedPixels) >= DRAG_THRESHOLD_PX) {
        state.moved = true;
      }

      const next = computeScrubValue(
        state.startValue,
        state.accumulatedPixels,
        { max, min, precision, step },
        { alt: event.altKey, shift: event.shiftKey }
      );
      commitValue(next);
    };

    const onPointerUp = () => {
      const state = dragState.current;
      if (!state.active) {
        return;
      }
      const shouldFocus = !state.moved;
      endDrag();
      if (shouldFocus) {
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };

    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);
    return () => {
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerup', onPointerUp);
    };
  }, [commitValue, endDrag, max, min, precision, scrub, step]);

  const startDrag = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!scrub || disabled) {
      return;
    }
    event.preventDefault();
    dragState.current = {
      active: true,
      accumulatedPixels: 0,
      moved: false,
      startValue: value,
    };
    setIsDragging(true);
    handleRef.current?.requestPointerLock();
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setDraft(event.target.value);
  };

  const handleInputBlur = () => {
    if (draft === null) {
      return;
    }
    const next = Number(draft);
    if (!Number.isNaN(next)) {
      commitValue(computeScrubValue(next, 0, { max, min, precision, step }));
    } else {
      setDraft(null);
    }
  };

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      inputRef.current?.blur();
    }
    if (event.key === 'Escape') {
      setDraft(null);
      inputRef.current?.blur();
    }
  };

  return (
    <div
      className={cn(
        styles.root,
        variant === 'compact' && styles.compact,
        className
      )}
    >
      {scrub ? (
        <button
          aria-label="Scrub value"
          className={cn(styles.handle, isDragging && styles.handleActive)}
          disabled={disabled}
          onPointerDown={startDrag}
          ref={handleRef}
          type="button"
        >
          {handleIcon ?? (
            <span aria-hidden className={styles.scrubGrip}>
              ::
            </span>
          )}
        </button>
      ) : null}
      <input
        {...props}
        className={styles.input}
        disabled={disabled}
        id={id}
        inputMode="decimal"
        onBlur={handleInputBlur}
        onChange={handleInputChange}
        onKeyDown={handleInputKeyDown}
        ref={inputRef}
        type="text"
        value={displayValue}
      />
      {unit ? <span className={styles.unit}>{unit}</span> : null}
    </div>
  );
}
