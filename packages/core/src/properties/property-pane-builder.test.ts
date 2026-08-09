import { describe, expect, it } from 'vitest';

import { PropertyPath } from '../properties/property-path';
import { createPropertyPane } from './property-pane-builder';
import { PropertyBlockNode } from './property-block-node';
import { PropertyInputGroupNode } from './property-input-group-node';
import { PropertyRowNode } from './property-row-node';

describe('PropertyPaneBuilder layout when', () => {
  it('stores when on row, block, and inputGroup', () => {
    const field = { key: 'blur', kind: 'number' as const, label: 'Blur' };
    const pane = createPropertyPane('test', 'Test')
      .row('Blur', field, PropertyPath.layerData('blur'), {
        when: PropertyPath.when(PropertyPath.layerData('enabled')),
      })
      .inputGroup('Size', [], {
        when: 'page.layoutAbsolute',
      })
      .block('Group', () => {}, { when: 'scene.layerSelected' })
      .build();

    const row = pane.nodes[0];
    const group = pane.nodes[1];
    const block = pane.nodes[2];
    expect(row).toBeInstanceOf(PropertyRowNode);
    expect((row as PropertyRowNode).when).toBe(
      '$selection.layer.data.enabled'
    );
    expect(group).toBeInstanceOf(PropertyInputGroupNode);
    expect((group as PropertyInputGroupNode).when).toBe('page.layoutAbsolute');
    expect(block).toBeInstanceOf(PropertyBlockNode);
    expect((block as PropertyBlockNode).when).toBe('scene.layerSelected');
  });

  it('stores when from inline field descriptor when row options omit when', () => {
    const field = {
      key: 'columns',
      kind: 'number' as const,
      label: 'Columns',
      when: '$selection.layer.data.enabled',
    };
    const pane = createPropertyPane('test', 'Test')
      .row('Columns', field, PropertyPath.layerData('columns'))
      .build();
    const row = pane.nodes[0] as PropertyRowNode;
    expect(row.when).toBe('$selection.layer.data.enabled');
  });
});
