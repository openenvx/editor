import {
  DEFAULT_SHADOW,
  normalizeCornerRadius,
  normalizePadding,
  uniformCornerRadius,
  uniformPadding,
} from '@openenvx/core';
import type {
  CornerRadiusValue,
  PaddingValue,
  ShadowValue,
} from '@openenvx/core';

import { NumericControl } from '../basic/numeric-control';
import type { NumericFieldLike } from '../types';
import { ColorInput } from './color-input';

export function CornerRadiusInput({
  field,
  value,
  id,
  onChange,
}: {
  field: NumericFieldLike;
  value: unknown;
  id: string;
  onChange: (value: CornerRadiusValue) => void;
}) {
  const uniform = uniformCornerRadius(
    normalizeCornerRadius(value as CornerRadiusValue | undefined)
  );
  return (
    <NumericControl
      field={field}
      id={id}
      onChange={(next) =>
        onChange({
          topLeft: next,
          topRight: next,
          bottomRight: next,
          bottomLeft: next,
        })
      }
      value={uniform}
    />
  );
}

export function PaddingInput({
  field,
  value,
  id,
  onChange,
}: {
  field: NumericFieldLike;
  value: unknown;
  id: string;
  onChange: (value: PaddingValue) => void;
}) {
  const uniform = uniformPadding(
    normalizePadding(value as PaddingValue | undefined)
  );
  return (
    <NumericControl
      field={field}
      id={id}
      onChange={(next) =>
        onChange({
          top: next,
          right: next,
          bottom: next,
          left: next,
        })
      }
      value={uniform}
    />
  );
}

export function ShadowInput({
  value,
  onChange,
}: {
  value: unknown;
  onChange: (value: ShadowValue) => void;
}) {
  const hasShadow = value !== undefined && value !== null;
  const shadow = hasShadow
    ? { ...DEFAULT_SHADOW, ...(value as ShadowValue) }
    : DEFAULT_SHADOW;

  return (
    <ColorInput
      onChange={(next) =>
        onChange({
          ...DEFAULT_SHADOW,
          ...(hasShadow ? (value as ShadowValue) : {}),
          color: next,
        })
      }
      placeholder="Add..."
      value={hasShadow ? shadow.color : ''}
    />
  );
}
