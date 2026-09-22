import { createServiceId } from '../runtime/create-service-id';
import type {
  ActiveDialog,
  ConfirmDialogOptions,
  FormDialogPayload,
  FormDialogResult,
  ShowFormOptions,
} from './dialog-registrations';

type Listener = () => void;

type FormValidateFn = (
  values: Record<string, unknown>
) => string | null | Promise<string | null>;

export interface DialogService {
  close(): void;
  showConfirm(options: ConfirmDialogOptions): Promise<boolean>;
  resolveConfirm(confirmed: boolean): void;
  showForm(options: ShowFormOptions): Promise<FormDialogResult | undefined>;
  resolveForm(result: FormDialogResult | undefined): void;
  patchFormPayload(patch: Partial<FormDialogPayload>): void;
  getActive(): ActiveDialog | null;
  subscribe(listener: Listener): () => void;
}

export class DialogServiceImpl implements DialogService {
  private active: ActiveDialog | null = null;
  private readonly listeners = new Set<Listener>();
  private confirmResolver: ((value: boolean) => void) | null = null;
  private formResolver: ((value?: FormDialogResult) => void) | null = null;
  private formValidate: FormValidateFn | null = null;
  private formValidateGeneration = 0;
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

  private rejectPendingConfirm(): void {
    if (this.confirmResolver) {
      this.confirmResolver(false);
      this.confirmResolver = null;
    }
  }

  private rejectPendingForm(): void {
    if (this.formResolver) {
      this.formResolver();
      this.formResolver = null;
    }
    this.formValidate = null;
  }

  close(): void {
    if (!this.active) {
      return;
    }
    this.formValidateGeneration += 1;
    if (this.active.kind === 'confirm') {
      this.rejectPendingConfirm();
    } else {
      this.rejectPendingForm();
    }
    this.active = null;
    this.emit();
  }

  showConfirm(options: ConfirmDialogOptions): Promise<boolean> {
    return new Promise((resolve) => {
      this.rejectPendingConfirm();
      this.rejectPendingForm();
      this.confirmResolver = resolve;
      this.active = { kind: 'confirm', payload: options };
      this.emit();
    });
  }

  resolveConfirm(confirmed: boolean): void {
    if (this.active?.kind !== 'confirm') {
      return;
    }
    if (this.confirmResolver) {
      this.confirmResolver(confirmed);
      this.confirmResolver = null;
    }
    this.active = null;
    this.emit();
  }

  showForm(options: ShowFormOptions): Promise<FormDialogResult | undefined> {
    return new Promise((resolve) => {
      this.rejectPendingConfirm();
      this.rejectPendingForm();
      this.formResolver = resolve;
      this.formValidate = options.validate ?? null;
      const payload: FormDialogPayload = {
        cancelLabel: options.cancelLabel,
        extraActions: options.extraActions,
        nodes: options.nodes,
        submitLabel: options.submitLabel,
        title: options.title,
        values: { ...options.values },
      };
      this.active = { kind: 'form', payload };
      this.emit();
    });
  }

  patchFormPayload(patch: Partial<FormDialogPayload>): void {
    if (this.active?.kind !== 'form') {
      return;
    }
    this.active = {
      kind: 'form',
      payload: { ...this.active.payload, ...patch },
    };
    this.emit();
  }

  resolveForm(result: FormDialogResult | undefined): void {
    if (this.active?.kind !== 'form') {
      return;
    }
    if (!result) {
      this.rejectPendingForm();
      this.active = null;
      this.emit();
      return;
    }

    const finish = (error: string | null) => {
      if (error) {
        this.patchFormPayload({ error });
        return;
      }
      if (this.formResolver) {
        this.formResolver(result);
        this.formResolver = null;
      }
      this.formValidate = null;
      this.active = null;
      this.emit();
    };

    const validate = this.formValidate;
    if (!validate || result.action !== 'submit') {
      finish(null);
      return;
    }

    this.formValidateGeneration += 1;
    const generation = this.formValidateGeneration;
    void Promise.resolve()
      .then(() => validate(result.values))
      .then((error) => {
        if (generation !== this.formValidateGeneration) {
          return;
        }
        finish(error);
      })
      .catch(() => {
        if (generation !== this.formValidateGeneration) {
          return;
        }
        finish('Validation failed');
      });
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
