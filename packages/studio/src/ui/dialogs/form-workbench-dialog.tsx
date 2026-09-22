import { useCallback, useEffect, useId, useMemo, useState } from 'react';

import type { ConfirmDialogOptions, FormDialogPayload } from '#studio';

import { useWorkbenchContext } from '../../context/workbench-context';
import { useWorkbenchContextSelector } from '../../hooks/use-workbench-selector';
import { useWorkbenchTranslation } from '../../i18n/use-workbench-translation';
import { createDraftPropertyHostContext } from '../../properties/draft-property-host-context';
import { Button } from '../primitives/button';
import { ConfirmDialog } from '../primitives/confirm-dialog';
import { ModalDialog } from '../primitives/modal-dialog';
import { PropertyContentRenderer } from '../renderers/property-content-renderer';

import styles from './form-workbench-dialog.module.css';

export interface FormWorkbenchDialogProps {
  open: boolean;
  payload: FormDialogPayload;
  onClose: () => void;
}

export function FormWorkbenchDialog({
  open,
  payload,
  onClose,
}: FormWorkbenchDialogProps) {
  const { api } = useWorkbenchContext();
  const { t } = useWorkbenchTranslation();
  const titleId = useId();
  const fieldRenderers =
    useWorkbenchContextSelector((state) => state.fieldRenderers) ?? [];
  const [draftValues, setDraftValues] = useState(payload.values);
  const [pendingConfirm, setPendingConfirm] =
    useState<ConfirmDialogOptions | null>(null);
  const [pendingActionId, setPendingActionId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    setDraftValues({ ...payload.values });
    setPendingConfirm(null);
    setPendingActionId(null);
  }, [open, payload.title, payload.values]);

  useEffect(() => {
    if (!open || !payload.error) {
      return;
    }
    api.patchDialogFormPayload({ error: null });
  }, [api, draftValues, open, payload.error]);

  const hostContext = useMemo(
    () => createDraftPropertyHostContext(draftValues, setDraftValues),
    [draftValues]
  );

  const handleSubmit = useCallback(() => {
    api.resolveDialogForm({ action: 'submit', values: draftValues });
  }, [api, draftValues]);

  const handleExtraAction = useCallback(
    (actionId: string, confirm?: ConfirmDialogOptions) => {
      if (confirm) {
        setPendingActionId(actionId);
        setPendingConfirm(confirm);
        return;
      }
      api.resolveDialogForm({ action: actionId, values: draftValues });
    },
    [api, draftValues]
  );

  const handleConfirmExtra = useCallback(() => {
    if (pendingActionId) {
      api.resolveDialogForm({ action: pendingActionId, values: draftValues });
    }
    setPendingConfirm(null);
    setPendingActionId(null);
  }, [api, draftValues, pendingActionId]);

  const handleCancelExtraConfirm = useCallback(() => {
    setPendingConfirm(null);
    setPendingActionId(null);
  }, []);

  const extraActions = payload.extraActions ?? [];
  const leftExtra = extraActions.at(0);

  return (
    <>
      <ModalDialog
        contentClassName={styles.dialog}
        onClose={onClose}
        open={open}
        title={payload.title}
        titleId={titleId}
        footer={
          <div className={styles.footer}>
            {leftExtra ? (
              <Button
                onClick={() =>
                  handleExtraAction(leftExtra.id, leftExtra.confirm)
                }
                size="sm"
                variant={leftExtra.variant ?? 'outline'}
              >
                {leftExtra.label}
              </Button>
            ) : (
              <span />
            )}
            <div className={styles.footerActions}>
              <Button onClick={onClose} size="sm" variant="outline">
                {payload.cancelLabel ?? t('confirm.cancel')}
              </Button>
              <Button onClick={handleSubmit} size="sm">
                {payload.submitLabel ?? t('form.submit')}
              </Button>
            </div>
          </div>
        }
      >
        <div className={styles.form}>
          <PropertyContentRenderer
            fieldRenderers={fieldRenderers}
            hostContext={hostContext}
            layerData={draftValues}
            layerId="__draft__"
            nodes={payload.nodes}
            onCommand={() => {}}
          />
          {payload.error ? (
            <p className={styles.error}>{payload.error}</p>
          ) : null}
        </div>
      </ModalDialog>
      {pendingConfirm ? (
        <ConfirmDialog
          cancelLabel={pendingConfirm.cancelLabel}
          confirmLabel={pendingConfirm.confirmLabel}
          description={pendingConfirm.description}
          onCancel={handleCancelExtraConfirm}
          onConfirm={handleConfirmExtra}
          open
          title={pendingConfirm.title}
        />
      ) : null}
    </>
  );
}
