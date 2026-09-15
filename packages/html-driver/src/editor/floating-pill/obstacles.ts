import { type Box, boxesOverlapHorizontally, rectToBox } from './box';
import { FLOATING_PILL_OBSTACLE_SELECTOR } from './constants';

/**
 * Adapter: discover obstacle boxes from the DOM.
 * Shell marks its own chrome; pills never import toolbar renderers.
 */
export function readFloatingPillObstacles(root: ParentNode = document): Box[] {
  const boxes: Box[] = [];
  for (const node of root.querySelectorAll(FLOATING_PILL_OBSTACLE_SELECTOR)) {
    if (!(node instanceof HTMLElement)) {
      continue;
    }
    const rect = node.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) {
      continue;
    }
    boxes.push(rectToBox(rect));
  }
  return boxes;
}

/** Lowest Y a pill's top edge may use given overlapping top obstacles. */
export function clearanceBelowObstacles(
  pillLeft: number,
  pillRight: number,
  obstacles: readonly Box[],
  gap: number,
  floor: number
): number {
  let minTop = floor;
  const band: Box = {
    top: 0,
    left: pillLeft,
    bottom: 0,
    right: pillRight,
  };
  for (const obstacle of obstacles) {
    if (!boxesOverlapHorizontally(band, obstacle)) {
      continue;
    }
    minTop = Math.max(minTop, obstacle.bottom + gap);
  }
  return minTop;
}
