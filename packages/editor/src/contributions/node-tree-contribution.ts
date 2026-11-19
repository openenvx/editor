import type { DocumentNode } from '@openenvx/editor/schema';
import { Contribution, ContributionPoint } from '@openenvx/studio';

export abstract class NodeTreeContribution extends Contribution {
  readonly contributionPoint = ContributionPoint.NodeTree;

  abstract readonly type: string;

  abstract readonly icon: string;

  abstract readonly displayName: string;

  label(node: DocumentNode): string {
    return node.name?.trim() || this.displayName;
  }
}
