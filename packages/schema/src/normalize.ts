import { cloneDropNulls } from './clone-drop-nulls';
import { pruneEditorState } from './editor-state';
import { sceneSchemaLenient } from './scene-schema';
import { SCHEMA_VERSION } from './types';
import type {
  EditorState,
  Layer,
  Page,
  Scene,
  SceneSnapshot,
  LengthUnit,
} from './types';
import { defaultDpiForUnit } from './units';
import { parseValidEditorState } from './validate';

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

export function createDefaultTransform(): NonNullable<Layer['transform']> {
  return {
    height: 100,
    opacity: 1,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
    width: 200,
    x: 0,
    y: 0,
  };
}

export function createDefaultPage(
  id: string,
  layout: Page['layout'] = 'flow'
): Page {
  return {
    id,
    layers: [],
    layout,
    name: 'Page 1',
    unit: 'px',
    dpi: 96,
  };
}

export function createDefaultEditorState(activePageId: string): EditorState {
  return {
    activePageId,
    primaryLayerId: null,
    selectedLayerIds: [],
  };
}

export function createEmptyScene(): Scene {
  const page = createDefaultPage('page-1', 'flow');
  return {
    pages: [page],
    schemaVersion: SCHEMA_VERSION,
  };
}

export function createEmptySceneSnapshot(): SceneSnapshot {
  const scene = createEmptyScene();
  return {
    editorState: createDefaultEditorState(scene.pages[0]!.id),
    scene,
  };
}

function ensurePages(scene: Scene): Scene {
  if (scene.pages.length > 0) {
    return scene;
  }
  return {
    ...scene,
    pages: [createDefaultPage('page-1', 'flow')],
  };
}

/** Structural page defaults only — no layout-specific rules. */
function applyStructuralPageDefaults(scene: Scene): Scene {
  return {
    ...scene,
    pages: scene.pages.map((page) => {
      const unit = (page.unit ?? 'px') as LengthUnit;
      return {
        ...page,
        dpi: page.dpi ?? defaultDpiForUnit(unit),
        unit,
      };
    }),
  };
}

/**
 * Validate and fill structural defaults via the lenient Zod schema.
 * Layout-specific rules (e.g. absolute dims/presets) live on providers.
 * Idempotent for current-format input. Does not migrate old schemaVersion docs.
 */
export function normalizeScene(input: unknown = {}): Scene {
  const parsed = sceneSchemaLenient.safeParse(cloneDropNulls(input ?? {}));
  if (!parsed.success) {
    throw new Error(
      `Failed to normalize OpenEnvx scene:\n${formatNormalizeError(parsed.error.issues)}`
    );
  }
  return applyStructuralPageDefaults(
    ensurePages(parsed.data as unknown as Scene)
  );
}

export function normalizeEditorState(
  input: unknown,
  fallbackActivePageId: string,
  scene?: Scene
): EditorState {
  if (input && typeof input === 'object') {
    const record = input as Record<string, unknown>;
    const activePageId =
      typeof record.activePageId === 'string'
        ? record.activePageId
        : fallbackActivePageId;
    try {
      const state = parseValidEditorState({
        ...record,
        activePageId,
      });
      return scene ? pruneEditorState(scene, state) : state;
    } catch {
      const fallback = createDefaultEditorState(fallbackActivePageId);
      return scene ? pruneEditorState(scene, fallback) : fallback;
    }
  }
  const fallback = createDefaultEditorState(fallbackActivePageId);
  return scene ? pruneEditorState(scene, fallback) : fallback;
}

export function normalizeSceneSnapshot(input: unknown = {}): SceneSnapshot {
  if (input && typeof input === 'object') {
    const record = input as Record<string, unknown>;
    // Legacy: Scene used to embed activePageId + selection.
    if ('pages' in record && !('scene' in record)) {
      const legacy = record as Record<string, unknown> & {
        activePageId?: string;
        editorState?: unknown;
        selection?: unknown;
      };
      const { activePageId, editorState, selection, ...sceneFields } = legacy;
      const scene = normalizeScene(sceneFields);
      const pageId =
        (typeof activePageId === 'string' &&
        scene.pages.some((p) => p.id === activePageId)
          ? activePageId
          : undefined) ?? scene.pages[0]!.id;
      const editorInput =
        editorState ??
        (selection && typeof selection === 'object'
          ? { ...(selection as object), activePageId: pageId }
          : { activePageId: pageId });
      const normalizedEditorState = normalizeEditorState(
        editorInput,
        pageId,
        scene
      );
      return { editorState: normalizedEditorState, scene };
    }

    if ('scene' in record) {
      const scene = normalizeScene(record.scene);
      const fallbackId = scene.pages[0]!.id;
      const editorState = normalizeEditorState(
        record.editorState,
        fallbackId,
        scene
      );
      return { editorState, scene };
    }
  }

  return createEmptySceneSnapshot();
}
