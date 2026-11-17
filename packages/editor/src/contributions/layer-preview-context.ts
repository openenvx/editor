import type { LayerRegistry } from '@openenvx/studio';

export interface LayerPreviewContext<TModel> {
  model: TModel;
  isSelected: boolean;
  layerId: string;
  registry?: LayerRegistry;
}
