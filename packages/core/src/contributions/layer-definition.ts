import type { LayerPreviewDescriptor } from '@xmazu/openenvxee-preview';

import type { PropertySectionDescriptor } from '../builders/property-builder';
import { Contribution } from '../core/contribution';
import { ContributionPoint } from '../core/contribution-point';
import type { CommandContext } from '../runtime/types';
import type { Layer, Page } from '../scene/types';
import type { LayerPreviewContext } from './layer-preview-context';

export abstract class LayerDefinition<TModel = unknown> extends Contribution {
  readonly contributionPoint = ContributionPoint.Layer;

  abstract readonly type: string;

  abstract readonly treeIcon: string;

  abstract readonly treeDisplayName: string;

  treeLabel(layer: Layer): string {
    return layer.name?.trim() || this.treeDisplayName;
  }

  abstract createDefault(id: string, page: Page): Layer;

  abstract serialize(layer: Layer): TModel;

  abstract deserialize(data: unknown): TModel;

  abstract properties(
    ctx: CommandContext,
    layer: Layer
  ): PropertySectionDescriptor[];

  abstract renderPreview(
    ctx: LayerPreviewContext<TModel>
  ): LayerPreviewDescriptor;

  validate?(data: unknown): data is TModel;

  getModel(layer: Layer): TModel {
    return layer.data as TModel;
  }
}
