export {
  type Box,
  boxArea,
  boxHeight,
  boxWidth,
  isMostlyVisible,
  rectToBox,
  viewportBox,
  visibleRatio,
} from './box';
export {
  FLOATING_PILL_BOTTOM_INSET_PX,
  FLOATING_PILL_GAP_PX,
  FLOATING_PILL_MIN_VISIBLE_RATIO,
  FLOATING_PILL_OBSTACLE_ATTR,
  FLOATING_PILL_OBSTACLE_SELECTOR,
  FLOATING_PILL_TOP_INSET_PX,
} from './constants';
export {
  clearanceBelowObstacles,
  readFloatingPillObstacles,
} from './obstacles';
export {
  placeFloatingPill,
  selectionBoxFromCoords,
  type FloatingPillAlign,
  type FloatingPillPlacement,
  type PlaceFloatingPillInput,
} from './place-floating-pill';
