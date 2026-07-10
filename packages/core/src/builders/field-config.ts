export interface NumericFieldConfig {
  scrub?: boolean;
  min?: number;
  max?: number;
  step?: number;
  precision?: number;
  unit?: string;
}

interface PopupSubFieldDescriptor {
  key: string;
  kind: string;
  label: string;
  icon?: string;
  options?: { value: string; label: string; icon?: string }[];
  numeric?: NumericFieldConfig;
  popup?: PopupFieldConfig;
  actions?: FieldAction[];
}

export interface PopupFieldConfig {
  icon: string;
  title?: string;
  fields: PopupSubFieldDescriptor[];
}

export type FieldActionClick =
  | { type: 'setValue'; key: string; value: unknown }
  | { type: 'toggle'; key: string }
  | { type: 'command'; commandId: string };

export interface FieldAction {
  icon: string;
  label: string;
  onClick: FieldActionClick;
}

export interface FieldConfigOptions {
  numeric?: NumericFieldConfig;
  popup?: PopupFieldConfig;
  actions?: FieldAction[];
  icon?: string;
  chrome?: boolean;
}

export interface CornerRadiusValue {
  topLeft: number;
  topRight: number;
  bottomRight: number;
  bottomLeft: number;
}

export interface PaddingValue {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface ShadowValue {
  offsetX: number;
  offsetY: number;
  blur: number;
  spread: number;
  color: string;
}

export const DEFAULT_CORNER_RADIUS: CornerRadiusValue = {
  topLeft: 0,
  topRight: 0,
  bottomRight: 0,
  bottomLeft: 0,
};

export const DEFAULT_PADDING: PaddingValue = {
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
};

export const DEFAULT_SHADOW: ShadowValue = {
  offsetX: 0,
  offsetY: 0,
  blur: 0,
  spread: 0,
  color: '#00000080',
};

export function uniformCornerRadius(
  value: CornerRadiusValue | undefined
): number {
  const corners = value ?? DEFAULT_CORNER_RADIUS;
  return (
    (corners.topLeft +
      corners.topRight +
      corners.bottomRight +
      corners.bottomLeft) /
    4
  );
}

export function uniformPadding(value: PaddingValue | undefined): number {
  const padding = value ?? DEFAULT_PADDING;
  return (padding.top + padding.right + padding.bottom + padding.left) / 4;
}

export function normalizeCornerRadius(
  value: CornerRadiusValue | number | undefined
): CornerRadiusValue {
  if (value === undefined) {
    return { ...DEFAULT_CORNER_RADIUS };
  }
  if (typeof value === 'number') {
    return {
      topLeft: value,
      topRight: value,
      bottomRight: value,
      bottomLeft: value,
    };
  }
  return { ...DEFAULT_CORNER_RADIUS, ...value };
}

export function normalizePadding(
  value: PaddingValue | number | undefined
): PaddingValue {
  if (value === undefined) {
    return { ...DEFAULT_PADDING };
  }
  if (typeof value === 'number') {
    return {
      top: value,
      right: value,
      bottom: value,
      left: value,
    };
  }
  return { ...DEFAULT_PADDING, ...value };
}

export interface PropertyFieldOption {
  value: string;
  label: string;
  icon?: string;
}

export interface FieldConfigTarget {
  numeric?: NumericFieldConfig;
  popup?: PopupFieldConfig;
  actions?: FieldAction[];
  icon?: string;
  chrome?: boolean;
}

export const DEFAULT_ALIGN_OPTIONS: PropertyFieldOption[] = [
  { icon: 'alignLeft', label: 'Left', value: 'left' },
  { icon: 'alignCenter', label: 'Center', value: 'center' },
  { icon: 'alignRight', label: 'Right', value: 'right' },
];

export function applyFieldConfig(
  field: FieldConfigTarget,
  config?: FieldConfigOptions
): void {
  if (!config) {
    return;
  }
  if (config.numeric) {
    field.numeric = config.numeric;
  }
  if (config.popup) {
    field.popup = config.popup;
  }
  if (config.actions) {
    field.actions = config.actions;
  }
  if (config.icon) {
    field.icon = config.icon;
  }
  if (config.chrome !== undefined) {
    field.chrome = config.chrome;
  }
}
