import type { PropertySectionDescriptor } from '@openenvx/core';

import { InspectorPaneDescriptor } from '../inspector/inspector-pane-descriptor';
import { InspectorRowNode } from '../inspector/inspector-row-node';
import { InspectorPath } from './inspector-path';

const LAYER_PROPERTIES_PRIORITY = 30;

export class LayerPropertiesPaneFactory {
  build(sections: PropertySectionDescriptor[]): InspectorPaneDescriptor[] {
    return sections.map((section, index) => {
      const nodes = section.fields.map(
        (field) =>
          new InspectorRowNode(
            field.label,
            field,
            InspectorPath.layerData(field.key)
          )
      );

      return new InspectorPaneDescriptor(
        `core.properties.${section.id}`,
        section.label ?? section.id,
        nodes,
        undefined,
        LAYER_PROPERTIES_PRIORITY + index * 0.01
      );
    });
  }
}
