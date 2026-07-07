import { createServiceId } from '../runtime/create-service-id';
import type { DocumentOperationsService } from './document-operations-service';

export const DocumentOperationsServiceId =
  createServiceId<DocumentOperationsService>('documentOperations');
