export type { BlockConfig, BlockRenderProps, FieldDef } from './block-config';
export {
  BlockRegistry,
  BlockRegistryServiceId,
  defaultBlockRegistry,
} from './block-registry';
export { builtinBlocks } from './blocks/builtin-blocks';
export {
  InsertHtmlBlockCommand,
  MoveHtmlBlockCommand,
  RemoveHtmlBlockCommand,
  UpdateHtmlBlockDataCommand,
} from './commands/html-block-commands';
export { createHtmlDemoScene } from './create-html-demo-scene';
export { createHtmlLayerDefinition } from './create-html-layer-definition';
export {
  HTML_BLOCKS_CONTAINER_ID,
  HTML_BLOCKS_PANEL_COMPONENT_ID,
  HTML_BLOCKS_VIEW_ID,
  HtmlBlocksContainer,
  HtmlBlocksView,
} from './contributions/html-blocks-sidebar';
export { BlockPalettePanel } from './editor/block-palette-panel';
export { HtmlEditorPane } from './editor/html-editor-pane';
export { HtmlBlocksPlugin } from './plugin/html-blocks-plugin';
export {
  createBlock,
  findBlock,
  getPageRootId,
  insertAt,
  mapPageLayers,
  moveTo,
  removeById,
  updateBlockData,
} from './tree/block-tree';
