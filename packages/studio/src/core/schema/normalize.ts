import { cloneDropNulls } from './clone-drop-nulls';
import { documentSchemaLenient } from './document-schema';
import { pruneEditorSession } from './editor-state';
import { migrateLegacyDocumentInput } from './legacy-document-migration';
import { defaultFrame } from './node-helpers';
import type {
  Artboard,
  Document,
  DocumentNode,
  EditorSession,
  LengthUnit,
  ProjectSnapshot,
} from './types';
import { defaultDpiForUnit } from './units';
import { parseValidEditorSession } from './validate';

function formatNormalizeError(
  issues: { path: PropertyKey[]; message: string }[]
): string {
  return issues
    .slice(0, 10)
    .map((issue) => {
      const path = issue.path.map(String).join('.');
      return path ? `${path}: ${issue.message}` : issue.message;
    })
    .join('\n');
}

export function createDefaultFrame(): NonNullable<DocumentNode['frame']> {
  return defaultFrame();
}

/** @deprecated use createDefaultFrame */
export const createDefaultTransform = createDefaultFrame;

export function createDefaultArtboard(id: string): Artboard {
  return {
    extensions: { layout: 'flow' },
    id,
    name: 'Artboard 1',
    nodes: [],
    physical: { dpi: 96, unit: 'px' },
    space: {},
  };
}

/** @deprecated use createDefaultArtboard */
export const createDefaultPage = createDefaultArtboard;

export function createDefaultEditorSession(
  activeArtboardId: string
): EditorSession {
  return {
    activeArtboardId,
    primaryNodeId: null,
    selectedNodeIds: [],
  };
}

/** @deprecated use createDefaultEditorSession */
export const createDefaultEditorState = createDefaultEditorSession;

export function createEmptyDocument(): Document {
  const artboard = createDefaultArtboard('artboard-1');
  return {
    artboards: [artboard],
  };
}

/** @deprecated use createEmptyDocument */
export const createEmptyScene = createEmptyDocument;

export function createEmptyProjectSnapshot(): ProjectSnapshot {
  const document = createEmptyDocument();
  return {
    document,
    session: createDefaultEditorSession(document.artboards[0]!.id),
  };
}

/** @deprecated use createEmptyProjectSnapshot */
export const createEmptySceneSnapshot = createEmptyProjectSnapshot;

function ensureArtboards(document: Document): Document {
  if (document.artboards.length > 0) {
    return document;
  }
  return {
    ...document,
    artboards: [createDefaultArtboard('artboard-1')],
  };
}

function applyStructuralArtboardDefaults(document: Document): Document {
  return {
    ...document,
    artboards: document.artboards.map((artboard) => {
      const unit = (artboard.physical?.unit ?? 'px') as LengthUnit;
      return {
        ...artboard,
        physical: {
          ...artboard.physical,
          dpi: artboard.physical?.dpi ?? defaultDpiForUnit(unit),
          unit,
        },
      };
    }),
  };
}

export function normalizeDocument(input: unknown = {}): Document {
  const migrated = migrateLegacyDocumentInput(cloneDropNulls(input ?? {}));
  const parsed = documentSchemaLenient.safeParse(migrated);
  if (!parsed.success) {
    throw new Error(
      `Failed to normalize OpenEnvx document:\n${formatNormalizeError(parsed.error.issues)}`
    );
  }
  return applyStructuralArtboardDefaults(
    ensureArtboards(parsed.data as unknown as Document)
  );
}

/** @deprecated use normalizeDocument */
export const normalizeScene = normalizeDocument;

export function normalizeEditorSession(
  input: unknown,
  fallbackActiveArtboardId: string,
  document?: Document
): EditorSession {
  if (input && typeof input === 'object') {
    const record = input as Record<string, unknown>;
    const activeArtboardId =
      typeof record.activeArtboardId === 'string'
        ? record.activeArtboardId
        : typeof record.activePageId === 'string'
          ? record.activePageId
          : fallbackActiveArtboardId;
    const selectedNodeIds = Array.isArray(record.selectedNodeIds)
      ? record.selectedNodeIds
      : Array.isArray(record.selectedLayerIds)
        ? record.selectedLayerIds
        : undefined;
    const primaryNodeId =
      typeof record.primaryNodeId === 'string' || record.primaryNodeId === null
        ? record.primaryNodeId
        : typeof record.primaryLayerId === 'string' ||
            record.primaryLayerId === null
          ? record.primaryLayerId
          : undefined;
    try {
      const session = parseValidEditorSession({
        ...record,
        activeArtboardId,
        ...(selectedNodeIds ? { selectedNodeIds } : {}),
        ...(primaryNodeId !== undefined ? { primaryNodeId } : {}),
      });
      return document ? pruneEditorSession(document, session) : session;
    } catch {
      const fallback = createDefaultEditorSession(fallbackActiveArtboardId);
      return document ? pruneEditorSession(document, fallback) : fallback;
    }
  }
  const fallback = createDefaultEditorSession(fallbackActiveArtboardId);
  return document ? pruneEditorSession(document, fallback) : fallback;
}

/** @deprecated use normalizeEditorSession */
export const normalizeEditorState = normalizeEditorSession;

export function normalizeProjectSnapshot(input: unknown = {}): ProjectSnapshot {
  if (input && typeof input === 'object') {
    const record = input as Record<string, unknown>;
    if ('document' in record) {
      const document = normalizeDocument(record.document);
      const fallbackId = document.artboards[0]!.id;
      const session = normalizeEditorSession(
        record.session ?? record.editorState,
        fallbackId,
        document
      );
      return { document, session };
    }
    if ('scene' in record) {
      const document = normalizeDocument(record.scene);
      const fallbackId = document.artboards[0]!.id;
      const session = normalizeEditorSession(
        record.editorState ?? record.session,
        fallbackId,
        document
      );
      return { document, session };
    }
  }

  return createEmptyProjectSnapshot();
}

/** @deprecated use normalizeProjectSnapshot */
export const normalizeSceneSnapshot = normalizeProjectSnapshot;
