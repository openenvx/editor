import {
  migrateLegacyDocumentInput,
  migrateLegacyLayerInput,
  type LegacyLayerInput,
  type LegacyPageInput,
} from '../schema/legacy-document-migration';
import {
  normalizeDocument,
  normalizeEditorSession,
  normalizeProjectSnapshot,
} from '../schema/normalize';
import type {
  Artboard,
  Document,
  DocumentNode,
  EditorSession,
  ProjectSnapshot,
} from '../schema/types';

export function flowArtboard(
  id: string,
  name: string,
  nodes: DocumentNode[] = []
): Artboard {
  return {
    extensions: { layout: 'flow' },
    id,
    name,
    nodes,
    physical: { dpi: 96, unit: 'px' },
    space: {},
  };
}

export function absoluteArtboard(
  id: string,
  name: string,
  width: number,
  height: number,
  nodes: DocumentNode[] = [],
  extra?: Partial<Artboard>
): Artboard {
  return {
    extensions: { layout: 'absolute' },
    id,
    name,
    nodes,
    physical: { dpi: 96, unit: 'px', ...extra?.physical },
    space: { height, width, ...extra?.space },
    ...extra,
  };
}

export function documentWith(artboards: Artboard[]): Document {
  return { artboards };
}

export function asDocumentNode(layer: LegacyLayerInput): DocumentNode {
  return migrateLegacyLayerInput(layer);
}

/** Test helper: build a document from pre-migration `pages` / `layers` / `data` shapes. */
export function documentFromLegacyPages(
  pages: LegacyPageInput[],
  extras?: Omit<Document, 'artboards'>
): Document {
  return normalizeDocument(migrateLegacyDocumentInput({ ...extras, pages }));
}

export function projectSnapshotFromLegacy(input: {
  pages?: LegacyPageInput[];
  artboards?: Artboard[];
  activeArtboardId?: string;
  selection?: EditorSession;
  editorState?: EditorSession;
  session?: EditorSession;
  templatePolicy?: Document['templatePolicy'];
  assets?: Document['assets'];
  variables?: Document['variables'];
}): ProjectSnapshot {
  const document =
    input.artboards !== undefined
      ? normalizeDocument({
          artboards: input.artboards,
          ...pickDocumentExtras(input),
        })
      : documentFromLegacyPages(input.pages ?? [], pickDocumentExtras(input));
  const fallbackId = input.activeArtboardId ?? document.artboards[0]!.id;
  const session = normalizeEditorSession(
    input.selection ??
      input.session ??
      input.editorState ?? {
        activeArtboardId: fallbackId,
        primaryNodeId: null,
        selectedNodeIds: [],
      },
    fallbackId,
    document
  );
  return { document, session };
}

function pickDocumentExtras(
  input: Pick<
    {
      templatePolicy?: Document['templatePolicy'];
      assets?: Document['assets'];
      variables?: Document['variables'];
    },
    'templatePolicy' | 'assets' | 'variables'
  >
): Omit<Document, 'artboards'> {
  return {
    ...(input.assets ? { assets: input.assets } : {}),
    ...(input.templatePolicy ? { templatePolicy: input.templatePolicy } : {}),
    ...(input.variables ? { variables: input.variables } : {}),
  };
}

export function normalizeSceneForTest(input: unknown): Document {
  if (input && typeof input === 'object' && 'pages' in input) {
    const record = input as { pages: LegacyPageInput[] } & Omit<
      Document,
      'artboards'
    >;
    return documentFromLegacyPages(record.pages, pickDocumentExtras(record));
  }
  return normalizeDocument(input);
}

export function normalizeProjectSnapshotForTest(
  input: unknown
): ProjectSnapshot {
  if (input && typeof input === 'object' && 'pages' in input) {
    return projectSnapshotFromLegacy(
      input as Parameters<typeof projectSnapshotFromLegacy>[0]
    );
  }
  return normalizeProjectSnapshot(input);
}
