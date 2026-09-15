import articleWithImage from './article-with-image';
import {
  collectPatternRegistry,
  filterPatternCatalog,
  patternGroups,
  type EmailPatternEntry,
} from './define-email-pattern';
import header from './header';
import { linkBlock } from './link';

/**
 * Add a pattern: create `./foo.tsx` with `defineEmailPattern` (children tree, not slots),
 * then append here.
 */
export const emailPatterns = [header, articleWithImage];

const registry = collectPatternRegistry(emailPatterns);

export const emailPatternCatalog = registry.catalog;
export const emailPatternBlocks = registry.blocks;
export const emailPatternPartBlocks = registry.parts;

export const headerBlock = header.block;
export const articleWithImageBlock = articleWithImage.block;

export {
  filterPatternCatalog,
  linkBlock,
  patternGroups,
  type EmailPatternEntry,
};
export { defineEmailPattern } from './define-email-pattern';
