import type { ServiceContainer } from './instantiation-service';
import type { EventBus } from './workbench-events';

export interface CommandContext {
  services: ServiceContainer;
  events: EventBus;
}
