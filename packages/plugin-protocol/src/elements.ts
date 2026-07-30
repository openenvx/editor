import type { PluginElement, PluginElementType } from './types';

function element(type: PluginElementType): PluginElement {
  return { __pluginElement: true, type };
}

/** Property pane port — maps onto createPropertyPane(). */
export const Pane = element('Pane');
export const Row = element('Row');
export const Block = element('Block');
export const InputGroup = element('InputGroup');
export const Text = element('Text');
export const Number = element('Number');
export const Color = element('Color');
export const Font = element('Font');
export const Toggle = element('Toggle');
export const Select = element('Select');
export const Align = element('Align');
export const Border = element('Border');
export const CornerRadius = element('CornerRadius');
export const Padding = element('Padding');
export const Shadow = element('Shadow');
export const Image = element('Image');
export const RichText = element('RichText');
export const Repeater = element('Repeater');
export const SlotList = element('SlotList');
export const Action = element('Action');
export const Popup = element('Popup');

/** Chrome contribution port — maps onto menu/toolbar/status/palette builders. */
export const Menu = element('Menu');
export const Item = element('Item');
export const Submenu = element('Submenu');
export const RadioGroup = element('RadioGroup');
export const Separator = element('Separator');
export const Toolbar = element('Toolbar');
export const ToolbarCommand = element('ToolbarCommand');
export const ToolbarDropdown = element('ToolbarDropdown');
export const StatusBar = element('StatusBar');
export const StatusBarText = element('StatusBarText');
export const StatusBarDropdown = element('StatusBarDropdown');
export const Palette = element('Palette');
export const PaletteTab = element('PaletteTab');
export const PaletteCategory = element('PaletteCategory');
export const PaletteItem = element('PaletteItem');
