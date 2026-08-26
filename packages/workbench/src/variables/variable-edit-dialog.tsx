import {
  nextVariableKey,
  sceneVariables,
  validateVariableKeyForCatalog,
  type TemplateVariable,
} from '@openenvx/core/schema';
import {
  memo,
  useCallback,
  useEffect,
  useId,
  useState,
  type HTMLAttributes,
} from 'react';

import { useWorkbenchContext } from '../context/workbench-context';
import { useWorkbenchContextSelector } from '../hooks/use-workbench-selector';
import { useWorkbenchTranslation } from '../i18n/use-workbench-translation';
import { Button } from '../primitives/button';
import { Input } from '../primitives/input';
import { ModalDialog } from '../primitives/modal-dialog';
import { PropertyFieldRow } from '../primitives/property-field-row';
import type { WorkbenchDialogProps } from '../renderers/dialog-host';

import styles from './variable-edit-dialog.module.css';

export const WORKBENCH_VARIABLES_EDIT_DIALOG_ID = 'workbench.variables.edit';

export type VariableEditPayload =
  | { mode: 'create' }
  | { mode: 'edit'; variable: TemplateVariable };

export const VariableEditDialog = memo(
  ({ open, payload, onClose }: WorkbenchDialogProps<VariableEditPayload>) => {
    const { api, executeCommand } = useWorkbenchContext();
    const scene = useWorkbenchContextSelector((state) => state.scene);
    const { t } = useWorkbenchTranslation();
    const titleId = useId();
    const [keyDraft, setKeyDraft] = useState('');
    const [labelDraft, setLabelDraft] = useState('');
    const [sampleDraft, setSampleDraft] = useState('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
      if (!open || !payload) {
        return;
      }
      const existingVariables = scene ? sceneVariables(scene) : [];
      if (payload.mode === 'edit') {
        setKeyDraft(payload.variable.key);
        setLabelDraft(payload.variable.label ?? '');
        setSampleDraft(payload.variable.sample ?? '');
      } else {
        setKeyDraft(nextVariableKey(existingVariables));
        setLabelDraft('');
        setSampleDraft('');
      }
      setError(null);
    }, [open, payload, scene]);

    const handleSave = useCallback(() => {
      if (!payload) {
        return;
      }
      const existingVariables = scene ? sceneVariables(scene) : [];
      const key = keyDraft.trim();
      const editingId =
        payload.mode === 'edit' ? payload.variable.id : undefined;
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
      const patch = {
        key,
        label: labelDraft.trim() || undefined,
        sample: sampleDraft,
      };
      if (payload.mode === 'create') {
        void executeCommand('scene.addVariable', patch);
      } else {
        void executeCommand('scene.updateVariable', {
          id: payload.variable.id,
          ...patch,
        });
      }
      onClose();
    }, [
      executeCommand,
      keyDraft,
      labelDraft,
      onClose,
      payload,
      sampleDraft,
      scene,
      t,
    ]);

    const handleDelete = useCallback(async () => {
      if (payload?.mode !== 'edit') {
        return;
      }
      const ok = await api.showConfirm({
        cancelLabel: t('confirm.cancel'),
        confirmLabel: t('variables.delete'),
        description: t('variables.deleteConfirmDescription'),
        title: t('variables.deleteConfirmTitle'),
      });
      if (!ok) {
        return;
      }
      void executeCommand('scene.removeVariable', { id: payload.variable.id });
      onClose();
    }, [api, executeCommand, onClose, payload, t]);

    if (!payload) {
      return null;
    }

    const title =
      payload.mode === 'edit'
        ? t('variables.editTitle')
        : t('variables.createTitle');

    return (
      <ModalDialog
        contentClassName={styles.dialog}
        dialogProps={
          {
            'data-openenvx-variable-dialog': '',
          } as HTMLAttributes<HTMLDivElement>
        }
        onClose={onClose}
        open={open}
        title={title}
        titleId={titleId}
        footer={
          <div className={styles.footer}>
            {payload.mode === 'edit' ? (
              <Button onClick={handleDelete} size="sm" variant="outline">
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
        }
      >
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
      </ModalDialog>
    );
  }
);

VariableEditDialog.displayName = 'VariableEditDialog';
