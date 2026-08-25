import { Registry } from '../backbone';

/** Maps top-bar ids to React components (opaque at the headless layer). */
export type TopBarRegistry = Registry<string, unknown>;
