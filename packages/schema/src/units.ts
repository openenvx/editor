export type LengthUnit = 'px' | 'mm' | 'in' | 'cm' | 'pt';

export const LENGTH_UNITS: LengthUnit[] = ['px', 'mm', 'in', 'cm', 'pt'];

const UNIT_TO_PX: Record<LengthUnit, (value: number, dpi: number) => number> = {
  cm: (value, dpi) => (value / 2.54) * dpi,
  in: (value, dpi) => value * dpi,
  mm: (value, dpi) => (value / 25.4) * dpi,
  pt: (value, dpi) => (value / 72) * dpi,
  px: (value) => value,
};

const PX_TO_UNIT: Record<LengthUnit, (px: number, dpi: number) => number> = {
  cm: (px, dpi) => (px / dpi) * 2.54,
  in: (px, dpi) => px / dpi,
  mm: (px, dpi) => (px / dpi) * 25.4,
  pt: (px, dpi) => (px / dpi) * 72,
  px: (px) => px,
};

export function toPx(value: number, unit: LengthUnit, dpi = 96): number {
  return UNIT_TO_PX[unit](value, dpi);
}

export function fromPx(px: number, unit: LengthUnit, dpi = 96): number {
  return PX_TO_UNIT[unit](px, dpi);
}

export function defaultDpiForUnit(unit: LengthUnit): number {
  return unit === 'pt' ? 72 : 96;
}
