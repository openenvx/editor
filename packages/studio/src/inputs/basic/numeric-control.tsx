import { NumberInput } from '../../primitives/input';
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
  if (numeric?.scrub) {
    return (
      <NumericInput
        id={id}
        max={numeric.max}
        min={numeric.min}
        onChange={onChange}
        precision={numeric.precision}
        scrub
        step={numeric.step}
        unit={numeric.unit}
        value={Number(value ?? 0)}
      />
    );
  }
  return (
    <NumberInput
      id={id}
      onChange={(event) => onChange(Number(event.target.value))}
      value={Number(value ?? 0)}
    />
  );
}
