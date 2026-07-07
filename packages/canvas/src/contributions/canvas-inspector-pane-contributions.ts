import {
  createInspectorPane,
  InspectorPaneContribution,
} from '@openenvx/core';
import type { ContributionBuildContext } from '@openenvx/core';
import { InspectorPath } from '@openenvx/headless';
import { PAGE_SIZE_PRESETS } from '@openenvx/schema';

const ABSOLUTE_LAYER_SELECTED = 'page.layoutAbsolute && scene.layerSelected';
const ABSOLUTE_NO_LAYER = 'page.layoutAbsolute && !scene.layerSelected';

const SCRUB_NUMERIC = { numeric: { precision: 0, scrub: true } };

const PADDING_TOP_ICON = { ...SCRUB_NUMERIC, icon: 'arrowDown' };
const PADDING_RIGHT_ICON = { ...SCRUB_NUMERIC, icon: 'arrowRight' };
const PADDING_BOTTOM_ICON = { ...SCRUB_NUMERIC, icon: 'arrowUp' };
const PADDING_LEFT_ICON = { ...SCRUB_NUMERIC, icon: 'arrowLeft' };

function scrubNumberField(key: string, label: string) {
  return {
    key,
    kind: 'number' as const,
    label,
    numeric: { precision: 0, scrub: true },
  };
}

export class CanvasLayoutInspectorPane extends InspectorPaneContribution {
  readonly id = 'canvas.layout';
  readonly title = 'Layout';

  buildDescriptor(ctx: ContributionBuildContext) {
    const t = ctx.t;
    return createInspectorPane(
      this.id,
      t('canvas.inspector.layout.title', this.title)
    )
      .when(ABSOLUTE_LAYER_SELECTED)
      .priority(10)
      .row('Display', {
        key: 'layoutDisplay',
        kind: 'select',
        label: t('canvas.inspector.display', 'Display'),
        options: [
          { label: t('canvas.inspector.auto', 'Auto'), value: 'auto' },
          { label: t('canvas.inspector.flex', 'Flex'), value: 'flex' },
        ],
      })
      .row('Direction', {
        key: 'layoutDirection',
        kind: 'select',
        label: t('canvas.inspector.direction', 'Direction'),
        options: [
          {
            label: t('canvas.inspector.horizontal', 'Horizontal'),
            value: 'horizontal',
          },
          {
            label: t('canvas.inspector.vertical', 'Vertical'),
            value: 'vertical',
          },
        ],
      })
      .row('Align', {
        key: 'layoutAlign',
        kind: 'select',
        label: t('canvas.inspector.align', 'Align'),
        options: [
          { label: t('canvas.inspector.start', 'Start'), value: 'start' },
          { label: t('canvas.inspector.center', 'Center'), value: 'center' },
          { label: t('canvas.inspector.end', 'End'), value: 'end' },
        ],
      })
      .row('Justify', {
        key: 'layoutJustify',
        kind: 'select',
        label: t('canvas.inspector.justify', 'Justify'),
        options: [
          { label: t('canvas.inspector.start', 'Start'), value: 'start' },
          { label: t('canvas.inspector.center', 'Center'), value: 'center' },
          { label: t('canvas.inspector.end', 'End'), value: 'end' },
        ],
      })
      .row('Wrap', {
        key: 'layoutWrap',
        kind: 'select',
        label: t('canvas.inspector.wrap', 'Wrap'),
        options: [
          { label: t('canvas.inspector.yes', 'Yes'), value: 'yes' },
          { label: t('canvas.inspector.no', 'No'), value: 'no' },
        ],
      })
      .row('Gap', {
        key: 'layoutGap',
        kind: 'number',
        label: t('canvas.inspector.gap', 'Gap'),
      })
      .row(
        'Padding',
        {
          key: 'padding',
          kind: 'padding',
          label: t('canvas.inspector.padding', 'Padding'),
        },
        InspectorPath.layerData('padding')
      )
      .withPopup(
        'grid',
        (popup) =>
          popup
            .number('top', t('canvas.inspector.top', 'Top'), PADDING_TOP_ICON)
            .number(
              'right',
              t('canvas.inspector.right', 'Right'),
              PADDING_RIGHT_ICON
            )
            .number(
              'bottom',
              t('canvas.inspector.bottom', 'Bottom'),
              PADDING_BOTTOM_ICON
            )
            .number(
              'left',
              t('canvas.inspector.left', 'Left'),
              PADDING_LEFT_ICON
            ),
        t('canvas.inspector.padding', 'Padding')
      )
      .build();
  }
}

export class CanvasLayerTransformInspectorPane extends InspectorPaneContribution {
  readonly id = 'canvas.layer';
  readonly title = 'Layer';

  buildDescriptor(ctx: ContributionBuildContext) {
    const t = ctx.t;
    return createInspectorPane(
      this.id,
      t('canvas.inspector.layer.title', this.title)
    )
      .when(ABSOLUTE_LAYER_SELECTED)
      .priority(20)
      .inputGroup(t('canvas.inspector.position', 'Position'), [
        {
          field: scrubNumberField('x', 'X'),
          path: InspectorPath.layerTransform('x'),
        },
        {
          field: scrubNumberField('y', 'Y'),
          path: InspectorPath.layerTransform('y'),
        },
      ])
      .inputGroup(t('canvas.inspector.size', 'Size'), [
        {
          field: scrubNumberField('width', 'W'),
          path: InspectorPath.layerTransform('width'),
        },
        {
          field: scrubNumberField('height', 'H'),
          path: InspectorPath.layerTransform('height'),
        },
      ])
      .build();
  }
}

export class CanvasTransformsInspectorPane extends InspectorPaneContribution {
  readonly id = 'canvas.transforms';
  readonly title = 'Transforms';

  buildDescriptor(ctx: ContributionBuildContext) {
    const t = ctx.t;
    return createInspectorPane(
      this.id,
      t('canvas.inspector.transforms.title', this.title)
    )
      .when(ABSOLUTE_LAYER_SELECTED)
      .priority(40)
      .row(
        'Rotate',
        {
          key: 'rotation',
          kind: 'number',
          label: t('canvas.inspector.rotate', 'Rotate'),
          numeric: { precision: 0, scrub: true, unit: '°' },
        },
        InspectorPath.layerTransform('rotation')
      )
      .withActions([
        {
          icon: 'rotateLeft',
          label: t('canvas.inspector.rotateLeft', 'Rotate left'),
          onClick: { type: 'command', commandId: 'canvas.rotateLeft' },
        },
        {
          icon: 'rotateRight',
          label: t('canvas.inspector.rotateRight', 'Rotate right'),
          onClick: { type: 'command', commandId: 'canvas.rotateRight' },
        },
        {
          icon: 'flipH',
          label: t('canvas.inspector.flipHorizontal', 'Flip horizontal'),
          onClick: { type: 'toggle', key: 'flipH' },
        },
        {
          icon: 'flipV',
          label: t('canvas.inspector.flipVertical', 'Flip vertical'),
          onClick: { type: 'toggle', key: 'flipV' },
        },
      ])
      .build();
  }
}

export class CanvasPageSettingsInspectorPane extends InspectorPaneContribution {
  readonly id = 'canvas.page';
  readonly title = 'Page';

  buildDescriptor(ctx: ContributionBuildContext) {
    const t = ctx.t;
    return createInspectorPane(
      this.id,
      t('canvas.inspector.page.title', this.title)
    )
      .when(ABSOLUTE_NO_LAYER)
      .priority(5)
      .row(
        'Size',
        {
          key: 'presetId',
          kind: 'pagePreset',
          label: t('canvas.inspector.size', 'Size'),
          options: PAGE_SIZE_PRESETS.map((preset) => ({
            label: preset.label,
            value: preset.id,
          })),
        },
        InspectorPath.activePage('presetId')
      )
      .row(
        'Dimensions',
        {
          key: 'dimensions',
          kind: 'text',
          label: t('canvas.inspector.dimensions', 'Dimensions'),
        },
        InspectorPath.activePage('dimensions')
      )
      .build();
  }
}

export const canvasInspectorPaneContributions = [
  new CanvasPageSettingsInspectorPane(),
  new CanvasLayoutInspectorPane(),
  new CanvasLayerTransformInspectorPane(),
  new CanvasTransformsInspectorPane(),
];
