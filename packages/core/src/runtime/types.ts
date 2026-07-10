import type { SceneStore } from '../scene/scene-store';
import type { Selection } from '../scene/types';
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
