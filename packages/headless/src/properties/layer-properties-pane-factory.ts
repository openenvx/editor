import type { PropertySectionDescriptor } from '@openenvx/core';

import { PropertyPaneDescriptor } from '../properties/property-pane-descriptor';
import { PropertyRowNode } from '../properties/property-row-node';
import { PropertyPath } from './property-path';

const LAYER_PROPERTIES_PRIORITY = 30;

export class LayerPropertiesPaneFactory {
  build(sections: PropertySectionDescriptor[]): PropertyPaneDescriptor[] {
    return sections.map((section, index) => {
      const nodes = section.fields.map(
        (field) =>
          new PropertyRowNode(
            field.label,
            field,
            PropertyPath.layerData(field.key)
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
