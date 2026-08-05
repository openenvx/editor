import type { CornerRadius, Padding } from '@xmazu/openenvxee-schema';

const DEFAULT_CORNER_RADIUS: CornerRadius = {
  topLeft: 0,
  topRight: 0,
  bottomRight: 0,
  bottomLeft: 0,
};

const DEFAULT_PADDING: Padding = {
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
};

export function normalizeCornerRadius(
  value: number | CornerRadius | undefined
): CornerRadius {
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

export function cornerRadiusToKonva(
  value: number | CornerRadius | undefined
): number | [number, number, number, number] {
  const corners = normalizeCornerRadius(value);
  const { topLeft, topRight, bottomRight, bottomLeft } = corners;
  if (
    topLeft === topRight &&
    topRight === bottomRight &&
    bottomRight === bottomLeft
  ) {
    return topLeft;
  }
  return [topLeft, topRight, bottomRight, bottomLeft];
}

export function uniformCornerRadius(
  value: number | CornerRadius | undefined
): number {
  const corners = normalizeCornerRadius(value);
  return (
    (corners.topLeft +
      corners.topRight +
      corners.bottomRight +
      corners.bottomLeft) /
    4
  );
}

export function normalizePadding(value: Padding | number | undefined): Padding {
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

export function scaleCornerRadius(
  value: CornerRadius | undefined,
  scale: number
): CornerRadius | undefined {
  if (!value) {
    return undefined;
  }
  return {
    topLeft: value.topLeft * scale,
    topRight: value.topRight * scale,
    bottomRight: value.bottomRight * scale,
    bottomLeft: value.bottomLeft * scale,
  };
}

export function scalePadding(
  value: Padding | undefined,
  scaleX: number,
  scaleY: number
): Padding | undefined {
  if (!value) {
    return undefined;
  }
  return {
    top: value.top * scaleY,
    right: value.right * scaleX,
    bottom: value.bottom * scaleY,
    left: value.left * scaleX,
  };
}
