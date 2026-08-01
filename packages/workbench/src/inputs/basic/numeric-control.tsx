import { NumericInput } from '../../primitives/numeric-input';
import type { NumericFieldLike } from '../types';

export function NumericControl({
  field,
  value,
  id,
  onChange,
}: {
  field: NumericFieldLike;
  value: unknown;
  id: string;
  onChange: (next: number) => void;
}) {
  const numeric = field.numeric;
  return (
    <NumericInput
      id={id}
      max={numeric?.max}
      min={numeric?.min}
      onChange={onChange}
      precision={numeric?.precision}
      scrub={numeric?.scrub}
      step={numeric?.step}
      unit={numeric?.unit}
      value={Number(value ?? 0)}
    />
  );
}
