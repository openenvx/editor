import { createDefaultTransform } from '@openenvx/core/schema';
import type { Transform } from '@openenvx/core/schema';

/** Referentially stable default used when a layer has no transform. */
export const DEFAULT_TRANSFORM: Transform = Object.freeze(
  createDefaultTransform()
);
