export function snapValueToGrid(value: number, size: number): number {
  if (size <= 0) {
    return value;
  }
  return Math.round(value / size) * size;
}

export function snapPointToGrid(
  x: number,
  y: number,
  size: number
): { x: number; y: number } {
  return {
    x: snapValueToGrid(x, size),
    y: snapValueToGrid(y, size),
  };
}

/** Apply grid on axes the guide snap did not move. */
export function applyGridSnapToDragPosition(input: {
  originalX: number;
  originalY: number;
  size: number;
  snappedX: number;
  snappedY: number;
}): { x: number; y: number } {
  return {
    x:
      input.snappedX === input.originalX
        ? snapValueToGrid(input.originalX, input.size)
        : input.snappedX,
    y:
      input.snappedY === input.originalY
        ? snapValueToGrid(input.originalY, input.size)
        : input.snappedY,
  };
}

export function applyGridSnapToResizeBox(input: {
  anchor: string;
  original: {
    height: number;
    rotation: number;
    width: number;
    x: number;
    y: number;
  };
  size: number;
  snapped: {
    height: number;
    rotation: number;
    width: number;
    x: number;
    y: number;
  };
}): {
  height: number;
  rotation: number;
  width: number;
  x: number;
  y: number;
} {
  const { anchor, original, size, snapped } = input;
  let next = { ...snapped };

  const xUnchanged =
    snapped.x === original.x && snapped.width === original.width;
  const yUnchanged =
    snapped.y === original.y && snapped.height === original.height;

  if (xUnchanged && (anchor.includes('left') || anchor.includes('right'))) {
    if (anchor.includes('left')) {
      const nextLeft = snapValueToGrid(original.x, size);
      const right = original.x + original.width;
      next = {
        ...next,
        width: Math.max(1, right - nextLeft),
        x: nextLeft,
      };
    } else {
      const nextRight = snapValueToGrid(original.x + original.width, size);
      next = {
        ...next,
        width: Math.max(1, nextRight - original.x),
      };
    }
  }

  if (yUnchanged && (anchor.includes('top') || anchor.includes('bottom'))) {
    if (anchor.includes('top')) {
      const nextTop = snapValueToGrid(original.y, size);
      const bottom = original.y + original.height;
      next = {
        ...next,
        height: Math.max(1, bottom - nextTop),
        y: nextTop,
      };
    } else {
      const nextBottom = snapValueToGrid(original.y + original.height, size);
      next = {
        ...next,
        height: Math.max(1, nextBottom - original.y),
      };
    }
  }

  return next;
}
