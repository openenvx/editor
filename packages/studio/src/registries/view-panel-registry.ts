import type { Registry } from '../backbone';

/** Maps view / panel component ids to React components (opaque at headless layer). */
export type ViewPanelRegistry = Registry<string, unknown>;
