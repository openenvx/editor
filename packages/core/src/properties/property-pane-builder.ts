import {
  createPopupFieldsBuilder,
  type FieldAction,
  type NumericFieldConfig,
  type PopupFieldsBuilder,
  type PropertyFieldDescriptor,
} from '../backbone';
import { PropertyBlockNode } from './property-block-node';
import { diagnosePropertyFieldDescriptor } from './property-field-diagnostic';
import { PropertyInputGroupNode } from './property-input-group-node';
import type { PropertyLayoutNode } from './property-layout-node';
import type { PropertyLayoutWhenOptions } from './property-layout-when-options';
import { PropertyPaneDescriptor } from './property-pane-descriptor';
import { PropertyRowNode } from './property-row-node';
import type {
  PropertyInputGroupCell,
  PropertyValuePath,
} from './property-value-path';

function diagnoseField(field: PropertyFieldDescriptor): void {
  diagnosePropertyFieldDescriptor(field);
}

function getLastRowField(
  nodes: PropertyLayoutNode[]
): PropertyFieldDescriptor | null {
  const last = nodes.at(-1);
  if (last instanceof PropertyRowNode) {
    return last.field;
  }
  return null;
}

function resolveRowWhen(
  field: PropertyFieldDescriptor,
  options?: PropertyLayoutWhenOptions
): string | undefined {
  return options?.when ?? field.when;
}

/** Shared layout surface for pane + nested block builders. */
export class PropertyBlockBuilder {
  readonly nodes: PropertyLayoutNode[] = [];

  row(
    label: string,
    field: PropertyFieldDescriptor,
    path?: PropertyValuePath,
    options?: PropertyLayoutWhenOptions
  ): this {
    this.nodes.push(
      new PropertyRowNode(label, field, path, resolveRowWhen(field, options))
    );
    diagnoseField(field);
    return this;
  }

  inputGroup(
    blockLabel: string,
    cells: PropertyInputGroupCell[],
    options?: PropertyLayoutWhenOptions
  ): this {
    for (const cell of cells) {
      diagnoseField(cell.field);
    }
    this.nodes.push(
      new PropertyInputGroupNode(blockLabel, cells, options?.when)
    );
    return this;
  }

  withNumeric(config: NumericFieldConfig): this {
    const field = getLastRowField(this.nodes);
    if (field) {
      field.numeric = config;
      diagnoseField(field);
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
    const field = getLastRowField(this.nodes);
    if (field) {
      field.popup = { fields: popupBuilder.build(), icon, title };
      diagnoseField(field);
    }
    return this;
  }

  withActions(actions: FieldAction[]): this {
    const field = getLastRowField(this.nodes);
    if (field) {
      field.actions = actions;
      diagnoseField(field);
    }
    return this;
  }
}

export class PropertyPaneBuilder {
  private readonly nodes: PropertyLayoutNode[] = [];
  private whenClause?: string;
  private panePriority?: number;
  private headerTogglePath?: PropertyValuePath;

  constructor(
    private readonly id: string,
    private readonly title: string
  ) {}

  when(clause: string): this {
    this.whenClause = clause;
    return this;
  }

  priority(value: number): this {
    this.panePriority = value;
    return this;
  }

  /** Master enable switch in the section header (Smart Stacking–style). */
  headerToggle(path: PropertyValuePath): this {
    this.headerTogglePath = path;
    return this;
  }

  row(
    label: string,
    field: PropertyFieldDescriptor,
    path?: PropertyValuePath,
    options?: PropertyLayoutWhenOptions
  ): this {
    this.nodes.push(
      new PropertyRowNode(label, field, path, resolveRowWhen(field, options))
    );
    diagnoseField(field);
    return this;
  }

  inputGroup(
    blockLabel: string,
    cells: PropertyInputGroupCell[],
    options?: PropertyLayoutWhenOptions
  ): this {
    for (const cell of cells) {
      diagnoseField(cell.field);
    }
    this.nodes.push(
      new PropertyInputGroupNode(blockLabel, cells, options?.when)
    );
    return this;
  }

  block(
    label: string,
    build: (builder: PropertyBlockBuilder) => void,
    options?: PropertyLayoutWhenOptions
  ): this {
    const blockBuilder = new PropertyBlockBuilder();
    build(blockBuilder);
    this.nodes.push(
      new PropertyBlockNode(label, blockBuilder.nodes, options?.when)
    );
    return this;
  }

  withNumeric(config: NumericFieldConfig): this {
    const field = getLastRowField(this.nodes);
    if (field) {
      field.numeric = config;
      diagnoseField(field);
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
    const field = getLastRowField(this.nodes);
    if (field) {
      field.popup = { fields: popupBuilder.build(), icon, title };
      diagnoseField(field);
    }
    return this;
  }

  withActions(actions: FieldAction[]): this {
    const field = getLastRowField(this.nodes);
    if (field) {
      field.actions = actions;
      diagnoseField(field);
    }
    return this;
  }

  build(): PropertyPaneDescriptor {
    return new PropertyPaneDescriptor(
      this.id,
      this.title,
      [...this.nodes],
      this.whenClause,
      this.panePriority,
      this.headerTogglePath
    );
  }
}

export function createPropertyPane(
  id: string,
  title: string
): PropertyPaneBuilder {
  return new PropertyPaneBuilder(id, title);
}
