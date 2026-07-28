/** Inspector port element kinds — compile to fluent builders via headless mapper. */
export const PLUGIN_INSPECTOR_ELEMENT_TYPES = [
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

/** All element kinds in the declarative plugin vocabulary. */
export const PLUGIN_ELEMENT_TYPES = [
  ...PLUGIN_INSPECTOR_ELEMENT_TYPES,
  ...PLUGIN_CHROME_ELEMENT_TYPES,
] as const;

export type PluginInspectorElementType =
  (typeof PLUGIN_INSPECTOR_ELEMENT_TYPES)[number];
export type PluginChromeElementType =
  (typeof PLUGIN_CHROME_ELEMENT_TYPES)[number];
export type PluginElementType = (typeof PLUGIN_ELEMENT_TYPES)[number];

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
 * Element type → PropertyFieldKind for inspector field elements.
 */
export const PLUGIN_FIELD_ELEMENT_TO_KIND: Readonly<
  Record<string, PluginFieldKind>
> = {
  Text: 'text',
  Number: 'number',
  Toggle: 'toggle',
  Select: 'select',
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

/** Serializable props (functions become handler ids during `h()`). */
export type PluginPropValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | PluginPropValue[]
  | { [key: string]: PluginPropValue };

export interface PluginNode {
  type: PluginElementType;
  key?: string | number;
  props: Record<string, PluginPropValue>;
  children: PluginChild[];
}

export type PluginChild =
  | PluginNode
  | string
  | number
  | boolean
  | null
  | undefined;

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
  panelId: string;
  templateId: string | null;
  permission: 'read' | 'edit';
  theme: string;
  selection: PluginPanelSelection;
  /** Present only when the panel was declared with `contextScope: 'scene'`. */
  scene?: unknown;
}

export interface PluginPanelDeclaration {
  id: string;
  title: string;
  icon?: string;
  allowedCommands: string[];
  contextScope: PluginContextScope;
  /**
   * Privileged: allow `panel:manifest` chrome registration.
   * Manifest command ids are still filtered through {@link allowedCommands}.
   */
  allowManifest?: boolean;
}
