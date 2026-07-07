import type { LayerRegistry } from '../registries/registries';

export interface LayerPreviewContext<TModel> {
  model: TModel;
  isSelected: boolean;
  layerId: string;
  registry?: LayerRegistry;
}
