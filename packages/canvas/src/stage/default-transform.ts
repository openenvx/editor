import { createDefaultTransform } from '@openenvx/schema';
import type { Transform } from '@openenvx/schema';

/** Referentially stable default used when a layer has no transform. */
export const DEFAULT_TRANSFORM: Transform = Object.freeze(
  createDefaultTransform()
);
