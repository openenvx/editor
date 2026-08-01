export type {
  WidgetFieldKind,
  WidgetFieldDef,
  WidgetKind,
  WidgetManifest,
  WidgetNode,
  WidgetChild,
  WidgetElementType,
  CanvasElementType,
  HtmlElementType,
  StackProps,
  TextProps,
  RectangleProps,
  EllipseProps,
  ImageProps,
  SvgProps,
  QrProps,
  LayerByNameProps,
  InstanceProps,
  LayoutIntent,
  StackDirection,
  StackAlign,
} from './types';

export {
  defineCanvasComponent,
  defineHtmlComponent,
  getRegisteredWidget,
  getRegisteredWidgets,
  clearRegisteredWidgets,
  type WidgetComponent,
  type RegisteredWidget,
  type DefineComponentOptions,
  type SetProps,
} from './define-component';

export {
  defineExtension,
  type DefineExtensionOptions,
} from './define-extension';

export {
  string,
  number,
  boolean,
  color,
  asset,
  richText,
  font,
  align,
  select,
  list,
  compilePropsSchema,
  defaultsFromProps,
  type PropSchema,
  type PropsSchema,
  type InferProps,
  type AssetRef,
} from './props';

export {
  Group,
  Stack,
  Row,
  Grid,
  Text,
  Rect,
  Ellipse,
  Image,
  SVG,
  QR,
  Layer,
  Instance,
} from './components/canvas';

export {
  Section,
  Column,
  Heading,
  Paragraph,
  Button,
  HtmlImage,
  Divider,
  Html,
  Block,
} from './components/html';

// HTML Row lives on the /html subpath to avoid colliding with canvas Row.

export {
  renderToElementTree,
  renderToLayers,
  type RenderOptions,
} from './render-to-layers';

export {
  validateWidgetTree,
  WidgetTreeValidationError,
} from './validate-widget-tree';

export {
  createHostDocument,
  createHostContainer,
  type HostNode,
  type HostDocument,
} from './host/fake-dom';

export {
  beginHandlers,
  endHandlers,
  serializePropValue,
  collectHandlerProps,
  type HandlerRegistry,
  type WidgetHandler,
  type WidgetHandlerMap,
} from './host/handlers';

export { expandToWidgetTree, hostNodeToWidgetTree } from './host/walk-tree';
