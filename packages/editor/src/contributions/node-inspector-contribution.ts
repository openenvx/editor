import type { DocumentNode } from '@openenvx/editor/schema';
import type {
  PropertySectionDescriptor,
  CommandContext,
} from '@openenvx/studio';
import { Contribution, ContributionPoint } from '@openenvx/studio';

export abstract class NodeInspectorContribution extends Contribution {
  readonly contributionPoint = ContributionPoint.NodeInspector;

  abstract readonly type: string;

  abstract properties(
    ctx: CommandContext,
    node: DocumentNode
  ): PropertySectionDescriptor[];
}
