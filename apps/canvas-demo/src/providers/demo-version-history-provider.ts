import { createCanvasDemoScene } from '@openenvx/canvas';
import type {
  DocumentVersion,
  VersionHistoryProvider,
} from '@openenvx/headless';
import {
  createDefaultEditorState,
  createEmptySceneSnapshot,
  type SceneSnapshot,
} from '@xmazu/openenvxee-schema';

function snapshotFromScene(
  scene: ReturnType<typeof createCanvasDemoScene>
): SceneSnapshot {
  const pageId = scene.pages[0]?.id ?? 'page-1';
  return {
    editorState: createDefaultEditorState(pageId),
    scene,
  };
}

/**
 * In-memory demo provider for canvas-demo — not for production use.
 * Shows a mix of named and autosave entries so the Version History panel
 * can exercise grouping and restore.
 */
export function createDemoVersionHistoryProvider(): VersionHistoryProvider {
  const now = Date.now();
  const demoScene = createCanvasDemoScene();
  const empty = createEmptySceneSnapshot();

  const entries: (DocumentVersion & { snapshot: SceneSnapshot })[] = [
    {
      author: { name: 'Demo User' },
      createdAt: now - 5 * 60_000,
      id: 'autosave-1',
      isAutosave: true,
      snapshot: snapshotFromScene(demoScene),
    },
    {
      author: { name: 'Demo User' },
      createdAt: now - 12 * 60_000,
      id: 'autosave-2',
      isAutosave: true,
      snapshot: snapshotFromScene(demoScene),
    },
    {
      author: { name: 'Demo User' },
      createdAt: now - 18 * 60_000,
      id: 'autosave-3',
      isAutosave: true,
      snapshot: snapshotFromScene(demoScene),
    },
    {
      author: { name: 'Demo User' },
      createdAt: now - 3 * 60 * 60_000,
      id: 'named-morning',
      label: 'Morning draft',
      snapshot: empty,
    },
  ];

  const byId = new Map(entries.map((entry) => [entry.id, entry] as const));

  return {
    async listVersions(_documentUri: string): Promise<DocumentVersion[]> {
      return entries.map(({ snapshot: _snapshot, ...meta }) => meta);
    },
    async loadVersion(
      _documentUri: string,
      versionId: string
    ): Promise<SceneSnapshot> {
      const entry = byId.get(versionId);
      if (!entry) {
        throw new Error(`Unknown version: ${versionId}`);
      }
      return structuredClone(entry.snapshot);
    },
  };
}
