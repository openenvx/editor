import type { WidgetFieldDef, WidgetFieldKind } from './types';

/** Opaque prop schema carrying a phantom type for InferProps. */
export interface PropSchema<T> {
  readonly __type?: T;
  readonly kind: WidgetFieldKind;
  readonly label: string;
  readonly default?: T;
  readonly options?: { label: string; value: string }[];
  readonly of?: PropsSchema;
  readonly multiline?: boolean;
}

export type PropsSchema = Record<string, PropSchema<unknown>>;

export type InferProps<S extends PropsSchema> = {
  [K in keyof S]: S[K] extends PropSchema<infer T> ? T : never;
};

export interface AssetRef {
  src?: string;
  assetRef?: string;
}

interface FieldOptions<T> {
  label?: string;
  default?: T;
}

function schema<T>(
  kind: WidgetFieldKind,
  options: FieldOptions<T> & {
    options?: { label: string; value: string }[];
    of?: PropsSchema;
    multiline?: boolean;
  } = {}
): PropSchema<T> {
  return {
    kind,
    label: options.label ?? kind,
    ...(options.default === undefined ? {} : { default: options.default }),
    ...(options.options ? { options: options.options } : {}),
    ...(options.of ? { of: options.of } : {}),
    ...(options.multiline ? { multiline: true } : {}),
  };
}

export function string(
  options: FieldOptions<string> & { multiline?: boolean } = {}
): PropSchema<string> {
  return schema(options.multiline ? 'textarea' : 'text', options);
}

export function number(options: FieldOptions<number> = {}): PropSchema<number> {
  return schema('number', options);
}

export function boolean(
  options: FieldOptions<boolean> = {}
): PropSchema<boolean> {
  return schema('toggle', options);
}

export function color(options: FieldOptions<string> = {}): PropSchema<string> {
  return schema('color', options);
}

export function asset(
  options: FieldOptions<AssetRef | string> = {}
): PropSchema<AssetRef | string> {
  return schema('image', options);
}

export function richText(
  options: FieldOptions<string> = {}
): PropSchema<string> {
  return schema('richText', options);
}

export function font(options: FieldOptions<string> = {}): PropSchema<string> {
  return schema('font', options);
}

export function align(
  options: FieldOptions<'left' | 'center' | 'right'> = {}
): PropSchema<'left' | 'center' | 'right'> {
  return schema('align', options);
}

export function select<
  const O extends readonly { label: string; value: string }[],
>(
  options: O,
  field: FieldOptions<O[number]['value']> = {}
): PropSchema<O[number]['value']> {
  return schema('select', {
    ...field,
    options: [...options],
  });
}

export function list<S extends PropsSchema>(
  of: S,
  field: FieldOptions<InferProps<S>[]> = {}
): PropSchema<InferProps<S>[]> {
  return schema('repeater', { ...field, of });
}

/** Compile a props schema into the persisted manifest fields + defaults shape. */
export function compilePropsSchema(props: PropsSchema): {
  fields: Record<string, WidgetFieldDef>;
  defaults: Record<string, unknown>;
} {
  const fields: Record<string, WidgetFieldDef> = {};
  const defaults: Record<string, unknown> = {};

  for (const [key, prop] of Object.entries(props)) {
    if (prop.kind === 'select' && prop.options) {
      fields[key] = {
        kind: 'select',
        label: prop.label,
        options: prop.options,
      };
    } else if (prop.kind === 'repeater' && prop.of) {
      const nested = compilePropsSchema(prop.of);
      fields[key] = {
        kind: 'repeater',
        label: prop.label,
        of: nested.fields,
      };
    } else {
      fields[key] = {
        kind: prop.kind as Exclude<WidgetFieldKind, 'select' | 'repeater'>,
        label: prop.label,
      };
    }
    if (prop.default !== undefined) {
      defaults[key] = prop.default;
    }
  }

  return { fields, defaults };
}

/** Seed values from schema defaults, overlaying any provided values. */
export function defaultsFromProps(
  props: PropsSchema,
  values: Record<string, unknown> = {}
): Record<string, unknown> {
  const { defaults } = compilePropsSchema(props);
  return { ...defaults, ...values };
}
