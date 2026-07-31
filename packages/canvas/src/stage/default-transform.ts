import { createDefaultTransform } from '@xmazu/openenvxee-schema';
import type { Transform } from '@xmazu/openenvxee-schema';

/** Referentially stable default used when a layer has no transform. */
export const DEFAULT_TRANSFORM: Transform = Object.freeze(
  createDefaultTransform()
);
