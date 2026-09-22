import type { FieldConfigOptions } from './field-config';
import { applyFieldConfig } from './field-config';
import type { PropertyFieldDescriptor } from './property-builder';

export class PopupFieldsBuilder {
  private readonly fields: PropertyFieldDescriptor[] = [];

  number(key: string, label?: string, config?: FieldConfigOptions): this {
    const field: PropertyFieldDescriptor = {
      key,
      kind: 'number',
      label: label ?? key,
    };
    applyFieldConfig(field, config);
    this.fields.push(field);
    return this;
  }

  color(key: string, label?: string, config?: FieldConfigOptions): this {
    const field: PropertyFieldDescriptor = {
      key,
      kind: 'color',
      label: label ?? key,
    };
    applyFieldConfig(field, config);
    this.fields.push(field);
    return this;
  }

  text(key: string, label?: string, config?: FieldConfigOptions): this {
    const field: PropertyFieldDescriptor = {
      key,
      kind: 'text',
      label: label ?? key,
    };
    applyFieldConfig(field, config);
    this.fields.push(field);
    return this;
  }

  toggle(key: string, label?: string, config?: FieldConfigOptions): this {
    const field: PropertyFieldDescriptor = {
      key,
      kind: 'toggle',
      label: label ?? key,
    };
    applyFieldConfig(field, config);
    this.fields.push(field);
    return this;
  }

  field(descriptor: PropertyFieldDescriptor): this {
    this.fields.push(descriptor);
    return this;
  }

  build(): PropertyFieldDescriptor[] {
    return [...this.fields];
  }
}

export function createPopupFieldsBuilder(): PopupFieldsBuilder {
  return new PopupFieldsBuilder();
}
