import { createDefaultTransform } from '@openenvx/studio/schema';
import type { Transform } from '@openenvx/studio/schema';

/** Referentially stable default used when a layer has no transform. */
export const DEFAULT_TRANSFORM: Transform = Object.freeze({
  ...createDefaultTransform(),
  opacity: 1,
  scaleX: 1,
  scaleY: 1,
});
