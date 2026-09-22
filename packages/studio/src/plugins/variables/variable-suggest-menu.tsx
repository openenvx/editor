import { IconDots, IconPlus } from '@tabler/icons-react';
import { memo, useCallback, useEffect, useRef } from 'react';

import { formatVariableToken, type TemplateVariable } from '#studio/schema';

import type { VariableSuggestAnchor } from './tiptap/variable-suggest-state';

import styles from './variable-suggest-menu.module.css';

export interface VariableSuggestMenuProps {
  anchor: VariableSuggestAnchor;
  variables: TemplateVariable[];
  highlightedIndex: number;
  title: string;
  createLabel: string;
  onHighlight: (index: number) => void;
  onPick: (key: string) => void;
  onCreate: () => void;
  onEdit: (id: string) => void;
  showCreate?: boolean;
  showEdit?: boolean;
}

export const VariableSuggestMenu = memo(
  ({
    anchor,
    variables,
    highlightedIndex,
    title,
    createLabel,
    onHighlight,
    onPick,
    onCreate,
    onEdit,
    showCreate = true,
    showEdit = true,
  }: VariableSuggestMenuProps) => {
    const listRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const row = listRef.current?.querySelector<HTMLElement>(
        `[data-index="${highlightedIndex}"]`
      );
      row?.scrollIntoView({ block: 'nearest' });
    }, [highlightedIndex]);

    const handleRowMouseEnter = useCallback(
      (index: number) => {
        onHighlight(index);
      },
      [onHighlight]
    );

    return (
      <div
        className={styles.menu}
        data-openenvx-variable-suggest=""
        style={{ top: anchor.top, left: anchor.left }}
      >
        <p className={styles.header}>{title}</p>
        <div className={styles.list} ref={listRef}>
          {variables.length === 0 ? (
            <p className={styles.empty}>-</p>
          ) : (
            variables.map((variable, index) => (
              <div
                className={styles.row}
                data-index={index}
                data-selected={index === highlightedIndex || undefined}
                key={variable.id}
                onMouseEnter={() => handleRowMouseEnter(index)}
              >
                <button
                  className={styles.rowButton}
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => onPick(variable.key)}
                >
                  <span className={styles.token}>
                    {formatVariableToken(variable.key)}
                  </span>
                </button>
                {showEdit ? (
                  <button
                    aria-label="Edit variable"
                    className={styles.rowMenu}
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => onEdit(variable.id)}
                  >
                    <IconDots size={14} stroke={1.5} />
                  </button>
                ) : null}
              </div>
            ))
          )}
        </div>
        {showCreate ? (
          <button
            className={styles.create}
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={onCreate}
          >
            <IconPlus aria-hidden size={14} stroke={1.5} />
            {createLabel}
          </button>
        ) : null}
      </div>
    );
  }
);

VariableSuggestMenu.displayName = 'VariableSuggestMenu';
