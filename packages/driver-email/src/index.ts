export {
  emailBlockRegistry,
  EmailBlockRegistryServiceId,
} from './block-registry';
export { builtinEmailBlocks } from './blocks/builtin-blocks';
export {
  emailPatternCatalog,
  filterPatternCatalog,
  patternGroups,
  type EmailPatternEntry,
} from './blocks/pattern-catalog';
export {
  emailPatternBlocks,
  emailPatternPartBlocks,
  headerBlock,
  linkBlock,
} from './blocks/pattern-blocks';
export { OpenEmailBlocksSheetCommand } from './commands/open-blocks-sheet-command';
export {
  EMAIL_ELEMENTS_CONTAINER_ID,
  EMAIL_ELEMENTS_PANEL_COMPONENT_ID,
  EMAIL_ELEMENTS_VIEW_ID,
  EmailElementsContainer,
  EmailElementsView,
} from './contributions/email-blocks-sidebar';
export {
  EMAIL_BLOCKS_SHEET_OPEN_KEY,
  EMAIL_OPEN_BLOCKS_SHEET_COMMAND_ID,
  EMAIL_PATTERNS_CONTAINER_ID,
  EmailPatternsContainer,
} from './contributions/email-patterns-sidebar';
export { EmailContextMenu } from './contributions/email-context-menu';
export { createEmailDemoScene } from './create-email-demo-scene';
export { EmailBlockPalettePanel } from './editor/block-palette-panel';
export { EmailPatternBlocksSheet } from './editor/pattern-blocks-sheet';
export { EMAIL_FRAME_WIDTH, EmailEditorPane } from './editor/email-editor-pane';
export { EmailBlocksPlugin } from './plugin/email-blocks-plugin';
export { renderEmailDocument } from './render/render-email-document';
