import type { Artboard, DocumentNode } from '#studio/schema';

import { Contribution } from '../runtime/contribution';
import { ContributionPoint } from '../runtime/contribution-point';
import { nodeProps } from '../schema/node-helpers';

/** Document node model: create + (de)serialize props. */
export abstract class NodeDefinition<TModel = unknown> extends Contribution {
  readonly contributionPoint = ContributionPoint.NodeDefinition;

  abstract readonly type: string;

  abstract createDefault(id: string, artboard: Artboard): DocumentNode;

  abstract serialize(node: DocumentNode): TModel;

  abstract deserialize(data: unknown): TModel;

  validate?(data: unknown): data is TModel;

  readProps(props: unknown): TModel {
    return this.deserialize(props);
  }

  getModel(node: DocumentNode): TModel {
    return nodeProps(node) as TModel;
  }
}
