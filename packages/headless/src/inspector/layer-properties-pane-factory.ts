import type { PropertySectionDescriptor } from '@openenvx/core';

import { InspectorRowNode } from '../inspector/inspector-row-node';
import { PropertyPaneDescriptor } from '../inspector/property-pane-descriptor';
import { InspectorPath } from './inspector-path';

const LAYER_PROPERTIES_PRIORITY = 30;

export class LayerPropertiesPaneFactory {
  build(sections: PropertySectionDescriptor[]): PropertyPaneDescriptor[] {
    return sections.map((section, index) => {
      const nodes = section.fields.map(
        (field) =>
          new InspectorRowNode(
            field.label,
            field,
            InspectorPath.layerData(field.key)
          )
      );

      return new PropertyPaneDescriptor(
        `core.properties.${section.id}`,
        section.label ?? section.id,
        nodes,
        undefined,
        LAYER_PROPERTIES_PRIORITY + index * 0.01
      );
    });
  }
}
