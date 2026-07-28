import { CanvasProPlugin } from './plugin/canvas-pro-plugin';
import { CanvasTemplatePlugin } from './plugin/canvas-template-plugin';

export { alignTransforms, distributeHorizontally } from './align/align';
export {
  AlignLayersBottomCommand,
  AlignLayersCenterCommand,
  AlignLayersCommand,
  AlignLayersLeftCommand,
  AlignLayersMiddleCommand,
  AlignLayersRightCommand,
  AlignLayersTopCommand,
  DistributeLayersHorizontallyCommand,
} from './commands/align-layers-commands';
export { CanvasCommandPaletteItems } from './contributions/canvas-command-palette';
export { CanvasContextMenu } from './contributions/canvas-context-menu';
export {
  CanvasTemplateContainer,
  TEMPLATE_DATA_CONTAINER_ID,
} from './contributions/canvas-template-contribution';
export { TemplateDataPanel } from './components/template-data-panel';
export { CanvasTemplatePlugin } from './plugin/canvas-template-plugin';
export { CanvasProPlugin } from './plugin/canvas-pro-plugin';
export {
  CanvasStatusBarContribution,
  CanvasToolbarContribution,
} from './contributions/canvas-shell-contributions';
export {
  CanvasLayerTransformInspectorPane,
  CanvasPagePrintGuidesInspectorPane,
  CanvasTransformsInspectorPane,
  canvasInspectorPaneContributions,
} from './contributions/canvas-inspector-pane-contributions';
export { DEFAULT_CANVAS_LAYOUT } from './default-canvas-layout';
export { createCanvasInspectorHostContextWithApi } from './inspector/create-canvas-inspector-host-context';
export { SmartGuidesStageInteraction } from './stage/smart-guides-stage-interaction';
export {
  ImageCropInteraction,
  canResetImageCrop,
} from './interactions/image-crop-interaction';
export { ProImageSvgSerializer } from './export/pro-image-svg-serializer';
export { proImageCanvasContributions } from './contributions/pro-image-contributions';
export {
  hasActiveCrop,
  readImageCrop,
  type NormalizedCrop,
} from './crop/normalized-crop';

export const DEFAULT_CANVAS_PRO_PLUGINS = [
  new CanvasProPlugin(),
  new CanvasTemplatePlugin(),
];
