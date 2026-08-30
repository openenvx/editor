import { h, type ComponentChildren, type JSX } from 'preact';

type PropsWithChildren<P> = P & { children?: ComponentChildren };

function intrinsic(
  type: string,
  props: Record<string, unknown> | null,
  ...children: ComponentChildren[]
): JSX.Element {
  return h(type, props, ...children) as JSX.Element;
}

export function Section(
  props: PropsWithChildren<{
    padding?: number;
    background?: string;
    onClick?: (payload?: unknown) => void;
  }>
): JSX.Element {
  return intrinsic('Section', props as Record<string, unknown>, props.children);
}

export function Row(
  props: PropsWithChildren<{
    gap?: number;
    padding?: number;
    background?: string;
    onClick?: (payload?: unknown) => void;
  }>
): JSX.Element {
  return intrinsic('Row', props as Record<string, unknown>, props.children);
}

export function Column(
  props: PropsWithChildren<{
    gap?: number;
    padding?: number;
    width?: string | number;
  }>
): JSX.Element {
  return intrinsic('Column', props as Record<string, unknown>, props.children);
}

export function Heading(
  props: PropsWithChildren<{
    level?: 1 | 2 | 3 | 4;
    color?: string;
    bind?: string;
  }>
): JSX.Element {
  return intrinsic('Heading', props as Record<string, unknown>, props.children);
}

export function Paragraph(
  props: PropsWithChildren<{
    color?: string;
    html?: string;
    bind?: string;
  }>
): JSX.Element {
  return intrinsic(
    'Paragraph',
    props as Record<string, unknown>,
    props.children
  );
}

export function Button(
  props: PropsWithChildren<{
    href?: string;
    backgroundColor?: string;
    color?: string;
    onClick?: (payload?: unknown) => void;
  }>
): JSX.Element {
  return intrinsic('Button', props as Record<string, unknown>, props.children);
}

export function HtmlImage(props: {
  src?: string;
  alt?: string;
  width?: number | string;
  height?: number | string;
}): JSX.Element {
  return intrinsic('Image', props as Record<string, unknown>);
}

export function Divider(props: { color?: string } = {}): JSX.Element {
  return intrinsic('Divider', props as Record<string, unknown>);
}

/** Raw markup escape hatch - sanitization happens in the `html.raw` sink. */
export function Html(props: { markup: string }): JSX.Element {
  return intrinsic('Html', props as Record<string, unknown>);
}

/** Instantiate any registered html.* block by type name. */
export function Block(props: {
  type: string;
  data?: Record<string, unknown>;
}): JSX.Element {
  return intrinsic('Block', props as Record<string, unknown>);
}
