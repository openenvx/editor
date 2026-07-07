import { describe, expect, it } from 'vitest';

import { PluginManager } from '../core/plugin-manager';
import { WorkbenchEvents } from '../runtime/workbench-events';
import { SceneStore } from '../scene/scene-store';
import { EditorService } from '../workbench/editor-service';

describe('PluginManager events', () => {
  it('bridges scene, editor dirty, and active editor changes to the event bus', () => {
    const scene = new SceneStore();
    const editor = new EditorService();
    const manager = new PluginManager(scene, editor);
    const events = manager.getEvents();

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
});
