import { createServiceId } from '../runtime/create-service-id';
import type { ThemeService } from './theme-service';

export const ThemeServiceId = createServiceId<ThemeService>('theme');
