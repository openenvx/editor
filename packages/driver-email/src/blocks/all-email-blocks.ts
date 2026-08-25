import { builtinEmailBlocks } from './builtin-blocks';
import { emailPatternBlocks, emailPatternPartBlocks } from './patterns';

/** Every email block the plugin registers and headless export can render. */
export const allEmailBlocks = [
  ...builtinEmailBlocks,
  ...emailPatternPartBlocks,
  ...emailPatternBlocks,
];
