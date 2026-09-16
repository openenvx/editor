export interface DialogRegistration {
  id: string;
  Component: unknown;
}

export interface ActiveDialog {
  id: string;
  payload?: unknown;
}

export interface ConfirmDialogOptions {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

export const WORKBENCH_CONFIRM_DIALOG_ID = 'workbench.confirm';
