/** Axis-aligned box in viewport coordinates. */
export interface Box {
  top: number;
  left: number;
  bottom: number;
  right: number;
}

export function boxWidth(box: Box): number {
  return Math.max(0, box.right - box.left);
}

export function boxHeight(box: Box): number {
  return Math.max(0, box.bottom - box.top);
}

export function boxArea(box: Box): number {
  return boxWidth(box) * boxHeight(box);
}

export function intersectBoxes(a: Box, b: Box): Box | null {
  const top = Math.max(a.top, b.top);
  const left = Math.max(a.left, b.left);
  const bottom = Math.min(a.bottom, b.bottom);
  const right = Math.min(a.right, b.right);
  if (bottom <= top || right <= left) {
    return null;
  }
  return { top, left, bottom, right };
}

/** Fraction of `subject` that lies inside `clip` (0..1). */
export function visibleRatio(subject: Box, clip: Box): number {
  const area = boxArea(subject);
  if (area <= 0) {
    return 0;
  }
  const overlap = intersectBoxes(subject, clip);
  return overlap ? boxArea(overlap) / area : 0;
}

export function isMostlyVisible(
  subject: Box,
  clip: Box,
  minRatio = 0.5
): boolean {
  return visibleRatio(subject, clip) >= minRatio;
}

export function boxesOverlapHorizontally(a: Box, b: Box): boolean {
  return a.left < b.right && a.right > b.left;
}

export function rectToBox(rect: DOMRectReadOnly): Box {
  return {
    top: rect.top,
    left: rect.left,
    bottom: rect.bottom,
    right: rect.right,
  };
}

export function viewportBox(
  width = typeof window === 'undefined' ? 0 : window.innerWidth,
  height = typeof window === 'undefined' ? 0 : window.innerHeight
): Box {
  return { top: 0, left: 0, bottom: height, right: width };
}
