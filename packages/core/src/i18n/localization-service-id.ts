import { createServiceId } from '../runtime/create-service-id';
import type { LocalizationService } from './localization-service';

export const LocalizationServiceId =
  createServiceId<LocalizationService>('localization');
