import { describe, expect, it } from 'vitest';

import type { PropertySectionDescriptor } from '../builders/property-builder';
import { PropertyPath } from './property-path';
import { LayerPropertiesPaneFactory } from './layer-properties-pane-factory';
import { PropertyRowNode } from './property-row-node';

describe('LayerPropertiesPaneFactory', () => {
  it('maps field.when onto synthesized rows', () => {
    const sections: PropertySectionDescriptor[] = [
      {
        id: 'main',
        fields: [
          {
            key: 'enabled',
            kind: 'toggle',
            label: 'Enabled',
          },
          {
            key: 'blur',
            kind: 'number',
            label: 'Blur',
            when: PropertyPath.when(PropertyPath.layerData('enabled')),
          },
        ],
      },
    ];

    const [pane] = new LayerPropertiesPaneFactory().build(sections);
    const blurRow = pane.nodes[1];
    expect(blurRow).toBeInstanceOf(PropertyRowNode);
    expect((blurRow as PropertyRowNode).when).toBe(
      '$selection.layer.data.enabled'
    );
  });
});
