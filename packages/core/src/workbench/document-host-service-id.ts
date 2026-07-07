import { createServiceId } from '../runtime/create-service-id';
import type { DocumentHostService } from './document-host-service';

export const DocumentHostServiceId =
  createServiceId<DocumentHostService>('documentHost');
