import type { LayerRegistry } from '../registries/registries';
import type { SceneStore } from '../scene/scene-store';
import type { Layer, Scene, Selection } from '../scene/types';
import type { EditorService } from '../workbench/editor-service';
import type { ServiceContainer } from './instantiation-service';
import type { EventBus } from './workbench-events';

export interface CommandContext {
  scene: SceneStore;
  selection: Selection;
  services: ServiceContainer;
  events: EventBus;
  editor: EditorService;
}

export type { Layer, Scene, Selection, LayerRegistry };
