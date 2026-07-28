/** Panel element kinds in the declarative plugin vocabulary (v1). */
export const PLUGIN_ELEMENT_TYPES = [
  'Panel',
  'Stack',
  'Text',
  'Button',
  'IconButton',
  'Input',
  'Select',
  'Switch',
  'ImageGrid',
  'Divider',
] as const;

export type PluginElementType = (typeof PLUGIN_ELEMENT_TYPES)[number];

export type PluginTone = 'default' | 'muted' | 'destructive';
export type PluginSize = 'sm' | 'md' | 'lg';
export type PluginGap = 'none' | 'sm' | 'md' | 'lg';
export type PluginAlign = 'start' | 'center' | 'end' | 'stretch';
export type PluginDirection = 'row' | 'column';

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
}
