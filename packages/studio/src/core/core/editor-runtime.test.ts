import { describe, expect, it } from 'vitest';

import { EditorRuntime } from '../core/editor-runtime';
import { WorkbenchEvents } from '../runtime/workbench-events';
import { SceneStore } from '../scene/scene-store';
import { EditorService } from '../workbench/editor-service';

describe('EditorRuntime events', () => {
  it('bridges scene, editor dirty, and active editor changes to the event bus', () => {
    const scene = new SceneStore();
    const editor = new EditorService();
    const runtime = new EditorRuntime(scene, editor);
    const events = runtime.getEvents();

    const sceneChanges: number[] = [];
    const dirtyChanges: boolean[] = [];
    const editorChanges: number[] = [];

    events.on(WorkbenchEvents.DidChangeScene, (snapshot) => {
      sceneChanges.push(snapshot.contentRevision);
    });
    events.on(WorkbenchEvents.DidChangeDirty, (isDirty) => {
      dirtyChanges.push(isDirty);
    });
    events.on(WorkbenchEvents.DidChangeActiveEditor, (activeEditor) => {
      editorChanges.push(activeEditor ? 1 : 0);
    });

    editor.open(
      {
        isDirty: false,
        scene: scene.getScene(),
        title: 'Untitled',
        uri: 'untitled://scene',
      },
      scene.getContentRevision()
    );

    scene.selectLayers([], null);

    expect(sceneChanges.length).toBeGreaterThan(0);
    expect(dirtyChanges).toContain(false);
    expect(editorChanges).toContain(1);
  });

  it('disposes event listeners and context keys', () => {
    const scene = new SceneStore();
    const editor = new EditorService();
    const runtime = new EditorRuntime(scene, editor);
    const events = runtime.getEvents();
    let contextChangeCount = 0;

    events.on(WorkbenchEvents.DidChangeContext, () => {
      contextChangeCount += 1;
    });

    runtime.dispose();
    runtime.getContextKeys().setContext('test.afterDispose', true);

    expect(contextChangeCount).toBe(0);
  });
});
