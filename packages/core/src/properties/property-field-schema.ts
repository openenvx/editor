import { z } from 'zod';

const propertyFieldOptionSchema = z.object({
  value: z.string(),
  label: z.string(),
  icon: z.string().optional(),
});

const numericFieldConfigSchema = z.object({
  scrub: z.boolean().optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  step: z.number().optional(),
  precision: z.number().optional(),
  unit: z.string().optional(),
});

const fieldActionClickSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('setValue'),
    key: z.string(),
    value: z.unknown(),
  }),
  z.object({ type: z.literal('toggle'), key: z.string() }),
  z.object({ type: z.literal('command'), commandId: z.string() }),
]);

const fieldActionSchema = z.object({
  icon: z.string(),
  label: z.string(),
  onClick: fieldActionClickSchema,
});

const popupSubFieldSchema = z
  .object({
    key: z.string().min(1),
    kind: z.string().min(1),
    label: z.string(),
    icon: z.string().optional(),
    options: z.array(propertyFieldOptionSchema).optional(),
    numeric: numericFieldConfigSchema.optional(),
    actions: z.array(fieldActionSchema).optional(),
  })
  .passthrough();

const popupFieldConfigSchema = z.object({
  icon: z.string(),
  title: z.string().optional(),
  fields: z.array(popupSubFieldSchema),
});

const repeaterFieldConfigSchema = z.object({
  key: z.string().min(1),
  kind: z.string().min(1),
  label: z.string(),
  options: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
});

const slotListFieldConfigSchema = z.object({
  newPart: z.unknown(),
  fields: z.array(repeaterFieldConfigSchema).min(1),
});

const sharedStrictFields = {
  key: z.string().min(1),
  label: z.string(),
  icon: z.string().optional(),
  layout: z.enum(['stack', 'inline', 'block']).optional(),
  debounceMs: z.number().optional(),
  description: z.string().optional(),
  when: z.string().optional(),
  popup: popupFieldConfigSchema.optional(),
  actions: z.array(fieldActionSchema).optional(),
};

function builtinKindSchema<K extends string>(
  kind: K,
  extra: z.ZodRawShape
): z.ZodObject<
  z.ZodRawShape & { kind: z.ZodLiteral<K> } & typeof sharedStrictFields
> {
  return z.strictObject({
    ...sharedStrictFields,
    kind: z.literal(kind),
    ...extra,
  });
}

const textLikeExtra = {
  placeholder: z.string().optional(),
  maxLength: z.number().optional(),
};

const numericKindExtra = {
  numeric: numericFieldConfigSchema.optional(),
};

const optionsRequiredExtra = {
  options: z.array(propertyFieldOptionSchema).min(1),
};

const optionsOptionalExtra = {
  options: z.array(propertyFieldOptionSchema).optional(),
};

export const BUILTIN_PROPERTY_FIELD_KINDS = [
  'text',
  'number',
  'toggle',
  'checkbox',
  'select',
  'segmented',
  'font',
  'color',
  'richText',
  'repeater',
  'slotList',
  'image',
  'border',
  'cornerRadius',
  'padding',
  'shadow',
  'align',
] as const;

export type BuiltinPropertyFieldKind =
  (typeof BUILTIN_PROPERTY_FIELD_KINDS)[number];

const builtinKindSet = new Set<string>(BUILTIN_PROPERTY_FIELD_KINDS);

export function isBuiltinPropertyFieldKind(
  kind: string
): kind is BuiltinPropertyFieldKind {
  return builtinKindSet.has(kind);
}

const builtinPropertyFieldSchemas = [
  builtinKindSchema('text', textLikeExtra),
  builtinKindSchema('richText', textLikeExtra),
  builtinKindSchema('number', numericKindExtra),
  builtinKindSchema('border', numericKindExtra),
  builtinKindSchema('cornerRadius', numericKindExtra),
  builtinKindSchema('padding', numericKindExtra),
  builtinKindSchema('shadow', numericKindExtra),
  builtinKindSchema('select', optionsRequiredExtra),
  builtinKindSchema('segmented', optionsRequiredExtra),
  builtinKindSchema('align', optionsOptionalExtra),
  builtinKindSchema('font', optionsOptionalExtra),
  builtinKindSchema('toggle', {}),
  builtinKindSchema('checkbox', {}),
  builtinKindSchema('color', {}),
  builtinKindSchema('repeater', {
    repeaterFields: z.array(repeaterFieldConfigSchema).min(1),
  }),
  builtinKindSchema('slotList', {
    slotList: slotListFieldConfigSchema,
  }),
  builtinKindSchema('image', {
    uploadCommandId: z.string().optional(),
  }),
] as const;

export const builtinPropertyFieldSchema = z.discriminatedUnion('kind', [
  ...builtinPropertyFieldSchemas,
]);

const customPropertyFieldSchema = z
  .object({
    ...sharedStrictFields,
    kind: z.string().min(1),
  })
  .passthrough();

export function safeParsePropertyFieldDescriptor(
  field: unknown
): z.ZodSafeParseResult<unknown> {
  if (
    typeof field === 'object' &&
    field !== null &&
    'kind' in field &&
    typeof (field as { kind: unknown }).kind === 'string' &&
    isBuiltinPropertyFieldKind((field as { kind: string }).kind)
  ) {
    return builtinPropertyFieldSchema.safeParse(field);
  }
  return customPropertyFieldSchema.safeParse(field);
}
