import type {
  ArtboardPhysical,
  ArtboardSpace,
  Document,
  DocumentAsset,
  DocumentNode,
  Frame,
} from '@openenvx/studio/schema';

/** Neutral render tree node (no React / Konva). */
export interface RenderNode {
  id: string;
  frame: Frame;
  kind: string;
  paint: Record<string, unknown>;
  children?: RenderNode[];
}

export interface RenderArtboard {
  id: string;
  space: ArtboardSpace;
  physical?: ArtboardPhysical;
  background?: string;
  nodes: RenderNode[];
}

export interface RenderDocument {
  artboard: RenderArtboard;
  assets?: Record<string, DocumentAsset>;
}

export interface CompileDiagnostic {
  nodeId: string;
  code: string;
  message: string;
}

export interface CompileContext {
  document: Document;
  artboardId: string;
  selectedNodeIds?: ReadonlySet<string>;
}

export interface NodeCompiler {
  readonly type: string;
  compile(node: DocumentNode, ctx: CompileContext): RenderNode;
}

export type NodeCompilerLookup = (type: string) => NodeCompiler | undefined;
