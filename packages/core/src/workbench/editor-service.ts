import { Emitter } from '../runtime/emitter';
import type { Event } from '../runtime/emitter';
import { cloneScene } from '../scene/types';
import type { Scene } from '../scene/types';

export interface EditorInput {
  uri: string;
  title: string;
  scene: Scene;
  isDirty: boolean;
}

export class EditorService {
  private activeEditor: EditorInput | null = null;
  private savedScene: Scene | null = null;
  private savedContentRevision: number | null = null;
  private readonly onDidChangeDirtyEmitter = new Emitter<boolean>();
  private readonly onDidChangeActiveEditorEmitter =
    new Emitter<EditorInput | null>();

  readonly onDidChangeDirty: Event<boolean> =
    this.onDidChangeDirtyEmitter.event;
  readonly onDidChangeActiveEditor: Event<EditorInput | null> =
    this.onDidChangeActiveEditorEmitter.event;

  getActiveEditor(): EditorInput | null {
    return this.activeEditor;
  }

  open(input: EditorInput, contentRevision = 0): void {
    this.activeEditor = input;
    this.savedScene = cloneScene(input.scene);
    this.savedContentRevision = contentRevision;
    this.onDidChangeActiveEditorEmitter.fire(this.activeEditor);
    this.emitDirty(false);
  }

  markDirty(scene: Scene): void {
    if (!this.activeEditor) {
      return;
    }
    this.activeEditor = { ...this.activeEditor, isDirty: true, scene };
    this.emitDirty(true);
  }

  updateScene(scene: Scene, contentRevision: number): void {
    if (!this.activeEditor) {
      return;
    }
    const isDirty =
      this.savedContentRevision !== null &&
      contentRevision !== this.savedContentRevision;
    this.activeEditor = { ...this.activeEditor, isDirty, scene };
    this.emitDirty(isDirty);
  }

  async save(
    saveFn?: (input: EditorInput) => Promise<void>,
    contentRevision?: number
  ): Promise<void> {
    if (!this.activeEditor) {
      return;
    }
    if (saveFn) {
      await saveFn(this.activeEditor);
    }
    this.savedScene = cloneScene(this.activeEditor.scene);
    if (contentRevision !== undefined) {
      this.savedContentRevision = contentRevision;
    }
    this.activeEditor = { ...this.activeEditor, isDirty: false };
    this.emitDirty(false);
  }

  revert(): Scene | null {
    if (!this.activeEditor || this.savedScene === null) {
      return null;
    }
    const scene = cloneScene(this.savedScene);
    this.activeEditor = { ...this.activeEditor, isDirty: false, scene };
    this.emitDirty(false);
    return scene;
  }

  getSavedContentRevision(): number | null {
    return this.savedContentRevision;
  }

  private emitDirty(isDirty: boolean): void {
    this.onDidChangeDirtyEmitter.fire(isDirty);
  }
}
