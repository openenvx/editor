import type { DocumentNode } from '#studio/schema';

import type { PropertySectionDescriptor } from '../builders/property-builder';
import { Contribution } from '../runtime/contribution';
import { ContributionPoint } from '../runtime/contribution-point';
import type { CommandContext } from '../runtime/types';

export abstract class NodeInspectorContribution extends Contribution {
  readonly contributionPoint = ContributionPoint.NodeInspector;

  abstract readonly type: string;

  abstract properties(
    ctx: CommandContext,
    node: DocumentNode
  ): PropertySectionDescriptor[];
}
