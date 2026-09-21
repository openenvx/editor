import {
  createPropertyPane,
  PropertyPath,
  type ShowFormOptions,
  type ServiceContainer,
} from '@openenvx/studio/core';
import {
  nextVariableKey,
  sceneVariables,
  validateVariableKeyForCatalog,
  type Scene,
  type TemplateVariable,
} from '@openenvx/studio/schema';

import { localizeWorkbench } from '../../i18n/localize-workbench';

export const VARIABLE_FORM_DELETE_ACTION = 'delete';

export function buildVariableFormOptions(
  services: ServiceContainer,
  getScene: () => Scene,
  mode: 'create' | 'edit',
  variable?: TemplateVariable
): ShowFormOptions {
  const t = (key: string, defaultValue?: string) =>
    localizeWorkbench(services, key, { defaultValue });
  const existingVariables = sceneVariables(getScene());
  const initialKey =
    mode === 'edit' && variable
      ? variable.key
      : nextVariableKey(existingVariables);
  const initialSample =
    mode === 'edit' && variable ? (variable.sample ?? '') : '';

  const pane = createPropertyPane('variables.edit', t('variables.editTitle'))
    .row(
      t('variables.keyLabel'),
      {
        key: 'key',
        kind: 'text',
        label: t('variables.keyLabel'),
        placeholder: t('variables.renamePrompt'),
      },
      PropertyPath.layerData('key')
    )
    .row(
      t('variables.sampleLabel'),
      {
        key: 'sample',
        kind: 'text',
        label: t('variables.sampleLabel'),
        placeholder: t('variables.samplePlaceholder'),
      },
      PropertyPath.layerData('sample')
    )
    .build();

  const editingId = mode === 'edit' ? variable?.id : undefined;

  return {
    cancelLabel: t('confirm.cancel'),
    extraActions:
      mode === 'edit'
        ? [
            {
              confirm: {
                cancelLabel: t('confirm.cancel'),
                confirmLabel: t('variables.delete'),
                description: t('variables.deleteConfirmDescription'),
                title: t('variables.deleteConfirmTitle'),
              },
              id: VARIABLE_FORM_DELETE_ACTION,
              label: t('variables.delete'),
              variant: 'outline',
            },
          ]
        : undefined,
    nodes: pane.nodes,
    submitLabel: t('variables.save'),
    title:
      mode === 'edit' ? t('variables.editTitle') : t('variables.createTitle'),
    validate: (values) => {
      const key = String(values.key ?? '').trim();
      const validation = validateVariableKeyForCatalog(
        sceneVariables(getScene()),
        key,
        editingId
      );
      if (!validation.ok) {
        return validation.reason === 'duplicate'
          ? t('variables.duplicateKey')
          : t('variables.invalidKey');
      }
      return null;
    },
    values: {
      key: initialKey,
      sample: initialSample,
    },
  };
}
