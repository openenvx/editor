import {
  Action,
  InputGroup,
  Number,
  Pane,
  Popup,
  Row,
  h,
} from '@xmazu/openenvxee-plugin-protocol';
import { describe, expect, it } from 'vitest';

import { InspectorPath } from '../inspector/inspector-path';
import type { PropertyPaneDescriptor } from '../inspector/property-pane-descriptor';
import { createPropertyPane } from '../inspector/property-pane-builder';
import { mapPluginTreeToPropertyPane } from './map-plugin-tree-to-property-pane';

function serializePane(pane: PropertyPaneDescriptor): unknown {
  return {
    id: pane.id,
    title: pane.title,
    when: pane.when,
    priority: pane.priority,
    nodes: pane.nodes.map((node) => node.accept(serializeVisitor)),
  };
}

const serializeVisitor = {
  visitRow(node: {
    label: string;
    field: unknown;
    path?: string;
  }): unknown {
    return {
      kind: 'row',
      label: node.label,
      path: node.path,
      field: node.field,
    };
  },
  visitBlock(node: {
    label: string;
    children: { accept: (v: typeof serializeVisitor) => unknown }[];
  }): unknown {
    return {
      kind: 'block',
      label: node.label,
      children: node.children.map((child) => child.accept(serializeVisitor)),
    };
  },
  visitInputGroup(node: {
    blockLabel: string;
    cells: unknown[];
  }): unknown {
    return {
      kind: 'inputGroup',
      blockLabel: node.blockLabel,
      cells: node.cells,
    };
  },
};

describe('mapPluginTreeToPropertyPane', () => {
  it('matches handwritten builder for InputGroup layout', () => {
    const viaBuilder = createPropertyPane('canvas.layer', 'Layer')
      .when('page.layoutAbsolute && scene.layerSelected')
      .priority(20)
      .inputGroup('Position', [
        {
          field: {
            key: 'x',
            kind: 'number',
            label: 'X',
            numeric: { precision: 0, scrub: true },
          },
          path: InspectorPath.layerTransform('x'),
        },
        {
          field: {
            key: 'y',
            kind: 'number',
            label: 'Y',
            numeric: { precision: 0, scrub: true },
          },
          path: InspectorPath.layerTransform('y'),
        },
      ])
      .build();

    const viaTree = mapPluginTreeToPropertyPane(
      h(
        Pane,
        {
          id: 'canvas.layer',
          title: 'Layer',
          when: 'page.layoutAbsolute && scene.layerSelected',
          priority: 20,
        },
        h(
          InputGroup,
          { label: 'Position' },
          h(Number, {
            key: 'x',
            label: 'X',
            bind: InspectorPath.layerTransform('x'),
            scrub: true,
            precision: 0,
          }),
          h(Number, {
            key: 'y',
            label: 'Y',
            bind: InspectorPath.layerTransform('y'),
            scrub: true,
            precision: 0,
          })
        )
      )
    );

    expect(serializePane(viaTree)).toEqual(serializePane(viaBuilder));
  });

  it('matches handwritten builder for row with popup and actions', () => {
    const viaBuilder = createPropertyPane('canvas.transforms', 'Transforms')
      .when('page.layoutAbsolute && scene.layerSelected')
      .priority(40)
      .row(
        'Rotate',
        {
          key: 'rotation',
          kind: 'number',
          label: 'Rotate',
          numeric: { precision: 0, scrub: true, unit: '°' },
        },
        InspectorPath.layerTransform('rotation')
      )
      .withActions([
        {
          icon: 'rotateLeft',
          label: 'Rotate left',
          onClick: { type: 'command', commandId: 'canvas.rotateLeft' },
        },
        {
          icon: 'rotateRight',
          label: 'Rotate right',
          onClick: { type: 'command', commandId: 'canvas.rotateRight' },
        },
      ])
      .withPopup('settings', (popup) => {
        popup.number('fine', 'Fine', {
          numeric: { precision: 1, scrub: true },
        });
      }, 'Fine tune')
      .build();

    const viaTree = mapPluginTreeToPropertyPane(
      h(
        Pane,
        {
          id: 'canvas.transforms',
          title: 'Transforms',
          when: 'page.layoutAbsolute && scene.layerSelected',
          priority: 40,
        },
        h(
          Row,
          { label: 'Rotate' },
          h(
            Number,
            {
              key: 'rotation',
              label: 'Rotate',
              bind: InspectorPath.layerTransform('rotation'),
              scrub: true,
              precision: 0,
              unit: '°',
            },
            h(Action, {
              icon: 'rotateLeft',
              label: 'Rotate left',
              onClick: { type: 'command', commandId: 'canvas.rotateLeft' },
            }),
            h(Action, {
              icon: 'rotateRight',
              label: 'Rotate right',
              onClick: { type: 'command', commandId: 'canvas.rotateRight' },
            }),
            h(
              Popup,
              { icon: 'settings', title: 'Fine tune' },
              h(Number, {
                key: 'fine',
                label: 'Fine',
                scrub: true,
                precision: 1,
              })
            )
          )
        )
      )
    );

    expect(serializePane(viaTree)).toEqual(serializePane(viaBuilder));
  });

  it('encodes Action handler clicks as plugin.handler commands', () => {
    const pane = mapPluginTreeToPropertyPane(
      h(
        Pane,
        { id: 'ext.panel', title: 'Ext' },
        h(
          Row,
          { label: 'Name' },
          h(
            Number,
            {
              key: 'name',
              label: 'Name',
              bind: InspectorPath.plugin('ext.panel', 'name'),
            },
            h(Action, {
              icon: 'sparkles',
              label: 'Go',
              onClick: { type: 'handler', handlerId: 'onGo' },
            })
          )
        )
      ),
      { panelId: 'ext.panel' }
    );

    const row = pane.nodes[0];
    expect(row).toBeTruthy();
    if (!row || !('field' in row)) {
      throw new Error('expected row');
    }
    expect(row.field.actions?.[0]?.onClick).toEqual({
      type: 'command',
      commandId: 'plugin.handler:onGo',
    });
  });

  it('defaults missing binds to plugin.<panelId>.<key> when panelId is set', () => {
    const pane = mapPluginTreeToPropertyPane(
      h(
        Pane,
        { id: 'ext.panel', title: 'Ext' },
        h(Number, { key: 'title', label: 'Title' })
      ),
      { panelId: 'ext.panel' }
    );
    const row = pane.nodes[0];
    expect(row).toBeTruthy();
    if (!row || !('path' in row)) {
      throw new Error('expected row');
    }
    expect(row.path).toBe('plugin.ext.panel.title');
  });
});
