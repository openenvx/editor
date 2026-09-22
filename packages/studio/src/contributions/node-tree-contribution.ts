import type { DocumentNode } from '#studio/schema';

import { Contribution } from '../runtime/contribution';
import { ContributionPoint } from '../runtime/contribution-point';

export abstract class NodeTreeContribution extends Contribution {
  readonly contributionPoint = ContributionPoint.NodeTree;

  abstract readonly type: string;

  abstract readonly icon: string;

  abstract readonly displayName: string;

  label(node: DocumentNode): string {
    return node.name?.trim() || this.displayName;
  }
}
