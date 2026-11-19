import type { DocumentNode } from '@openenvx/editor/schema';
import { Contribution, ContributionPoint } from '@openenvx/studio';

import type { CompileContext, RenderNode } from '../preview/render-document';

export abstract class NodeCompilerContribution extends Contribution {
  readonly contributionPoint = ContributionPoint.NodeCompiler;

  abstract readonly type: string;

  abstract compile(node: DocumentNode, ctx: CompileContext): RenderNode;
}
