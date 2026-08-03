export {
  emailBlockRegistry,
  EmailBlockRegistryServiceId,
} from './block-registry';
export { builtinEmailBlocks } from './blocks/builtin-blocks';
export { imageLinkBlock } from './blocks/image-link';
export {
  articleWithImageBlock,
  defineEmailPattern,
  emailPatternBlocks,
  emailPatternCatalog,
  emailPatternPartBlocks,
  filterPatternCatalog,
  headerBlock,
  linkBlock,
  patternGroups,
  type EmailPatternEntry,
} from './blocks/patterns';
export { OpenEmailBlocksSheetCommand } from './commands/open-blocks-sheet-command';
export { OpenEmailTemplatesSheetCommand } from './commands/open-templates-sheet-command';
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
  EMAIL_PATTERNS_PANEL_COMPONENT_ID,
  EMAIL_PATTERNS_VIEW_ID,
  EmailPatternsContainer,
  EmailPatternsView,
} from './contributions/email-patterns-sidebar';
export {
  EMAIL_OPEN_TEMPLATES_SHEET_COMMAND_ID,
  EMAIL_TEMPLATES_CONTAINER_ID,
  EMAIL_TEMPLATES_PANEL_COMPONENT_ID,
  EMAIL_TEMPLATES_SHEET_OPEN_KEY,
  EMAIL_TEMPLATES_VIEW_ID,
  EmailTemplatesContainer,
  EmailTemplatesView,
} from './contributions/email-templates-sidebar';
export { EmailContextMenu } from './contributions/email-context-menu';
export { createEmailDemoScene } from './create-email-demo-scene';
export { EmailBlockPalettePanel } from './editor/block-palette-panel';
export { EmailPatternBlocksGallery } from './editor/pattern-blocks-gallery';
export { EmailTemplatesGallery } from './editor/templates-gallery';
export { EMAIL_FRAME_WIDTH, EmailEditorPane } from './editor/email-editor-pane';
export { EmailBlocksPlugin } from './plugin/email-blocks-plugin';
export { renderEmailDocument } from './render/render-email-document';
export {
  Button,
  Column,
  Email,
  Heading,
  ImageLink,
  Img,
  Link,
  Row,
  Section,
  Text,
  createBarebonesActivationScene,
  createBarebonesFeatureAnnouncementScene,
  emailTemplateCatalog,
  findTemplate,
  findTemplateCollection,
  sceneFromEmailJsx,
  type EmailJsxProps,
  type EmailTemplateCollection,
  type EmailTemplateEntry,
  type SceneFromEmailJsxOptions,
} from './templates';
