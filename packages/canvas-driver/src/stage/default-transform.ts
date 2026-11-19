import { createDefaultFrame } from '@openenvx/editor/schema';
import type { Transform } from '@openenvx/editor/schema';

/** Referentially stable default used when a layer has no transform. */
export const DEFAULT_TRANSFORM: Transform = Object.freeze({
  ...createDefaultFrame(),
  opacity: 1,
  scaleX: 1,
  scaleY: 1,
});
