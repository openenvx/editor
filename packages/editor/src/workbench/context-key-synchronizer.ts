import type { ContextKeyService } from '@openenvx/studio';

import type { DocumentStore } from '../scene/document-store';
import { findNodeById } from '../scene/layer-tree';
import type { EditorService } from './editor-service';

export class ContextKeySynchronizer {
  constructor(
    private readonly scene: DocumentStore,
    private readonly editor: EditorService,
    private readonly contextKeys: ContextKeyService
  ) {}

  syncSceneDerivedKeys(
    customKeys: Record<string, boolean | string | number>
  ): boolean {
    const scene = this.scene.getDocument();
    const selection = this.scene.getSession();
    const page =
      scene.artboards.find(
        (entry) => entry.id === selection.activeArtboardId
      ) ?? scene.artboards[0]!;
    const { selectedNodeIds } = selection;

    let changed = false;
    const set = (key: string, value: boolean | string | number) => {
      if (this.contextKeys.setContext(key, value)) {
        changed = true;
      }
    };

    const primaryNodeId = selection.primaryNodeId ?? selectedNodeIds[0] ?? null;
    const primaryLayer = primaryNodeId
      ? findNodeById(scene, primaryNodeId)
      : null;

    set('scene.layerSelected', selectedNodeIds.length > 0);
    set('scene.multiSelect', selectedNodeIds.length > 1);
    set('scene.multiPage', scene.artboards.length > 1);
    set('scene.primaryLayerType', primaryLayer?.type ?? '');
    const layout =
      typeof page.extensions?.layout === 'string'
        ? page.extensions.layout
        : 'flow';
    set('page.layout', layout);
    set('page.layoutAbsolute', layout === 'absolute');
    set('page.layoutFlow', layout === 'flow');
    set('editor.dirty', this.editor.getActiveEditor()?.isDirty ?? false);
    set('editor.hasActiveEditor', this.editor.getActiveEditor() !== null);

    for (const [key, value] of Object.entries(customKeys)) {
      set(key, value);
    }

    return changed;
  }
}
