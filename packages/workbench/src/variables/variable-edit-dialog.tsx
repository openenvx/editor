import {
  nextVariableKey,
  validateVariableKeyForCatalog,
  type TemplateVariable,
} from '@openenvx/core/schema';
import { memo, useEffect, useId, useState } from 'react';

import { usePresence } from '../hooks/use-presence';
import { useWorkbenchTranslation } from '../i18n/use-workbench-translation';
import { cn } from '../lib/cn';
import { Button } from '../primitives/button';
import { Input } from '../primitives/input';
import { PropertyFieldRow } from '../primitives/property-field-row';

import overlaySurface from '../primitives/overlay-surface.module.css';
import styles from './variable-edit-dialog.module.css';

export type VariableEditMode =
  | { mode: 'create' }
  | { mode: 'edit'; variable: TemplateVariable };

export interface VariableEditDialogProps {
  open: boolean;
  editMode: VariableEditMode | null;
  existingVariables: TemplateVariable[];
  onSave: (patch: { key: string; label?: string; sample?: string }) => void;
  onDelete?: () => void;
  onClose: () => void;
}

export const VariableEditDialog = memo(
  ({
    open,
    editMode,
    existingVariables,
    onSave,
    onDelete,
    onClose,
  }: VariableEditDialogProps) => {
    const { t } = useWorkbenchTranslation();
    const { present, state } = usePresence(open);
    const titleId = useId();
    const [keyDraft, setKeyDraft] = useState('');
    const [labelDraft, setLabelDraft] = useState('');
    const [sampleDraft, setSampleDraft] = useState('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
      if (!open || !editMode) {
        return;
      }
      if (editMode.mode === 'edit') {
        setKeyDraft(editMode.variable.key);
        setLabelDraft(editMode.variable.label ?? '');
        setSampleDraft(editMode.variable.sample ?? '');
      } else {
        setKeyDraft(nextVariableKey(existingVariables));
        setLabelDraft('');
        setSampleDraft('');
      }
      setError(null);
    }, [editMode, existingVariables, open]);

    if (!present || !editMode) {
      return null;
    }

    const editingId =
      editMode.mode === 'edit' ? editMode.variable.id : undefined;
    const title =
      editMode.mode === 'edit'
        ? t('variables.editTitle')
        : t('variables.createTitle');

    const handleSave = () => {
      const key = keyDraft.trim();
      const validation = validateVariableKeyForCatalog(
        existingVariables,
        key,
        editingId
      );
      if (!validation.ok) {
        setError(
          validation.reason === 'duplicate'
            ? t('variables.duplicateKey')
            : t('variables.invalidKey')
        );
        return;
      }
      onSave({
        key,
        label: labelDraft.trim() || undefined,
        sample: sampleDraft,
      });
    };

    return (
      <div
        className={cn(styles.backdrop, overlaySurface.backdrop)}
        data-state={state}
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            onClose();
          }
        }}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            onClose();
          }
        }}
        role="presentation"
      >
        <div
          aria-labelledby={titleId}
          aria-modal="true"
          className={cn(styles.dialog, overlaySurface.surface)}
          data-state={state}
          role="dialog"
        >
          <h3 className={styles.title} id={titleId}>
            {title}
          </h3>
          <div className={styles.form}>
            <PropertyFieldRow
              htmlFor="variable-key"
              label={t('variables.keyLabel')}
            >
              <Input
                autoFocus
                id="variable-key"
                onChange={(event) => {
                  setKeyDraft(event.target.value);
                  setError(null);
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    handleSave();
                  }
                }}
                placeholder={t('variables.renamePrompt')}
                value={keyDraft}
              />
            </PropertyFieldRow>
            <PropertyFieldRow
              htmlFor="variable-label"
              label={t('variables.labelLabel')}
            >
              <Input
                id="variable-label"
                onChange={(event) => setLabelDraft(event.target.value)}
                placeholder={t('variables.labelPlaceholder')}
                value={labelDraft}
              />
            </PropertyFieldRow>
            <PropertyFieldRow
              htmlFor="variable-sample"
              label={t('variables.sampleLabel')}
            >
              <Input
                id="variable-sample"
                onChange={(event) => setSampleDraft(event.target.value)}
                placeholder={t('variables.samplePlaceholder')}
                value={sampleDraft}
              />
            </PropertyFieldRow>
            {error ? <p className={styles.error}>{error}</p> : null}
          </div>
          <div className={styles.footer}>
            {editMode.mode === 'edit' && onDelete ? (
              <Button onClick={onDelete} size="sm" variant="outline">
                {t('variables.delete')}
              </Button>
            ) : (
              <span />
            )}
            <div className={styles.footerActions}>
              <Button onClick={onClose} size="sm" variant="outline">
                {t('confirm.cancel')}
              </Button>
              <Button onClick={handleSave} size="sm">
                {t('variables.save')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

VariableEditDialog.displayName = 'VariableEditDialog';
