/**
 * Konva.Transformer cursor math (anchor name + rotation → CSS resize cursor).
 * @see konva/lib/shapes/Transformer.js `getCursor`
 */

const ANCHOR_ANGLE_OFFSET_DEG: Record<string, number> = {
  'bottom-center': 180,
  'bottom-left': -135,
  'bottom-right': 135,
  'middle-left': 90,
  'middle-right': -90,
  'top-center': 0,
  'top-left': -45,
  'top-right': 45,
};

function inRange(angle: number, min: number, max: number): boolean {
  return angle >= min && angle <= max;
}

export function resolveResizeHandleCursor(
  anchor: string,
  rotationDeg = 0
): string {
  if (anchor === 'rotater') {
    return 'grab';
  }

  const offset = ANCHOR_ANGLE_OFFSET_DEG[anchor];
  if (offset === undefined) {
    return 'pointer';
  }

  const angle = (((rotationDeg + offset) % 360) + 360) % 360;

  if (inRange(angle, 315 + 22.5, 360) || inRange(angle, 0, 22.5)) {
    return 'ns-resize';
  }
  if (inRange(angle, 45 - 22.5, 45 + 22.5)) {
    return 'nesw-resize';
  }
  if (inRange(angle, 90 - 22.5, 90 + 22.5)) {
    return 'ew-resize';
  }
  if (inRange(angle, 135 - 22.5, 135 + 22.5)) {
    return 'nwse-resize';
  }
  if (inRange(angle, 180 - 22.5, 180 + 22.5)) {
    return 'ns-resize';
  }
  if (inRange(angle, 225 - 22.5, 225 + 22.5)) {
    return 'nesw-resize';
  }
  if (inRange(angle, 270 - 22.5, 270 + 22.5)) {
    return 'ew-resize';
  }
  if (inRange(angle, 315 - 22.5, 315 + 22.5)) {
    return 'nwse-resize';
  }
  return 'pointer';
}

// Last stage content we wrote — clear can run after selection drops and no node is available.
let lastStageContent: HTMLElement | null = null;

export function setStageContentCursor(
  target: { getStage(): { content?: HTMLElement } | null } | null | undefined,
  cursor: string
): void {
  const content =
    target?.getStage()?.content ?? (cursor === '' ? lastStageContent : null);
  if (!content) {
    return;
  }
  content.style.cursor = cursor;
  lastStageContent = cursor ? content : null;
}
