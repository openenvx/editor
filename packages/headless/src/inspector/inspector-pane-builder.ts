import {
  createPopupFieldsBuilder,
  type FieldAction,
  type NumericFieldConfig,
  type PopupFieldsBuilder,
  type PropertyFieldDescriptor,
} from '@openenvx/core';

import { InspectorBlockNode } from './inspector-block-node';
import { InspectorInputGroupNode } from './inspector-input-group-node';
import type { InspectorLayoutNode } from './inspector-layout-node';
import { InspectorPaneDescriptor } from './inspector-pane-descriptor';
import { InspectorRowNode } from './inspector-row-node';
import type {
  InspectorInputGroupCell,
  InspectorValuePath,
} from './inspector-value-path';

function getLastRowField(
  nodes: InspectorLayoutNode[]
): PropertyFieldDescriptor | null {
  const last = nodes.at(-1);
  if (last instanceof InspectorRowNode) {
    return last.field;
  }
  return null;
}

class InspectorBlockBuilder {
  readonly nodes: InspectorLayoutNode[] = [];

  row(
    label: string,
    field: PropertyFieldDescriptor,
    path?: InspectorValuePath
  ): this {
    this.nodes.push(new InspectorRowNode(label, field, path));
    return this;
  }

  inputGroup(blockLabel: string, cells: InspectorInputGroupCell[]): this {
    this.nodes.push(new InspectorInputGroupNode(blockLabel, cells));
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

export class InspectorPaneBuilder {
  private readonly nodes: InspectorLayoutNode[] = [];
  private whenClause?: string;
  private panePriority?: number;

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

  row(
    label: string,
    field: PropertyFieldDescriptor,
    path?: InspectorValuePath
  ): this {
    this.nodes.push(new InspectorRowNode(label, field, path));
    return this;
  }

  inputGroup(blockLabel: string, cells: InspectorInputGroupCell[]): this {
    this.nodes.push(new InspectorInputGroupNode(blockLabel, cells));
    return this;
  }

  block(label: string, build: (builder: InspectorBlockBuilder) => void): this {
    const blockBuilder = new InspectorBlockBuilder();
    build(blockBuilder);
    this.nodes.push(new InspectorBlockNode(label, blockBuilder.nodes));
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

  build(): InspectorPaneDescriptor {
    return new InspectorPaneDescriptor(
      this.id,
      this.title,
      [...this.nodes],
      this.whenClause,
      this.panePriority
    );
  }
}

export function createInspectorPane(
  id: string,
  title: string
): InspectorPaneBuilder {
  return new InspectorPaneBuilder(id, title);
}
