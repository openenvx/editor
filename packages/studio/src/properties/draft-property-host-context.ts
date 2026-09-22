import type { PropertyHostContext, PropertyValuePath } from '#studio';
import {
  readLayerDataAtKey,
  SELECTION_LAYER_DATA_PATH_PREFIX,
  writeLayerDataAtKey,
} from '#studio';

export function createDraftPropertyHostContext(
  values: Record<string, unknown>,
  onValuesChange: (next: Record<string, unknown>) => void
): PropertyHostContext {
  return {
    layerData: values,
    selectedLayerId: '__draft__',
    readPath(path: PropertyValuePath): unknown {
      if (!path.startsWith(SELECTION_LAYER_DATA_PATH_PREFIX)) {
        return undefined;
      }
      const key = path.slice(SELECTION_LAYER_DATA_PATH_PREFIX.length);
      return readLayerDataAtKey(values, key);
    },
    writePath(path: PropertyValuePath, value: unknown): void {
      if (!path.startsWith(SELECTION_LAYER_DATA_PATH_PREFIX)) {
        return;
      }
      const key = path.slice(SELECTION_LAYER_DATA_PATH_PREFIX.length);
      onValuesChange(writeLayerDataAtKey(values, key, value));
    },
  };
}
