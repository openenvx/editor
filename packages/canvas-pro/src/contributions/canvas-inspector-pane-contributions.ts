import type { ContributionBuildContext } from '@openenvx/core';
import {
  createInspectorPane,
  InspectorPaneContribution,
  InspectorPath,
} from '@openenvx/headless';

const ABSOLUTE_LAYER_SELECTED = 'page.layoutAbsolute && scene.layerSelected';
const ABSOLUTE_PAGE_ONLY = 'page.layoutAbsolute && !scene.layerSelected';
const ABSOLUTE_SVG_LAYER =
  "page.layoutAbsolute && scene.layerSelected && scene.primaryLayerType == 'canvas.svg'";

function scrubNumberField(key: string, label: string) {
  return {
    key,
    kind: 'number' as const,
    label,
    numeric: { precision: 0, scrub: true },
  };
}

function scrubMmField(key: string, label: string) {
  return {
    key,
    kind: 'number' as const,
    label,
    numeric: { min: 0, precision: 1, scrub: true, unit: 'mm' },
  };
}

export class CanvasPagePrintGuidesInspectorPane extends InspectorPaneContribution {
  readonly id = 'canvas.pagePrintGuides';
  readonly title = 'Print guides';

  buildDescriptor(ctx: ContributionBuildContext) {
    const t = ctx.t;
    return createInspectorPane(
      this.id,
      t('canvas.inspector.pagePrintGuides.title', this.title)
    )
      .when(ABSOLUTE_PAGE_ONLY)
      .priority(10)
      .row(
        t('canvas.inspector.bleedMm', 'Bleed'),
        scrubMmField('bleedMm', t('canvas.inspector.bleedMm', 'Bleed')),
        InspectorPath.activePage('bleedMm')
      )
      .row(
        t('canvas.inspector.safeMm', 'Safe'),
        scrubMmField('safeMm', t('canvas.inspector.safeMm', 'Safe')),
        InspectorPath.activePage('safeMm')
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

export class CanvasSvgNodesInspectorPane extends InspectorPaneContribution {
  readonly id = 'canvas.svgNodes';
  readonly title = 'SVG nodes';

  buildDescriptor(ctx: ContributionBuildContext) {
    const t = ctx.t;
    return createInspectorPane(
      this.id,
      t('canvas.inspector.svgNodes.title', this.title)
    )
      .when(ABSOLUTE_SVG_LAYER)
      .priority(32)
      .row(
        t('canvas.inspector.svgNodes.nodes', 'Nodes'),
        {
          chrome: false,
          key: 'svg',
          kind: 'svgNodes',
          label: t('canvas.inspector.svgNodes.nodes', 'Nodes'),
        },
        InspectorPath.layerData('svg')
      )
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
  new CanvasPagePrintGuidesInspectorPane(),
  new CanvasLayerTransformInspectorPane(),
  new CanvasSvgNodesInspectorPane(),
  new CanvasTransformsInspectorPane(),
];
