import type { ReactElement, ReactNode } from 'react';

export type FieldDef =
  | { kind: 'text'; label: string }
  | { kind: 'textarea'; label: string }
  | { kind: 'number'; label: string }
  | { kind: 'color'; label: string }
  | { kind: 'image'; label: string }
  | { kind: 'richText'; label: string }
  | { kind: 'align'; label: string }
  | { kind: 'toggle'; label: string }
  | {
      kind: 'select';
      label: string;
      options: { label: string; value: string }[];
    };

/** Named slot on a composite block — parts live under `data.slots`, not `data.children`. */
export interface SlotDef {
  label: string;
  /** Block type registered in the BlockRegistry (e.g. `html.heading`). */
  partType: string;
  /** When true, the slot holds an array the user can add/remove from in the inspector. */
  repeatable?: boolean;
  /** When true, a visibility toggle is offered for the (single) part. */
  optional?: boolean;
}

export interface BlockRenderProps {
  data: Record<string, unknown>;
  children?: ReactNode;
  /** Named slot content for composite blocks (keyed by SlotDef name). */
  slots?: Record<string, ReactNode>;
}

export interface BlockConfig {
  type: string;
  label: string;
  fields: Record<string, FieldDef>;
  defaultData: Record<string, unknown>;
  /** When true, block renders a drop zone for nested children. */
  acceptsChildren?: boolean;
  /**
   * Palette visibility. `false` hides the block. When omitted, types ending in
   * `.root` are hidden and everything else is shown.
   */
  palette?: boolean;
  /** Layers-tree icon; falls back to a type-suffix heuristic when omitted. */
  treeIcon?: string;
  /**
   * DnD insert-line axis for children. When omitted, `html.flex` uses
   * `direction` and `html.grid` defaults to vertical.
   */
  insertLineAxis?: 'vertical' | 'horizontal';
  /** Named slots whose parts are real layers under `data.slots` (invisible to the Layers tree). */
  slots?: Record<string, SlotDef>;
  render: (props: BlockRenderProps) => ReactElement;
}
