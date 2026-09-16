import { createServiceId } from '../backbone';
import type { VersionHistoryProvider } from './version-history-types';

export const VersionHistoryProviderId = createServiceId<VersionHistoryProvider>(
  'versionHistoryProvider'
);
