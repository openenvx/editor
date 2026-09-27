import type { DocumentStore } from '../scene/document-store';
import type { EditorSession } from '../scene/types';
import type { EditorService } from '../workbench/editor-service';
import type { ServiceContainer } from './instantiation-service';
import type { EventBus } from './workbench-events';

export interface CommandContext {
  scene: DocumentStore;
  selection: EditorSession;
  services: ServiceContainer;
  events: EventBus;
  editor: EditorService;
}
