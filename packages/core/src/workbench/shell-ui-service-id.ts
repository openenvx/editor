import { createServiceId } from '../backbone';
import type { ShellUiService } from './shell-ui-service';

export const ShellUiServiceId = createServiceId<ShellUiService>('shellUi');
