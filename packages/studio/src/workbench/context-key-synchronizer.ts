import type { DocumentStore } from '../scene/document-store';
import type { ContextKeyService } from './context-key-service';
import type { EditorService } from './editor-service';

export class ContextKeySynchronizer {
  constructor(
    private readonly scene: DocumentStore,
    private readonly editor: EditorService,
    private readonly contextKeys: ContextKeyService
  ) {}

  syncSceneDerivedKeys(
    customKeys: Record<string, boolean | string | number>
  ): void {
    this.contextKeys.syncSceneKeys({
      customKeys,
      hasActiveEditor: this.editor.getActiveEditor() !== null,
      isDirty: this.editor.getActiveEditor()?.isDirty ?? false,
      scene: this.scene.getDocument(),
      selection: this.scene.getSession(),
    });
  }
}
