import { createServiceId } from '../runtime/create-service-id';
import type { CommandContext } from '../runtime/types';

export interface TextBlockInsertService {
  insert(ctx: CommandContext, html: string): boolean;
}

export const TextBlockInsertServiceId =
  createServiceId<TextBlockInsertService>('textBlockInsert');
