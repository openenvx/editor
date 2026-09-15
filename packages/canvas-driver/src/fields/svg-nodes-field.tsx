import type { PropertyFieldDescriptor } from '@openenvx/core';
import { useState, type ReactNode } from 'react';

import {
  editableAttrsForTag,
  parseSvgElements,
  setSvgElementAttrs,
} from '../svg/svg-node-list';

import styles from './svg-nodes-field.module.css';

interface SvgNodesFieldProps {
  field: PropertyFieldDescriptor;
  value: unknown;
  layerId: string;
  layerData: Record<string, unknown>;
  onUpdate: (key: string, value: unknown) => void;
  onCommand: (commandId: string) => void;
  renderField: (props: Omit<SvgNodesFieldProps, 'renderField'>) => ReactNode;
}

function labelForNode(tag: string, index: number, id?: string): string {
  return id ? `${index}: <${tag}> #${id}` : `${index}: <${tag}>`;
}

export function SvgNodesFieldRenderer({
  field,
  value,
  layerId,
  onUpdate,
}: SvgNodesFieldProps) {
  const markup = String(value ?? '');
  const nodes = parseSvgElements(markup);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const safeIndex =
    nodes.length === 0 ? 0 : Math.min(selectedIndex, nodes.length - 1);
  const selected = nodes[safeIndex];
  const editableKeys = selected ? editableAttrsForTag(selected.tag) : [];
  const selectId = `owb-prop-${layerId}-${field.key}-node`;

  if (nodes.length === 0) {
    return (
      <p className={styles.empty}>No SVG elements to edit in this markup.</p>
    );
  }

  return (
    <div className={styles.root}>
      <label className={styles.row} htmlFor={selectId}>
        <span className={styles.label}>Node</span>
        <select
          className={styles.control}
          id={selectId}
          onChange={(event) => {
            setSelectedIndex(Number(event.target.value));
          }}
          value={String(safeIndex)}
        >
          {nodes.map((node) => (
            <option key={node.index} value={String(node.index)}>
              {labelForNode(node.tag, node.index, node.attrs.id)}
            </option>
          ))}
        </select>
      </label>
      {selected
        ? editableKeys.map((attr) => {
            const inputId = `owb-prop-${layerId}-${field.key}-${attr}`;
            return (
              <label className={styles.row} htmlFor={inputId} key={attr}>
                <span className={styles.label}>{attr}</span>
                <input
                  className={styles.control}
                  id={inputId}
                  onChange={(event) => {
                    const next = setSvgElementAttrs(markup, selected.index, {
                      [attr]: event.target.value,
                    });
                    onUpdate(field.key, next);
                  }}
                  spellCheck={false}
                  type="text"
                  value={selected.attrs[attr] ?? ''}
                />
              </label>
            );
          })
        : null}
    </div>
  );
}
