import type {
  CSSProperties,
  DragEvent,
  KeyboardEvent,
  MouseEvent,
  PointerEvent,
  ReactElement,
  ReactNode,
} from 'react';

/** Props applied to the block DOM root when `chromeDisplay` is `contents`. */
export type BlockChromeHostProps = {
  ref?: (node: HTMLElement | null) => void;
  className?: string;
  style?: CSSProperties;
  role?: string;
  tabIndex?: number;
  'data-layer-id'?: string;
  onClick?: (event: MouseEvent<HTMLElement>) => void;
  onContextMenu?: (event: MouseEvent<HTMLElement>) => void;
  onKeyDown?: (event: KeyboardEvent<HTMLElement>) => void;
  onPointerEnter?: (event: PointerEvent<HTMLElement>) => void;
  onPointerLeave?: (event: PointerEvent<HTMLElement>) => void;
  onDragOver?: (event: DragEvent<HTMLElement>) => void;
  onDragLeave?: (event: DragEvent<HTMLElement>) => void;
  onDrop?: (event: DragEvent<HTMLElement>) => void;
} & Record<string, unknown>;

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
    }
  | {
      kind: 'segmented';
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
  /**
   * Droppable target for nested children when `childContainerHost` is
   * `table-row` (ref/class on `<tr>`, not a wrapper `<div>`).
   */
  containerRef?: (node: HTMLElement | null) => void;
  containerClassName?: string;
  /** Selection/dnd chrome for `chromeDisplay: 'contents'` blocks (e.g. email column `<td>`). */
  hostProps?: BlockChromeHostProps;
}

/** TipTap bubble-menu sections. Omitted keys default to shown. */
export interface RichTextToolbarOptions {
  /** Paragraph / list / quote / code block picker. Default true. */
  blockType?: boolean;
  /** Link mark control. Default true. */
  link?: boolean;
  /** Inline code mark control. Default true. */
  code?: boolean;
  /** Left / center / right align. Default true. */
  align?: boolean;
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
  /**
   * Editor selection chrome around this block.
   * - `block` (default): full-width stack wrapper
   * - `inline`: hug content for horizontal siblings (e.g. social icon links)
   * - `contents`: mount selection/DnD on the block's DOM root (no wrapper div).
   *   Required for `email.column` (`<td>`) so a chrome box is not inserted
   *   between `<tr>` and `<td>`. Editor CSS uses `position: relative` on the
   *   host element — not CSS `display: contents` (invalid for table cells).
   */
  chromeDisplay?: 'block' | 'inline' | 'contents';
  /**
   * Where the child-list drop target mounts. `table-row` puts the droppable
   * ref on the row's `<tr>` so columns stay valid `<td>` children.
   */
  childContainerHost?: 'default' | 'table-row';
  /**
   * Bubble-menu controls when this block's own rich text is edited.
   * Overrides `childRichTextToolbar` from ancestors.
   */
  richTextToolbar?: RichTextToolbarOptions;
  /**
   * Bubble-menu defaults for rich-text descendants (and slot text parts).
   * Use when a composite fixes placement/structure (e.g. event hero).
   */
  childRichTextToolbar?: RichTextToolbarOptions;
  /** Named slots whose parts are real layers under `data.slots` (invisible to the Layers tree). */
  slots?: Record<string, SlotDef>;
  render: (props: BlockRenderProps) => ReactElement;
}
