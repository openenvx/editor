import { createServiceId } from '../runtime/create-service-id';
import type { ShellUiService } from './shell-ui-service';

export const ShellUiServiceId = createServiceId<ShellUiService>('shellUi');
