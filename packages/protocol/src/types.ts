/** Property pane element kinds — compile to fluent builders via headless mapper. */
export const PLUGIN_PROPERTY_ELEMENT_TYPES = [
  'Pane',
  'Row',
  'Block',
  'InputGroup',
  'Text',
  'Number',
  'Color',
  'Font',
  'Toggle',
  'Select',
  'Segmented',
  'Align',
  'Border',
  'CornerRadius',
  'Padding',
  'Shadow',
  'Image',
  'RichText',
  'Repeater',
  'SlotList',
  'Action',
  'Popup',
] as const;

/**
 * Chrome contribution element kinds — compile to menu/toolbar/status/palette builders.
 */
export const PLUGIN_CHROME_ELEMENT_TYPES = [
  'Menu',
  'Item',
  'Submenu',
  'RadioGroup',
  'Separator',
  'Toolbar',
  'ToolbarCommand',
  'ToolbarDropdown',
  'StatusBar',
  'StatusBarText',
  'StatusBarDropdown',
  'Palette',
  'PaletteTab',
  'PaletteCategory',
  'PaletteItem',
] as const;

/** All element kinds in the declarative panel vocabulary. */
export const PLUGIN_ELEMENT_TYPES = [
  ...PLUGIN_PROPERTY_ELEMENT_TYPES,
  ...PLUGIN_CHROME_ELEMENT_TYPES,
] as const;

/** Canvas widget element vocabulary. */
export const CANVAS_ELEMENT_TYPES = [
  'Group',
  'Stack',
  'Grid',
  'Text',
  'Rect',
  'Ellipse',
  'Image',
  'SVG',
  'QR',
  'Layer',
  'Instance',
] as const;

/** HTML widget / block element vocabulary. */
export const HTML_ELEMENT_TYPES = [
  'Section',
  'Row',
  'Column',
  'Heading',
  'Paragraph',
  'Button',
  'Image',
  'Divider',
  'Html',
  'Block',
] as const;

export type PluginInspectorElementType =
  (typeof PLUGIN_PROPERTY_ELEMENT_TYPES)[number];
export type PluginChromeElementType =
  (typeof PLUGIN_CHROME_ELEMENT_TYPES)[number];
export type PluginElementType = (typeof PLUGIN_ELEMENT_TYPES)[number];
export type CanvasElementType = (typeof CANVAS_ELEMENT_TYPES)[number];
export type HtmlElementType = (typeof HTML_ELEMENT_TYPES)[number];

export type PluginTone = 'default' | 'muted' | 'destructive';
export type PluginSize = 'sm' | 'md' | 'lg';
export type PluginGap = 'none' | 'sm' | 'md' | 'lg';
export type PluginAlign = 'start' | 'center' | 'end' | 'stretch';
export type PluginDirection = 'row' | 'column';

/** Field kinds that map 1:1 onto PropertyFieldDescriptor.kind. */
export const PLUGIN_FIELD_KINDS = [
  'text',
  'number',
  'toggle',
  'select',
  'segmented',
  'font',
  'color',
  'richText',
  'repeater',
  'slotList',
  'image',
  'border',
  'cornerRadius',
  'padding',
  'shadow',
  'align',
] as const;

export type PluginFieldKind = (typeof PLUGIN_FIELD_KINDS)[number];

/**
 * Element type → PropertyFieldKind for property field elements.
 */
export const PLUGIN_FIELD_ELEMENT_TO_KIND: Readonly<
  Record<string, PluginFieldKind>
> = {
  Text: 'text',
  Number: 'number',
  Toggle: 'toggle',
  Select: 'select',
  Segmented: 'segmented',
  Font: 'font',
  Color: 'color',
  RichText: 'richText',
  Repeater: 'repeater',
  SlotList: 'slotList',
  Image: 'image',
  Border: 'border',
  CornerRadius: 'cornerRadius',
  Padding: 'padding',
  Shadow: 'shadow',
  Align: 'align',
};

/** Serializable prop values (functions become handler ids during render). */
export type RenderPropValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | RenderPropValue[]
  | { [key: string]: RenderPropValue };

/**
 * Shared envelope for canvas widgets, HTML widgets, and panels.
 * Vocabulary is validated separately per medium.
 */
export interface RenderNode {
  type: string;
  key?: string | number;
  props: Record<string, RenderPropValue>;
  children: RenderChild[];
}

export type RenderChild =
  | RenderNode
  | string
  | number
  | boolean
  | null
  | undefined;

/** Serializable props (functions become handler ids during render). */
export type PluginPropValue = RenderPropValue;

export interface PluginNode extends RenderNode {
  type: PluginElementType;
  props: Record<string, PluginPropValue>;
  children: PluginChild[];
}

export type PluginChild = RenderChild;

export type PluginHandler = (...args: unknown[]) => void;

export interface PluginElement {
  readonly __pluginElement: true;
  readonly type: PluginElementType;
}

export type PluginComponent = PluginElement;

export type PluginContextScope = 'selection' | 'scene';

export interface PluginPanelSelection {
  activePageId: string;
  selectedLayerIds: string[];
  primaryLayerId: string | null;
}

export interface PluginPanelContext {
  /** Surface id (panel / view). */
  surfaceId: string;
  templateId: string | null;
  permission: 'read' | 'edit';
  theme: string;
  selection: PluginPanelSelection;
  /** Present only when the surface was declared with `contextScope: 'scene'`. */
  scene?: unknown;
}

export interface PluginPanelDeclaration {
  id: string;
  title: string;
  icon?: string;
  allowedCommands: string[];
  contextScope: PluginContextScope;
}
