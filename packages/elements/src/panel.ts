import type { PluginElementType } from '@openenvx/protocol';
import { h, type ComponentChildren, type JSX } from 'preact';

type PropsWithChildren = Record<string, unknown> & {
  children?: ComponentChildren;
};

function panelIntrinsic(
  type: PluginElementType,
  props: PropsWithChildren
): JSX.Element {
  const { children, ...rest } = props;
  return h(type, rest, children) as JSX.Element;
}

function definePanel(
  type: PluginElementType
): (props: PropsWithChildren) => JSX.Element {
  return (props) => panelIntrinsic(type, props);
}

/** Property pane / inspector vocabulary. */
export const Pane = definePanel('Pane');
export const Row = definePanel('Row');
export const Block = definePanel('Block');
export const InputGroup = definePanel('InputGroup');
export const Text = definePanel('Text');
export const Number = definePanel('Number');
export const Color = definePanel('Color');
export const Font = definePanel('Font');
export const Toggle = definePanel('Toggle');
export const Select = definePanel('Select');
export const Align = definePanel('Align');
export const Border = definePanel('Border');
export const CornerRadius = definePanel('CornerRadius');
export const Padding = definePanel('Padding');
export const Shadow = definePanel('Shadow');
export const Image = definePanel('Image');
export const RichText = definePanel('RichText');
export const Repeater = definePanel('Repeater');
export const SlotList = definePanel('SlotList');
export const Action = definePanel('Action');
export const Popup = definePanel('Popup');

/** Chrome contribution vocabulary. */
export const Menu = definePanel('Menu');
export const Item = definePanel('Item');
export const Submenu = definePanel('Submenu');
export const RadioGroup = definePanel('RadioGroup');
export const Separator = definePanel('Separator');
export const Toolbar = definePanel('Toolbar');
export const ToolbarCommand = definePanel('ToolbarCommand');
export const ToolbarDropdown = definePanel('ToolbarDropdown');
export const StatusBar = definePanel('StatusBar');
export const StatusBarText = definePanel('StatusBarText');
export const StatusBarDropdown = definePanel('StatusBarDropdown');
export const Palette = definePanel('Palette');
export const PaletteTab = definePanel('PaletteTab');
export const PaletteCategory = definePanel('PaletteCategory');
export const PaletteItem = definePanel('PaletteItem');
