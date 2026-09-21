import type { PropertyLayoutNode } from '../properties/property-layout-node';

export interface ConfirmDialogOptions {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

export interface FormDialogExtraAction {
  id: string;
  label: string;
  variant?: 'outline';
  /** Local confirm overlay in the form renderer — not a second DialogService entry. */
  confirm?: ConfirmDialogOptions;
}

/** Serializable form dialog state exposed on workbench state. */
export interface FormDialogPayload {
  title: string;
  nodes: PropertyLayoutNode[];
  values: Record<string, unknown>;
  submitLabel?: string;
  cancelLabel?: string;
  extraActions?: FormDialogExtraAction[];
  error?: string | null;
}

export type ActiveDialog =
  | { kind: 'confirm'; payload: ConfirmDialogOptions }
  | { kind: 'form'; payload: FormDialogPayload };

export interface ShowFormOptions {
  title: string;
  nodes: PropertyLayoutNode[];
  values: Record<string, unknown>;
  submitLabel?: string;
  cancelLabel?: string;
  /** At most one action is rendered (left side of the footer). */
  extraActions?: FormDialogExtraAction[];
  /** Runs only when the user submits (not for {@link FormDialogExtraAction} ids). */
  validate?: (
    values: Record<string, unknown>
  ) => string | null | Promise<string | null>;
}

export type FormDialogResult =
  | { action: 'submit'; values: Record<string, unknown> }
  | { action: string; values: Record<string, unknown> };
