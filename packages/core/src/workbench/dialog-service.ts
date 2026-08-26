import { createServiceId } from '../runtime/create-service-id';
import {
  WORKBENCH_CONFIRM_DIALOG_ID,
  type ActiveDialog,
  type ConfirmDialogOptions,
} from './dialog-registrations';

type Listener = () => void;

export interface DialogService {
  open(id: string, payload?: unknown): void;
  close(id?: string): void;
  showConfirm(options: ConfirmDialogOptions): Promise<boolean>;
  resolveConfirm(confirmed: boolean): void;
  getActive(): ActiveDialog | null;
  subscribe(listener: Listener): () => void;
}

export class DialogServiceImpl implements DialogService {
  private active: ActiveDialog | null = null;
  private readonly listeners = new Set<Listener>();
  private confirmResolver: ((value: boolean) => void) | null = null;
  private onChange: (() => void) | undefined;

  bind(onChange: () => void): void {
    this.onChange = onChange;
  }

  private emit(): void {
    for (const listener of this.listeners) {
      listener();
    }
    this.onChange?.();
  }

  open(id: string, payload?: unknown): void {
    if (this.confirmResolver && id !== WORKBENCH_CONFIRM_DIALOG_ID) {
      this.confirmResolver(false);
      this.confirmResolver = null;
    }
    this.active = { id, payload };
    this.emit();
  }

  close(id?: string): void {
    if (!this.active) {
      return;
    }
    if (id && this.active.id !== id) {
      return;
    }
    if (
      this.active.id === WORKBENCH_CONFIRM_DIALOG_ID &&
      this.confirmResolver
    ) {
      this.confirmResolver(false);
      this.confirmResolver = null;
    }
    this.active = null;
    this.emit();
  }

  showConfirm(options: ConfirmDialogOptions): Promise<boolean> {
    return new Promise((resolve) => {
      if (this.confirmResolver) {
        this.confirmResolver(false);
      }
      this.confirmResolver = resolve;
      this.open(WORKBENCH_CONFIRM_DIALOG_ID, options);
    });
  }

  resolveConfirm(confirmed: boolean): void {
    if (this.confirmResolver) {
      this.confirmResolver(confirmed);
      this.confirmResolver = null;
    }
    this.active = null;
    this.emit();
  }

  getActive(): ActiveDialog | null {
    return this.active;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
}

export const DialogServiceId = createServiceId<DialogService>('dialog');
