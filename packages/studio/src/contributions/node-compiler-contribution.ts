import type { DocumentNode } from '#studio/schema';

import type { CompileContext, RenderNode } from '../preview/render-document';
import { Contribution } from '../runtime/contribution';
import { ContributionPoint } from '../runtime/contribution-point';

export abstract class NodeCompilerContribution extends Contribution {
  readonly contributionPoint = ContributionPoint.NodeCompiler;

  abstract readonly type: string;

  abstract compile(node: DocumentNode, ctx: CompileContext): RenderNode;
}
