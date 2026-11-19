import { createServiceId } from '../runtime/create-service-id';

export interface FontDescriptor {
  id: string;
  family: string;
}

export interface FontService {
  list(): FontDescriptor[];
  listFeatured(): FontDescriptor[];
  ensureLoaded(family: string): Promise<void> | void;
  register(descriptor: FontDescriptor): void;
}

export const FontServiceId = createServiceId<FontService>('fonts');
