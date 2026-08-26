import { createServiceId } from '../runtime/create-service-id';

export interface RichTextInsertService {
  insert(text: string): boolean;
  hasHandler(): boolean;
  setHandler(handler: ((text: string) => void) | null): void;
}

export class RichTextInsertServiceImpl implements RichTextInsertService {
  private handler: ((text: string) => void) | null = null;

  setHandler(handler: ((text: string) => void) | null): void {
    this.handler = handler;
  }

  hasHandler(): boolean {
    return this.handler !== null;
  }

  insert(text: string): boolean {
    if (!this.handler) {
      return false;
    }
    this.handler(text);
    return true;
  }
}

export const RichTextInsertServiceId =
  createServiceId<RichTextInsertService>('richTextInsert');
