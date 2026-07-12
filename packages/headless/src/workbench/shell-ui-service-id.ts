import { createServiceId } from '@openenvx/core';

import type { ShellUiService } from './shell-ui-service';

export const ShellUiServiceId = createServiceId<ShellUiService>('shellUi');
