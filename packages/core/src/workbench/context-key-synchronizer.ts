import type { SceneStore } from '../scene/scene-store';
import type { ContextKeyService } from './context-key-service';
import type { EditorService } from './editor-service';

export class ContextKeySynchronizer {
  constructor(
    private readonly scene: SceneStore,
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
      scene: this.scene.getScene(),
    });
  }
}
