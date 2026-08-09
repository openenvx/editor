import { diagnosePropertyFieldDescriptor } from '../properties/property-field-diagnostic';
import type {
  FieldAction,
  FieldConfigOptions,
  NumericFieldConfig,
  PopupFieldConfig,
  PropertyFieldLayout,
  PropertyFieldOption,
} from './field-config';
import { applyFieldConfig, DEFAULT_ALIGN_OPTIONS } from './field-config';
import { createPopupFieldsBuilder } from './popup-fields-builder';
import type { PopupFieldsBuilder } from './popup-fields-builder';

export type PropertyFieldKind =
  | 'text'
  | 'number'
  | 'toggle'
  | 'checkbox'
  | 'select'
  | 'segmented'
  | 'font'
  | 'color'
  | 'richText'
  | 'repeater'
  | 'slotList'
  | 'image'
  | 'border'
  | 'cornerRadius'
  | 'padding'
  | 'shadow'
  | 'align'
  | string;

export interface RepeaterFieldConfig {
  key: string;
  kind: Exclude<PropertyFieldKind, 'repeater' | 'slotList'>;
  label: string;
  options?: { value: string; label: string }[];
}

/** Config for a `slotList` field — rows are part layers under `data.slots`. */
export interface SlotListFieldConfig {
  /** Template part cloned (with a fresh id) when the user clicks Add. */
  newPart: unknown;
  fields: RepeaterFieldConfig[];
}

export type { PropertyFieldOption } from './field-config';

/**
 * Declarative inspector/sidebar field consumed by workbench field renderers.
 *
 * Author via `PropertyBuilder`, `createPropertyPane().row()`, or HTML `FieldDef` mapping.
 * @see docs/architecture/property-fields.md
 */
export interface PropertyFieldDescriptor {
  /** Stable key; default binding is `layer.data[key]` unless the pane row supplies a `PropertyPath`. */
  key: string;
  /** Registered renderer id (`text`, `select`, `color`, …). */
  kind: PropertyFieldKind;
  /** Label shown in the property row or block header. */
  label: string;
  icon?: string;
  /**
   * Inspector row layout. Omitted: kind-based default.
   * `block`: full-width label above; skips `FieldChrome` for actions/popups.
   */
  layout?: PropertyFieldLayout;
  /** Debounce property commits (ms). Useful for expensive preview regenerations. */
  debounceMs?: number;
  /** Helper text shown under the field control. */
  description?: string;
  /** Placeholder for text-like controls. */
  placeholder?: string;
  /** Max character length for text-like controls. */
  maxLength?: number;
  /** Choices for `select` / `segmented` / `align`. */
  options?: PropertyFieldOption[];
  /** Sub-fields for each row when `kind: 'repeater'`. */
  repeaterFields?: RepeaterFieldConfig[];
  /** Template + fields when `kind: 'slotList'` (HTML composite slots). */
  slotList?: SlotListFieldConfig;
  /** Command id invoked by the `image` field upload affordance. */
  uploadCommandId?: string;
  numeric?: NumericFieldConfig;
  popup?: PopupFieldConfig;
  actions?: FieldAction[];
  /**
   * Layout `when` when this field is synthesized into a layer properties pane.
   * @see docs/architecture/property-fields.md
   */
  when?: string;
}

/** Group of fields in a layer `properties()` section (canvas/HTML layer definitions). */
export interface PropertySectionDescriptor {
  id: string;
  label?: string;
  fields: PropertyFieldDescriptor[];
}

interface FieldHost {
  pushField(field: PropertyFieldDescriptor): void;
}

function pushOptionsField(
  host: FieldHost,
  kind: 'select' | 'segmented',
  key: string,
  options: { value: string; label: string }[],
  label: string | undefined,
  applyConfig: (config?: FieldConfigOptions) => void,
  config?: FieldConfigOptions
): void {
  host.pushField({
    key,
    kind,
    label: label ?? key,
    options,
  });
  applyConfig(config);
}

export class PropertyBuilder implements FieldHost {
  private readonly sections: PropertySectionDescriptor[] = [];
  private currentSection: PropertySectionDescriptor | null = null;

  section(id: string, label?: string): PropertySectionBuilder {
    this.currentSection = { fields: [], id, label };
    this.sections.push(this.currentSection);
    return new PropertySectionBuilder(this, this.currentSection);
  }

  text(key: string, label?: string, config?: FieldConfigOptions): this {
    this.pushField({ key, kind: 'text', label: label ?? key });
    this.applyConfigToLast(config);
    return this;
  }

  number(key: string, label?: string, config?: FieldConfigOptions): this {
    this.pushField({ key, kind: 'number', label: label ?? key });
    this.applyConfigToLast(config);
    return this;
  }

  toggle(key: string, label?: string, config?: FieldConfigOptions): this {
    this.pushField({ key, kind: 'toggle', label: label ?? key });
    this.applyConfigToLast(config);
    return this;
  }

  checkbox(key: string, label?: string, config?: FieldConfigOptions): this {
    this.pushField({ key, kind: 'checkbox', label: label ?? key });
    this.applyConfigToLast(config);
    return this;
  }

  select(
    key: string,
    options: { value: string; label: string }[],
    label?: string,
    config?: FieldConfigOptions
  ): this {
    pushOptionsField(
      this,
      'select',
      key,
      options,
      label,
      (c) => this.applyConfigToLast(c),
      config
    );
    return this;
  }

  segmented(
    key: string,
    options: { value: string; label: string }[],
    label?: string,
    config?: FieldConfigOptions
  ): this {
    pushOptionsField(
      this,
      'segmented',
      key,
      options,
      label,
      (c) => this.applyConfigToLast(c),
      config
    );
    return this;
  }

  font(
    key: string,
    options: { value: string; label: string }[],
    label?: string,
    config?: FieldConfigOptions
  ): this {
    this.pushField({
      key,
      kind: 'font',
      label: label ?? key,
      options,
    });
    this.applyConfigToLast(config);
    return this;
  }

  color(key: string, label?: string, config?: FieldConfigOptions): this {
    this.pushField({ key, kind: 'color', label: label ?? key });
    this.applyConfigToLast(config);
    return this;
  }

  richText(key: string, label?: string, config?: FieldConfigOptions): this {
    this.pushField({ key, kind: 'richText', label: label ?? key });
    this.applyConfigToLast(config);
    return this;
  }

  repeater(
    key: string,
    repeaterConfig: { fields: RepeaterFieldConfig[]; label?: string },
    config?: FieldConfigOptions
  ): this {
    this.pushField({
      layout: 'block',
      key,
      kind: 'repeater',
      label: repeaterConfig.label ?? key,
      repeaterFields: repeaterConfig.fields,
    });
    this.applyConfigToLast(config);
    return this;
  }

  slotList(
    key: string,
    slotListConfig: SlotListFieldConfig & { label?: string },
    config?: FieldConfigOptions
  ): this {
    this.pushField({
      layout: 'block',
      key,
      kind: 'slotList',
      label: slotListConfig.label ?? key,
      slotList: {
        fields: slotListConfig.fields,
        newPart: slotListConfig.newPart,
      },
    });
    this.applyConfigToLast(config);
    return this;
  }

  image(
    key: string,
    label?: string,
    uploadCommandId?: string,
    config?: FieldConfigOptions
  ): this {
    this.pushField({
      key,
      kind: 'image',
      label: label ?? key,
      uploadCommandId,
    });
    this.applyConfigToLast(config);
    return this;
  }

  border(key: string, label?: string, config?: FieldConfigOptions): this {
    this.pushField({
      layout: 'block',
      key,
      kind: 'border',
      label: label ?? key,
    });
    this.applyConfigToLast(config);
    return this;
  }

  cornerRadius(key: string, label?: string, config?: FieldConfigOptions): this {
    this.pushField({ key, kind: 'cornerRadius', label: label ?? key });
    this.applyConfigToLast(config);
    return this;
  }

  padding(key: string, label?: string, config?: FieldConfigOptions): this {
    this.pushField({ key, kind: 'padding', label: label ?? key });
    this.applyConfigToLast(config);
    return this;
  }

  shadow(key: string, label?: string, config?: FieldConfigOptions): this {
    this.pushField({ key, kind: 'shadow', label: label ?? key });
    this.applyConfigToLast(config);
    return this;
  }

  align(key: string, label?: string, config?: FieldConfigOptions): this {
    this.pushField({
      key,
      kind: 'align',
      label: label ?? key,
      options: DEFAULT_ALIGN_OPTIONS,
    });
    this.applyConfigToLast(config);
    return this;
  }

  field(descriptor: PropertyFieldDescriptor): this {
    this.pushField(descriptor);
    diagnosePropertyFieldDescriptor(descriptor);
    return this;
  }

  withNumeric(config: NumericFieldConfig): this {
    const field = this.getLastField();
    if (field) {
      field.numeric = config;
      diagnosePropertyFieldDescriptor(field);
    }
    return this;
  }

  withPopup(
    icon: string,
    build: (builder: PopupFieldsBuilder) => void,
    title?: string
  ): this {
    const popupBuilder = createPopupFieldsBuilder();
    build(popupBuilder);
    const field = this.getLastField();
    if (field) {
      field.popup = { fields: popupBuilder.build(), icon, title };
      diagnosePropertyFieldDescriptor(field);
    }
    return this;
  }

  withActions(actions: FieldAction[]): this {
    const field = this.getLastField();
    if (field) {
      field.actions = actions;
      diagnosePropertyFieldDescriptor(field);
    }
    return this;
  }

  build(): PropertySectionDescriptor[] {
    return this.sections.map((section) => ({
      ...section,
      fields: [...section.fields],
    }));
  }

  pushField(field: PropertyFieldDescriptor): void {
    this.ensureSection().fields.push(field);
  }

  getLastField(): PropertyFieldDescriptor | null {
    const section = this.currentSection;
    if (!section || section.fields.length === 0) {
      return null;
    }
    return section.fields.at(-1) ?? null;
  }

  private applyConfigToLast(config?: FieldConfigOptions): void {
    const field = this.getLastField();
    if (field) {
      applyFieldConfig(field, config);
      diagnosePropertyFieldDescriptor(field);
    }
  }

  private ensureSection(): PropertySectionDescriptor {
    if (!this.currentSection) {
      this.section('default');
    }
    return this.currentSection!;
  }
}

class PropertySectionBuilder {
  constructor(
    private readonly builder: PropertyBuilder,
    private readonly section: PropertySectionDescriptor
  ) {}

  private optionsFieldHost(): FieldHost {
    return {
      pushField: (field) => {
        this.pushField(field);
      },
    };
  }

  text(key: string, label?: string, config?: FieldConfigOptions): this {
    this.pushField({ key, kind: 'text', label: label ?? key });
    this.applyConfigToLast(config);
    return this;
  }

  number(key: string, label?: string, config?: FieldConfigOptions): this {
    this.pushField({ key, kind: 'number', label: label ?? key });
    this.applyConfigToLast(config);
    return this;
  }

  toggle(key: string, label?: string, config?: FieldConfigOptions): this {
    this.pushField({ key, kind: 'toggle', label: label ?? key });
    this.applyConfigToLast(config);
    return this;
  }

  checkbox(key: string, label?: string, config?: FieldConfigOptions): this {
    this.pushField({ key, kind: 'checkbox', label: label ?? key });
    this.applyConfigToLast(config);
    return this;
  }

  select(
    key: string,
    options: { value: string; label: string }[],
    label?: string,
    config?: FieldConfigOptions
  ): this {
    pushOptionsField(
      this.optionsFieldHost(),
      'select',
      key,
      options,
      label,
      (c) => this.applyConfigToLast(c),
      config
    );
    return this;
  }

  segmented(
    key: string,
    options: { value: string; label: string }[],
    label?: string,
    config?: FieldConfigOptions
  ): this {
    pushOptionsField(
      this.optionsFieldHost(),
      'segmented',
      key,
      options,
      label,
      (c) => this.applyConfigToLast(c),
      config
    );
    return this;
  }

  font(
    key: string,
    options: { value: string; label: string }[],
    label?: string,
    config?: FieldConfigOptions
  ): this {
    this.pushField({
      key,
      kind: 'font',
      label: label ?? key,
      options,
    });
    this.applyConfigToLast(config);
    return this;
  }

  color(key: string, label?: string, config?: FieldConfigOptions): this {
    this.pushField({ key, kind: 'color', label: label ?? key });
    this.applyConfigToLast(config);
    return this;
  }

  richText(key: string, label?: string, config?: FieldConfigOptions): this {
    this.pushField({ key, kind: 'richText', label: label ?? key });
    this.applyConfigToLast(config);
    return this;
  }

  repeater(
    key: string,
    repeaterConfig: { fields: RepeaterFieldConfig[]; label?: string },
    config?: FieldConfigOptions
  ): this {
    this.pushField({
      layout: 'block',
      key,
      kind: 'repeater',
      label: repeaterConfig.label ?? key,
      repeaterFields: repeaterConfig.fields,
    });
    this.applyConfigToLast(config);
    return this;
  }

  slotList(
    key: string,
    slotListConfig: SlotListFieldConfig & { label?: string },
    config?: FieldConfigOptions
  ): this {
    this.pushField({
      layout: 'block',
      key,
      kind: 'slotList',
      label: slotListConfig.label ?? key,
      slotList: {
        fields: slotListConfig.fields,
        newPart: slotListConfig.newPart,
      },
    });
    this.applyConfigToLast(config);
    return this;
  }

  image(
    key: string,
    label?: string,
    uploadCommandId?: string,
    config?: FieldConfigOptions
  ): this {
    this.pushField({
      key,
      kind: 'image',
      label: label ?? key,
      uploadCommandId,
    });
    this.applyConfigToLast(config);
    return this;
  }

  border(key: string, label?: string, config?: FieldConfigOptions): this {
    this.pushField({
      layout: 'block',
      key,
      kind: 'border',
      label: label ?? key,
    });
    this.applyConfigToLast(config);
    return this;
  }

  cornerRadius(key: string, label?: string, config?: FieldConfigOptions): this {
    this.pushField({ key, kind: 'cornerRadius', label: label ?? key });
    this.applyConfigToLast(config);
    return this;
  }

  padding(key: string, label?: string, config?: FieldConfigOptions): this {
    this.pushField({ key, kind: 'padding', label: label ?? key });
    this.applyConfigToLast(config);
    return this;
  }

  shadow(key: string, label?: string, config?: FieldConfigOptions): this {
    this.pushField({ key, kind: 'shadow', label: label ?? key });
    this.applyConfigToLast(config);
    return this;
  }

  align(key: string, label?: string, config?: FieldConfigOptions): this {
    this.pushField({
      key,
      kind: 'align',
      label: label ?? key,
      options: DEFAULT_ALIGN_OPTIONS,
    });
    this.applyConfigToLast(config);
    return this;
  }

  field(descriptor: PropertyFieldDescriptor): this {
    this.pushField(descriptor);
    diagnosePropertyFieldDescriptor(descriptor);
    return this;
  }

  withNumeric(config: NumericFieldConfig): this {
    const field = this.getLastField();
    if (field) {
      field.numeric = config;
      diagnosePropertyFieldDescriptor(field);
    }
    return this;
  }

  withPopup(
    icon: string,
    build: (builder: PopupFieldsBuilder) => void,
    title?: string
  ): this {
    const popupBuilder = createPopupFieldsBuilder();
    build(popupBuilder);
    const field = this.getLastField();
    if (field) {
      field.popup = { fields: popupBuilder.build(), icon, title };
      diagnosePropertyFieldDescriptor(field);
    }
    return this;
  }

  withActions(actions: FieldAction[]): this {
    const field = this.getLastField();
    if (field) {
      field.actions = actions;
      diagnosePropertyFieldDescriptor(field);
    }
    return this;
  }

  build(): PropertySectionDescriptor[] {
    return this.builder.build();
  }

  private pushField(field: PropertyFieldDescriptor): void {
    this.section.fields.push(field);
  }

  private getLastField(): PropertyFieldDescriptor | null {
    if (this.section.fields.length === 0) {
      return null;
    }
    return this.section.fields.at(-1) ?? null;
  }

  private applyConfigToLast(config?: FieldConfigOptions): void {
    const field = this.getLastField();
    if (field) {
      applyFieldConfig(field, config);
      diagnosePropertyFieldDescriptor(field);
    }
  }
}

export function createPropertyBuilder(): PropertyBuilder {
  return new PropertyBuilder();
}

export type {
  FieldAction,
  FieldActionClick,
  FieldConfigOptions,
  NumericFieldConfig,
  PopupFieldConfig,
  PropertyFieldLayout,
  CornerRadiusValue,
  PaddingValue,
  ShadowValue,
} from './field-config';
export {
  DEFAULT_CORNER_RADIUS,
  DEFAULT_PADDING,
  DEFAULT_SHADOW,
  normalizeCornerRadius,
  normalizePadding,
  uniformCornerRadius,
  uniformPadding,
} from './field-config';
export {
  createPopupFieldsBuilder,
  PopupFieldsBuilder,
} from './popup-fields-builder';
