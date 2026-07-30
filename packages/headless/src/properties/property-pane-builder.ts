import {
  createPopupFieldsBuilder,
  type FieldAction,
  type NumericFieldConfig,
  type PopupFieldsBuilder,
  type PropertyFieldDescriptor,
} from '@openenvx/core';

import { PropertyBlockNode } from './property-block-node';
import { PropertyInputGroupNode } from './property-input-group-node';
import type { PropertyLayoutNode } from './property-layout-node';
import { PropertyPaneDescriptor } from './property-pane-descriptor';
import { PropertyRowNode } from './property-row-node';
import type {
  PropertyInputGroupCell,
  PropertyValuePath,
} from './property-value-path';

function getLastRowField(
  nodes: PropertyLayoutNode[]
): PropertyFieldDescriptor | null {
  const last = nodes.at(-1);
  if (last instanceof PropertyRowNode) {
    return last.field;
  }
  return null;
}

/** Shared layout surface for pane + nested block builders. */
export class PropertyBlockBuilder {
  readonly nodes: PropertyLayoutNode[] = [];

  row(
    label: string,
    field: PropertyFieldDescriptor,
    path?: PropertyValuePath
  ): this {
    this.nodes.push(new PropertyRowNode(label, field, path));
    return this;
  }

  inputGroup(blockLabel: string, cells: PropertyInputGroupCell[]): this {
    this.nodes.push(new PropertyInputGroupNode(blockLabel, cells));
    return this;
  }

  withNumeric(config: NumericFieldConfig): this {
    const field = getLastRowField(this.nodes);
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
    const field = getLastRowField(this.nodes);
    if (field) {
      field.popup = { fields: popupBuilder.build(), icon, title };
    }
    return this;
  }

  withActions(actions: FieldAction[]): this {
    const field = getLastRowField(this.nodes);
    if (field) {
      field.actions = actions;
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
    path?: PropertyValuePath
  ): this {
    this.nodes.push(new PropertyRowNode(label, field, path));
    return this;
  }

  inputGroup(blockLabel: string, cells: PropertyInputGroupCell[]): this {
    this.nodes.push(new PropertyInputGroupNode(blockLabel, cells));
    return this;
  }

  block(label: string, build: (builder: PropertyBlockBuilder) => void): this {
    const blockBuilder = new PropertyBlockBuilder();
    build(blockBuilder);
    this.nodes.push(new PropertyBlockNode(label, blockBuilder.nodes));
    return this;
  }

  withNumeric(config: NumericFieldConfig): this {
    const field = getLastRowField(this.nodes);
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
    const field = getLastRowField(this.nodes);
    if (field) {
      field.popup = { fields: popupBuilder.build(), icon, title };
    }
    return this;
  }

  withActions(actions: FieldAction[]): this {
    const field = getLastRowField(this.nodes);
    if (field) {
      field.actions = actions;
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
