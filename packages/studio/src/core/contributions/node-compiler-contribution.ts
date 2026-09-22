import type { DocumentNode } from '@openenvx/studio/schema';

import { Contribution } from '../core/contribution';
import { ContributionPoint } from '../core/contribution-point';
import type { CompileContext, RenderNode } from '../preview/render-document';

export abstract class NodeCompilerContribution extends Contribution {
  readonly contributionPoint = ContributionPoint.NodeCompiler;

  abstract readonly type: string;

  abstract compile(node: DocumentNode, ctx: CompileContext): RenderNode;
}
