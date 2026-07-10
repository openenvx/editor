import type {
  FieldAction,
  FieldConfigOptions,
  NumericFieldConfig,
  PopupFieldConfig,
  PropertyFieldOption,
} from './field-config';
import { applyFieldConfig, DEFAULT_ALIGN_OPTIONS } from './field-config';
import { createPopupFieldsBuilder } from './popup-fields-builder';
import type { PopupFieldsBuilder } from './popup-fields-builder';

export type PropertyFieldKind =
  | 'text'
  | 'number'
  | 'toggle'
  | 'select'
  | 'font'
  | 'color'
  | 'richText'
  | 'repeater'
  | 'image'
  | 'border'
  | 'cornerRadius'
  | 'padding'
  | 'shadow'
  | 'align'
  | string;

export interface RepeaterFieldConfig {
  key: string;
  kind: Exclude<PropertyFieldKind, 'repeater'>;
  label: string;
  options?: { value: string; label: string }[];
}

export type { PropertyFieldOption } from './field-config';

export interface PropertyFieldDescriptor {
  key: string;
  kind: PropertyFieldKind;
  label: string;
  icon?: string;
  chrome?: boolean;
  options?: PropertyFieldOption[];
  repeaterFields?: RepeaterFieldConfig[];
  uploadCommandId?: string;
  numeric?: NumericFieldConfig;
  popup?: PopupFieldConfig;
  actions?: FieldAction[];
}

export interface PropertySectionDescriptor {
  id: string;
  label?: string;
  fields: PropertyFieldDescriptor[];
}

interface FieldHost {
  pushField(field: PropertyFieldDescriptor): void;
  getLastField(): PropertyFieldDescriptor | null;
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

  select(
    key: string,
    options: { value: string; label: string }[],
    label?: string,
    config?: FieldConfigOptions
  ): this {
    this.pushField({
      key,
      kind: 'select',
      label: label ?? key,
      options,
    });
    this.applyConfigToLast(config);
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
      chrome: false,
      key,
      kind: 'repeater',
      label: repeaterConfig.label ?? key,
      repeaterFields: repeaterConfig.fields,
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
    this.pushField({ chrome: false, key, kind: 'border', label: label ?? key });
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
    return this;
  }

  withNumeric(config: NumericFieldConfig): this {
    const field = this.getLastField();
    if (field) {
      field.numeric = config;
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
    }
    return this;
  }

  withActions(actions: FieldAction[]): this {
    const field = this.getLastField();
    if (field) {
      field.actions = actions;
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

  select(
    key: string,
    options: { value: string; label: string }[],
    label?: string,
    config?: FieldConfigOptions
  ): this {
    this.pushField({
      key,
      kind: 'select',
      label: label ?? key,
      options,
    });
    this.applyConfigToLast(config);
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
      chrome: false,
      key,
      kind: 'repeater',
      label: repeaterConfig.label ?? key,
      repeaterFields: repeaterConfig.fields,
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
    this.pushField({ chrome: false, key, kind: 'border', label: label ?? key });
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
    return this;
  }

  withNumeric(config: NumericFieldConfig): this {
    const field = this.getLastField();
    if (field) {
      field.numeric = config;
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
    }
    return this;
  }

  withActions(actions: FieldAction[]): this {
    const field = this.getLastField();
    if (field) {
      field.actions = actions;
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
