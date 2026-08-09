import type { PropertyValuePath } from './property-value-path';

export const PropertyPath = {
  layerData(key: string): PropertyValuePath {
    return `selection.layer.data.${key}`;
  },

  /**
   * Read/write `data[key]` on a specific layer by id (not the selection).
   * Useful for product design panels that edit a locked template tree.
   */
  layerById(layerId: string, key: string): PropertyValuePath {
    return `scene.layer.${layerId}.data.${key}`;
  },

  layerTransform(key: string): PropertyValuePath {
    return `selection.layer.transform.${key}`;
  },

  layerProp(key: string): PropertyValuePath {
    return `selection.layer.${key}`;
  },

  activePage(key: string): PropertyValuePath {
    return `scene.activePage.${key}`;
  },

  templatePolicy(key: string): PropertyValuePath {
    return `scene.templatePolicy.${key}`;
  },

  command(commandId: string): PropertyValuePath {
    return `command.${commandId}`;
  },

  /** External plugin panel value path — read/write via plugin-backed host context. */
  plugin(panelId: string, key: string): PropertyValuePath {
    return `plugin.${panelId}.${key}`;
  },
};
