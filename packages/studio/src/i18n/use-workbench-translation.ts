import { useTranslation } from 'react-i18next';

import { WORKBENCH_I18N_NAMESPACE } from './workbench-i18n';

export function useWorkbenchTranslation() {
  return useTranslation(WORKBENCH_I18N_NAMESPACE);
}
