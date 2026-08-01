import { h, type ComponentChildren, type JSX } from 'preact';

import type {
  EllipseProps,
  ImageProps,
  InstanceProps,
  LayerByNameProps,
  QrProps,
  StackProps,
  SvgProps,
  TextProps,
} from '../types';

type PropsWithChildren<P> = P & { children?: ComponentChildren };

function intrinsic(
  type: string,
  props: Record<string, unknown> | null,
  ...children: ComponentChildren[]
): JSX.Element {
  return h(type, props, ...children) as JSX.Element;
}

/** Absolute-positioned container (former Frame). */
export function Group(
  props: PropsWithChildren<{
    width?: number;
    height?: number;
    fill?: string;
    padding?: number;
  }>
): JSX.Element {
  return intrinsic('Group', props as Record<string, unknown>, props.children);
}

/** Flex-style auto layout (former AutoLayout). */
export function Stack(props: PropsWithChildren<StackProps>): JSX.Element {
  return intrinsic('Stack', props as Record<string, unknown>, props.children);
}

/** Horizontal Stack shorthand. */
export function Row(
  props: PropsWithChildren<Omit<StackProps, 'direction'>>
): JSX.Element {
  return intrinsic(
    'Stack',
    { ...props, direction: 'horizontal' } as Record<string, unknown>,
    props.children
  );
}

/** CSS-grid-style layout intent resolved on the host. */
export function Grid(
  props: PropsWithChildren<{
    columns?: number;
    gap?: number;
    padding?: number;
    width?: number;
    height?: number;
    fill?: string;
    onClick?: (payload?: unknown) => void;
  }>
): JSX.Element {
  return intrinsic('Grid', props as Record<string, unknown>, props.children);
}

export function Text(
  props: PropsWithChildren<TextProps> & { value?: string }
): JSX.Element {
  const { value, children, ...rest } = props;
  const content = value !== undefined ? value : (children as ComponentChildren);
  return intrinsic('Text', rest as Record<string, unknown>, content);
}

export function Rect(props: {
  width?: number;
  height?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  cornerRadius?: number;
}): JSX.Element {
  return intrinsic('Rect', props as Record<string, unknown>);
}

export function Ellipse(props: EllipseProps): JSX.Element {
  return intrinsic('Ellipse', props as Record<string, unknown>);
}

export function Image(
  props: ImageProps & { source?: string | { src?: string; assetRef?: string } }
): JSX.Element {
  const { source, ...rest } = props;
  const mapped: Record<string, unknown> = { ...rest };
  if (typeof source === 'string') {
    mapped.src = source;
  } else if (source && typeof source === 'object') {
    if (source.src) {
      mapped.src = source.src;
    }
    if (source.assetRef) {
      mapped.assetRef = source.assetRef;
    }
  }
  return intrinsic('Image', mapped);
}

export function SVG(props: SvgProps): JSX.Element {
  return intrinsic('SVG', props as unknown as Record<string, unknown>);
}

export function QR(props: QrProps): JSX.Element {
  return intrinsic('QR', props as unknown as Record<string, unknown>);
}

/** Escape hatch: instantiate any registered layer type by name. */
export function Layer(props: LayerByNameProps): JSX.Element {
  return intrinsic('Layer', props as unknown as Record<string, unknown>);
}

/** Reuse a customer-saved scene component. */
export function Instance(props: InstanceProps): JSX.Element {
  return intrinsic('Instance', props as unknown as Record<string, unknown>);
}
