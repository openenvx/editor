import type { ReactElement, ReactNode } from 'react';

export type FieldDef =
  | { kind: 'text'; label: string }
  | { kind: 'textarea'; label: string }
  | { kind: 'number'; label: string }
  | {
      kind: 'select';
      label: string;
      options: { label: string; value: string }[];
    };

export interface BlockRenderProps {
  data: Record<string, unknown>;
  children?: ReactNode;
}

export interface BlockConfig {
  type: string;
  label: string;
  fields: Record<string, FieldDef>;
  defaultData: Record<string, unknown>;
  /** When true, block renders a drop zone for nested children. */
  acceptsChildren?: boolean;
  render: (props: BlockRenderProps) => ReactElement;
}
