import { Emitter } from '../runtime/emitter';
import type { Event } from '../runtime/emitter';
import { cloneDocument, cloneEditorSession } from '../scene/types';
import type { EditorSession, Document } from '../scene/types';

export interface EditorInput {
  uri: string;
  title: string;
  scene: Document;
  isDirty: boolean;
}

export class EditorService {
  private activeEditor: EditorInput | null = null;
  private savedScene: Document | null = null;
  private savedEditorState: EditorSession | null = null;
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

  open(
    input: EditorInput,
    contentRevision = 0,
    editorState?: EditorSession
  ): void {
    this.activeEditor = input;
    this.savedScene = cloneDocument(input.scene);
    this.savedEditorState = editorState
      ? cloneEditorSession(editorState)
      : null;
    this.savedContentRevision = contentRevision;
    this.onDidChangeActiveEditorEmitter.fire(this.activeEditor);
    this.emitDirty(false);
  }

  markDirty(scene: Document): void {
    if (!this.activeEditor) {
      return;
    }
    this.activeEditor = { ...this.activeEditor, isDirty: true, scene };
    this.emitDirty(true);
  }

  updateScene(scene: Document, contentRevision: number): void {
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
    contentRevision?: number,
    editorState?: EditorSession
  ): Promise<void> {
    if (!this.activeEditor) {
      return;
    }
    if (saveFn) {
      await saveFn(this.activeEditor);
    }
    this.savedScene = cloneDocument(this.activeEditor.scene);
    if (editorState !== undefined) {
      this.savedEditorState = cloneEditorSession(editorState);
    }
    if (contentRevision !== undefined) {
      this.savedContentRevision = contentRevision;
    }
    this.activeEditor = { ...this.activeEditor, isDirty: false };
    this.emitDirty(false);
  }

  revert(): { scene: Document; editorState: EditorSession | null } | null {
    if (!this.activeEditor || this.savedScene === null) {
      return null;
    }
    const scene = cloneDocument(this.savedScene);
    const editorState = this.savedEditorState
      ? cloneEditorSession(this.savedEditorState)
      : null;
    this.activeEditor = { ...this.activeEditor, isDirty: false, scene };
    this.emitDirty(false);
    return { editorState, scene };
  }

  getSavedContentRevision(): number | null {
    return this.savedContentRevision;
  }

  private emitDirty(isDirty: boolean): void {
    this.onDidChangeDirtyEmitter.fire(isDirty);
  }
}
