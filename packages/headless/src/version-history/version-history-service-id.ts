import { createServiceId } from '@openenvx/core';

import type { VersionHistoryProvider } from './version-history-types';

export const VersionHistoryProviderId = createServiceId<VersionHistoryProvider>(
  'versionHistoryProvider'
);
