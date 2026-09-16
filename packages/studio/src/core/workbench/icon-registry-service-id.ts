import { createServiceId } from '../runtime/create-service-id';
import type { IconRegistry } from './icon-registry-service';

export const IconRegistryId = createServiceId<IconRegistry>('iconRegistry');
