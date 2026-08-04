/** Mark workbench floating toolbars so pills can avoid them without importing shell code. */
export const FLOATING_PILL_OBSTACLE_ATTR = 'data-owb-editor-toolbar';

export const FLOATING_PILL_OBSTACLE_SELECTOR = `[${FLOATING_PILL_OBSTACLE_ATTR}]`;

/** Gap between the pill and its anchor / obstacles. */
export const FLOATING_PILL_GAP_PX = 8;

/** Minimum clearance from the viewport top. */
export const FLOATING_PILL_TOP_INSET_PX = 12;

/** Minimum clearance from the viewport bottom. */
export const FLOATING_PILL_BOTTOM_INSET_PX = 12;

/** Hide the pill when less than this fraction of the anchor is on-screen. */
export const FLOATING_PILL_MIN_VISIBLE_RATIO = 0.5;
