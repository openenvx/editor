import {
  WorkbenchPlugin,
  type WorkbenchPluginContext,
} from '@openenvx/headless';

import { AlignFieldRenderer } from './advanced/align-field';
import { BorderFieldRenderer } from './advanced/border-field';
import { ColorFieldRenderer } from './advanced/color-field';
import { FontFieldRenderer } from './advanced/font-field';
import { ImageFieldRenderer } from './advanced/image-field';
import { RepeaterFieldRenderer } from './advanced/repeater-field';
import { RichTextFieldRenderer } from './advanced/rich-text-field';
import { SlotListFieldRenderer } from './advanced/slot-list-field';
import {
  CornerRadiusFieldRenderer,
  PaddingFieldRenderer,
  ShadowFieldRenderer,
} from './advanced/spatial-field';
import { CheckboxFieldRenderer } from './basic/checkbox-field';
import { NumberFieldRenderer } from './basic/number-field';
import { SelectFieldRenderer } from './basic/select-field';
import { TextFieldRenderer } from './basic/text-field';
import { ToggleFieldRenderer } from './basic/toggle-field';

const DEFAULT_FIELD_RENDERERS: { kind: string; Component: unknown }[] = [
  { kind: 'align', Component: AlignFieldRenderer },
  { kind: 'border', Component: BorderFieldRenderer },
  { kind: 'checkbox', Component: CheckboxFieldRenderer },
  { kind: 'color', Component: ColorFieldRenderer },
  { kind: 'cornerRadius', Component: CornerRadiusFieldRenderer },
  { kind: 'font', Component: FontFieldRenderer },
  { kind: 'image', Component: ImageFieldRenderer },
  { kind: 'number', Component: NumberFieldRenderer },
  { kind: 'padding', Component: PaddingFieldRenderer },
  { kind: 'repeater', Component: RepeaterFieldRenderer },
  { kind: 'richText', Component: RichTextFieldRenderer },
  { kind: 'select', Component: SelectFieldRenderer },
  { kind: 'shadow', Component: ShadowFieldRenderer },
  { kind: 'slotList', Component: SlotListFieldRenderer },
  { kind: 'text', Component: TextFieldRenderer },
  { kind: 'toggle', Component: ToggleFieldRenderer },
];

export const DEFAULT_FIELDS_PLUGIN_ID = 'openworkbench.default-fields';

export class DefaultWorkbenchFieldsPlugin extends WorkbenchPlugin {
  readonly id = DEFAULT_FIELDS_PLUGIN_ID;

  activateWorkbench(ctx: WorkbenchPluginContext): void {
    for (const { kind, Component } of DEFAULT_FIELD_RENDERERS) {
      ctx.registerFieldRenderer(kind, Component);
    }
  }
}
