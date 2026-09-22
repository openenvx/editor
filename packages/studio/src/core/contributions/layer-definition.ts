import type { Artboard, DocumentNode } from '@openenvx/studio/schema';

import type { PropertySectionDescriptor } from '../builders/property-builder';
import { Contribution } from '../core/contribution';
import { ContributionPoint } from '../core/contribution-point';
import type { LayerPreviewDescriptor } from '../preview';
import type { CommandContext } from '../runtime/types';
import { nodeProps } from '../schema/node-helpers';
import type { LayerPreviewContext } from './layer-preview-context';

export abstract class LayerDefinition<TModel = unknown> extends Contribution {
  readonly contributionPoint = ContributionPoint.Layer;

  abstract readonly type: string;

  abstract readonly treeIcon: string;

  abstract readonly treeDisplayName: string;

  treeLabel(node: DocumentNode): string {
    return node.name?.trim() || this.treeDisplayName;
  }

  abstract createDefault(id: string, artboard: Artboard): DocumentNode;

  abstract serialize(node: DocumentNode): TModel;

  abstract deserialize(data: unknown): TModel;

  abstract properties(
    ctx: CommandContext,
    node: DocumentNode
  ): PropertySectionDescriptor[];

  abstract renderPreview(
    ctx: LayerPreviewContext<TModel>
  ): LayerPreviewDescriptor;

  validate?(data: unknown): data is TModel;

  getModel(node: DocumentNode): TModel {
    return nodeProps(node) as TModel;
  }
}
