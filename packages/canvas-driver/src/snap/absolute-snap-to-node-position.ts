/**
 * Convert Konva node x/y (parent-relative) to absolute artboard position.
 * Nested layers store parent-relative transforms; root layers have offset 0.
 */
export function nodePositionToAbsolute(
  nodeX: number,
  nodeY: number,
  relative: { x: number; y: number },
  absolute: { x: number; y: number }
): { x: number; y: number } {
  return {
    x: absolute.x + (nodeX - relative.x),
    y: absolute.y + (nodeY - relative.y),
  };
}

/**
 * Convert an absolute (artboard) snap result to Konva node x/y.
 * Inverse of {@link nodePositionToAbsolute}.
 */
export function absoluteSnapToNodePosition(
  absoluteX: number,
  absoluteY: number,
  relative: { x: number; y: number },
  absolute: { x: number; y: number }
): { x: number; y: number } {
  return {
    x: absoluteX - (absolute.x - relative.x),
    y: absoluteY - (absolute.y - relative.y),
  };
}
