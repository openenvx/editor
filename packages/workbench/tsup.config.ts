import { createLibraryConfig } from '@openenvx/typescript-config/tsup.library';

// Private package — consumers resolve TypeScript from `src/`. Skip DTS (CSS
// module re-exports break rollup-plugin-dts).
export default createLibraryConfig({ dts: false });
