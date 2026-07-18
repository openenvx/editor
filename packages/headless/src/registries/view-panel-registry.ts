import type { Registry } from '@openenvx/core';

/** Maps view / panel component ids to React components (opaque at headless layer). */
export type ViewPanelRegistry = Registry<string, unknown>;
