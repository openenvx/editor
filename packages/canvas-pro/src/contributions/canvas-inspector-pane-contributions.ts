import type { ContributionBuildContext } from '@openenvx/core';
import {
  createInspectorPane,
  InspectorPaneContribution,
  InspectorPath,
} from '@openenvx/headless';

const ABSOLUTE_LAYER_SELECTED = 'page.layoutAbsolute && scene.layerSelected';

function scrubNumberField(key: string, label: string) {
  return {
    key,
    kind: 'number' as const,
    label,
    numeric: { precision: 0, scrub: true },
  };
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
      ])
      .build();
  }
}

export const canvasInspectorPaneContributions = [
  new CanvasLayerTransformInspectorPane(),
  new CanvasTransformsInspectorPane(),
];
