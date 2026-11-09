/** Driver-editable floating toolbar items (selection pill, rich-text bubble, etc.). */

export interface FloatingToolbarCommandItem {
  kind: 'command';
  id: string;
  commandId?: string;
  icon: string;
  ariaLabel: string;
  args?: Record<string, unknown>;
  dragHandle?: boolean;
}

export interface FloatingToolbarFileItem {
  kind: 'file';
  id: string;
  icon: string;
  ariaLabel: string;
  accept: string;
  commandId: string;
}

export interface FloatingToolbarSeparatorItem {
  kind: 'separator';
  id: string;
}

export interface FloatingToolbarLabelItem {
  kind: 'label';
  id: string;
  text: string;
}

export interface FloatingToolbarToggleItem {
  kind: 'toggle';
  id: string;
  commandId: string;
  icon: string;
  ariaLabel: string;
  active: boolean;
  args?: Record<string, unknown>;
}

export interface FloatingToolbarMenuItem {
  kind: 'menu';
  id: string;
  ariaLabel: string;
  commandId: string;
  value: string;
  options: { value: string; label: string; icon: string }[];
  triggerLabel?: string;
}

export interface FloatingToolbarPopoverFieldItem {
  kind: 'popoverField';
  id: string;
  icon: string;
  ariaLabel: string;
  commandId: string;
  value: string;
  placeholder?: string;
  submitLabel?: string;
  active?: boolean;
  clear?: { commandId: string; label: string };
}

export interface FloatingToolbarColorItem {
  kind: 'color';
  id: string;
  commandId: string;
  value: string;
  ariaLabel?: string;
}

export type FloatingToolbarItem =
  | FloatingToolbarCommandItem
  | FloatingToolbarFileItem
  | FloatingToolbarSeparatorItem
  | FloatingToolbarLabelItem
  | FloatingToolbarToggleItem
  | FloatingToolbarMenuItem
  | FloatingToolbarPopoverFieldItem
  | FloatingToolbarColorItem;

/** Selection pill items (legacy alias). */
export type FloatingSelectionToolbarItem =
  | FloatingToolbarCommandItem
  | FloatingToolbarFileItem
  | FloatingToolbarSeparatorItem
  | FloatingToolbarLabelItem;
