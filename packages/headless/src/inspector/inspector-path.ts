import type { InspectorValuePath } from './inspector-value-path';

export const InspectorPath = {
  layerData(key: string): InspectorValuePath {
    return `selection.layer.data.${key}`;
  },

  layerTransform(key: string): InspectorValuePath {
    return `selection.layer.transform.${key}`;
  },

  activePage(key: string): InspectorValuePath {
    return `scene.activePage.${key}`;
  },

  command(commandId: string): InspectorValuePath {
    return `command.${commandId}`;
  },
};
