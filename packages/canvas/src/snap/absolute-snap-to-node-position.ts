/**
 * Convert an absolute (artboard) snap result to Konva node x/y.
 * Nested layers store parent-relative transforms; root layers have offset 0.
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
