import type { DocumentNode } from '@openenvx/studio/schema';

import { Contribution } from '../core/contribution';
import { ContributionPoint } from '../core/contribution-point';

export abstract class NodeTreeContribution extends Contribution {
  readonly contributionPoint = ContributionPoint.NodeTree;

  abstract readonly type: string;

  abstract readonly icon: string;

  abstract readonly displayName: string;

  label(node: DocumentNode): string {
    return node.name?.trim() || this.displayName;
  }
}
