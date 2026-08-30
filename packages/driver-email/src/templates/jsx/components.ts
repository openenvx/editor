import type { CSSProperties, ReactNode } from 'react';

/** Marker so the Scene translator can recognize authoring components. */
export const EMAIL_JSX_TYPE = Symbol.for('openenvx.emailJsxType');

export type EmailJsxType =
  | 'email.root'
  | 'email.section'
  | 'email.row'
  | 'email.column'
  | 'email.heading'
  | 'email.text'
  | 'email.button'
  | 'email.image'
  | 'email.imageLink'
  | 'email.link';

export type EmailJsxComponent = ((props: EmailJsxProps) => null) & {
  readonly [EMAIL_JSX_TYPE]: EmailJsxType;
  displayName: string;
};

export interface EmailJsxProps {
  id?: string;
  /** Layers tree label override (falls back to block type label). */
  name?: string;
  style?: CSSProperties;
  children?: ReactNode;
  /** email.root */
  preheader?: string;
  /** email.column / image / text / heading / button / section */
  align?: 'left' | 'center' | 'right';
  /** email.column */
  verticalAlign?: 'top' | 'middle' | 'bottom';
  width?: number | string;
  height?: number;
  href?: string;
  src?: string;
  alt?: string;
  /** email.heading - `h1` | `h2` | `h3` */
  as?: 'h1' | 'h2' | 'h3' | '1' | '2' | '3';
  /** Override text/heading body when children are awkward */
  html?: string;
  label?: string;
}

function createEmailJsxComponent(type: EmailJsxType): EmailJsxComponent {
  const Comp = ((_props: EmailJsxProps) => null) as EmailJsxComponent;
  Object.defineProperty(Comp, EMAIL_JSX_TYPE, { value: type });
  Comp.displayName = type;
  return Comp;
}

/** Document root - maps to `email.root`. */
export const Email = createEmailJsxComponent('email.root');
export const Section = createEmailJsxComponent('email.section');
export const Row = createEmailJsxComponent('email.row');
export const Column = createEmailJsxComponent('email.column');
export const Heading = createEmailJsxComponent('email.heading');
export const Text = createEmailJsxComponent('email.text');
export const Button = createEmailJsxComponent('email.button');
export const Img = createEmailJsxComponent('email.image');
export const ImageLink = createEmailJsxComponent('email.imageLink');
/** Inline `<a>` inside Text/Heading - serialized to HTML, not a Scene layer. */
export const Link = createEmailJsxComponent('email.link');

export function isEmailJsxComponent(type: unknown): type is EmailJsxComponent {
  return (
    typeof type === 'function' &&
    EMAIL_JSX_TYPE in type &&
    typeof (type as EmailJsxComponent)[EMAIL_JSX_TYPE] === 'string'
  );
}
