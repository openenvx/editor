import type { Registries } from '../registries/registries';
import type { WorkbenchRuntime } from '../runtime/workbench-runtime';
import { LayerRegistryServiceId } from '../tokens';
import {
  NotificationServiceImpl,
  NotificationServiceId,
} from './notification-service';
import { ShellUiServiceImpl } from './shell-ui-service';
import { ShellUiServiceId } from './shell-ui-service-id';

export function bootstrapWorkbenchServices(
  runtime: WorkbenchRuntime,
  coreRegistries: Registries
): void {
  runtime.services.registerInstance(
    LayerRegistryServiceId,
    coreRegistries.layers
  );
  runtime.services.registerInstance(ShellUiServiceId, new ShellUiServiceImpl());
  runtime.services.registerInstance(
    NotificationServiceId,
    new NotificationServiceImpl()
  );
}
