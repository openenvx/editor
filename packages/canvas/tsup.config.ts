import { createLibraryConfig } from '@openenvx/typescript-config/tsup.library';

// Private package — consumers resolve TypeScript from `src/`. Skip DTS (large
// surface + Konva/TipTap types OOM tsup's DTS worker in CI).
export default createLibraryConfig({ dts: false });
