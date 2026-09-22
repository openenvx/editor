import type { Artboard, Document, DocumentNode } from '@openenvx/studio/schema';

import { getChildNodes } from '../schema/node-helpers';
import type {
  CompileContext,
  CompileDiagnostic,
  NodeCompilerLookup,
  RenderArtboard,
  RenderDocument,
  RenderNode,
} from './render-document';

function compileNodeTree(
  node: DocumentNode,
  ctx: CompileContext,
  lookup: NodeCompilerLookup,
  diagnostics: CompileDiagnostic[]
): RenderNode {
  const compiler = lookup(node.type);
  if (!compiler) {
    diagnostics.push({
      code: 'unknown_node_type',
      message: `No compiler registered for type "${node.type}"`,
      nodeId: node.id,
    });
    return {
      frame: node.frame ?? { height: 100, rotation: 0, width: 100, x: 0, y: 0 },
      id: node.id,
      kind: 'placeholder',
      paint: { text: `Unknown: ${node.type}` },
    };
  }
  const rendered = compiler.compile(node, ctx);
  const childNodes = getChildNodes(node);
  if (childNodes.length === 0) {
    return rendered;
  }
  const children = childNodes.map((child) =>
    compileNodeTree(child, ctx, lookup, diagnostics)
  );
  return { ...rendered, children };
}

export interface CompileArtboardResult {
  document: RenderDocument;
  diagnostics: CompileDiagnostic[];
}

export function compileArtboard(
  document: Document,
  artboard: Artboard,
  lookup: NodeCompilerLookup,
  options?: { selectedNodeIds?: ReadonlySet<string> }
): CompileArtboardResult {
  const ctx: CompileContext = {
    artboardId: artboard.id,
    document,
    selectedNodeIds: options?.selectedNodeIds,
  };
  const diagnostics: CompileDiagnostic[] = [];
  const nodes = artboard.nodes.map((node) =>
    compileNodeTree(node, ctx, lookup, diagnostics)
  );
  const renderArtboard: RenderArtboard = {
    background: artboard.background,
    id: artboard.id,
    nodes,
    physical: artboard.physical,
    space: artboard.space,
  };
  return {
    diagnostics,
    document: {
      artboard: renderArtboard,
      assets: document.assets,
    },
  };
}
