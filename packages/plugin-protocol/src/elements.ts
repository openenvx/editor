import type { PluginElement, PluginElementType } from './types';

function element(type: PluginElementType): PluginElement {
  return { __pluginElement: true, type };
}

export const Panel = element('Panel');
export const Stack = element('Stack');
export const Text = element('Text');
export const Button = element('Button');
export const IconButton = element('IconButton');
export const Input = element('Input');
export const Select = element('Select');
export const Switch = element('Switch');
export const ImageGrid = element('ImageGrid');
export const Divider = element('Divider');
