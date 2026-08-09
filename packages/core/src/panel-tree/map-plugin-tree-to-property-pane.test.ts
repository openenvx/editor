import { describe, expect, it } from 'vitest';

import { n } from './test-node';

import { PropertyPath } from '../properties/property-path';
import type { PropertyPaneDescriptor } from '../properties/property-pane-descriptor';
import { createPropertyPane } from '../properties/property-pane-builder';
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
    when?: string;
  }): unknown {
    return {
      kind: 'row',
      label: node.label,
      path: node.path,
      when: node.when,
      field: node.field,
    };
  },
  visitBlock(node: {
    label: string;
    children: { accept: (v: typeof serializeVisitor) => unknown }[];
    when?: string;
  }): unknown {
    return {
      kind: 'block',
      label: node.label,
      when: node.when,
      children: node.children.map((child) => child.accept(serializeVisitor)),
    };
  },
  visitInputGroup(node: {
    blockLabel: string;
    cells: unknown[];
    when?: string;
  }): unknown {
    return {
      kind: 'inputGroup',
      blockLabel: node.blockLabel,
      when: node.when,
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
          path: PropertyPath.layerTransform('x'),
        },
        {
          field: {
            key: 'y',
            kind: 'number',
            label: 'Y',
            numeric: { precision: 0, scrub: true },
          },
          path: PropertyPath.layerTransform('y'),
        },
      ])
      .build();

    const viaTree = mapPluginTreeToPropertyPane(
      n(
        'Pane',
        {
          id: 'canvas.layer',
          title: 'Layer',
          when: 'page.layoutAbsolute && scene.layerSelected',
          priority: 20,
        },
        n(
          'InputGroup',
          { label: 'Position' },
          n('Number', {
            key: 'x',
            label: 'X',
            bind: PropertyPath.layerTransform('x'),
            scrub: true,
            precision: 0,
          }),
          n('Number', {
            key: 'y',
            label: 'Y',
            bind: PropertyPath.layerTransform('y'),
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
        PropertyPath.layerTransform('rotation')
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
      n(
        'Pane',
        {
          id: 'canvas.transforms',
          title: 'Transforms',
          when: 'page.layoutAbsolute && scene.layerSelected',
          priority: 40,
        },
        n(
          'Row',
          { label: 'Rotate' },
          n(
            'Number',
            {
              key: 'rotation',
              label: 'Rotate',
              bind: PropertyPath.layerTransform('rotation'),
              scrub: true,
              precision: 0,
              unit: '°',
            },
            n('Action', {
              icon: 'rotateLeft',
              label: 'Rotate left',
              onClick: { type: 'command', commandId: 'canvas.rotateLeft' },
            }),
            n('Action', {
              icon: 'rotateRight',
              label: 'Rotate right',
              onClick: { type: 'command', commandId: 'canvas.rotateRight' },
            }),
            n(
              'Popup',
              { icon: 'settings', title: 'Fine tune' },
              n('Number', {
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

  it('maps legacy chrome:false on plugin fields to layout block', () => {
    const pane = mapPluginTreeToPropertyPane(
      n(
        'Pane',
        { id: 'ext.panel', title: 'Ext' },
        n(
          'Row',
          { label: 'Slot list' },
          n('SlotList', {
            key: 'items',
            label: 'Items',
            bind: PropertyPath.layerData('items'),
            chrome: false,
          })
        )
      )
    );
    const row = pane.nodes[0];
    if (!row || !('field' in row)) {
      throw new Error('expected row');
    }
    expect(row.field.layout).toBe('block');
  });

  it('encodes Action handler clicks as plugin.handler commands', () => {
    const pane = mapPluginTreeToPropertyPane(
      n(
        'Pane',
        { id: 'ext.panel', title: 'Ext' },
        n(
          'Row',
          { label: 'Name' },
          n(
            'Number',
            {
              key: 'name',
              label: 'Name',
              bind: PropertyPath.plugin('ext.panel', 'name'),
            },
            n('Action', {
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
      n(
        'Pane',
        { id: 'ext.panel', title: 'Ext' },
        n('Number', { key: 'title', label: 'Title' })
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

  it('maps layout-node when onto rows and blocks', () => {
    const pane = mapPluginTreeToPropertyPane(
      n(
        'Pane',
        { id: 'pane', title: 'Pane' },
        n(
          'Row',
          {
            label: 'Blur',
            when: '$selection.layer.data.enabled',
          },
          n('Number', {
            key: 'blur',
            label: 'Blur',
            bind: PropertyPath.layerData('blur'),
          })
        ),
        n(
          'Block',
          { label: 'Advanced', when: 'scene.layerSelected' },
          n('Text', { key: 'detail', label: 'Detail' })
        )
      )
    );

    expect(serializePane(pane)).toMatchObject({
      nodes: [
        {
          kind: 'row',
          when: '$selection.layer.data.enabled',
        },
        {
          kind: 'block',
          when: 'scene.layerSelected',
        },
      ],
    });
  });

  it('uses panelId as Pane id when props.id is omitted', () => {
    const pane = mapPluginTreeToPropertyPane(
      n('Pane', { title: 'Guests' }, n('Text', { label: 'Note', value: 'hi' })),
      { panelId: 'wm.wedding.guests' }
    );
    expect(pane.id).toBe('wm.wedding.guests');
    expect(pane.title).toBe('Guests');
  });
});
