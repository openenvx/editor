/**
 * Worker-safe surface for public/SSR rendering of HTML block documents.
 * Does not import editor chrome (TipTap, DnD, WorkbenchShell).
 */
export type {
  BlockConfig,
  BlockRenderProps,
  FieldDef,
  SlotDef,
} from './block-config';
export {
  BlockRegistry,
  BlockRegistryServiceId,
  defaultBlockRegistry,
} from './block-registry';
export { builtinBlocks } from './blocks/builtin-blocks';
export {
  renderBlockDocument,
  renderBlockTree,
  type BlockRenderOverride,
  type RenderBlockDocumentOptions,
} from './render/render-block-document';
export { flattenReactChildren } from './tree/flatten-react-children';
