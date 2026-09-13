import { LocalizationServiceId } from '@openenvx/core';
import { useWorkbenchContext } from '@openenvx/core/react';
import { useMemo } from 'react';

const DEFAULT_MISSING_TIP =
  'Add a fallback value to avoid empty personalization';
const DEFAULT_PICKER_TITLE = 'Template variables';
const DEFAULT_CREATE = 'Create variable';

export function useVariableChipLabels() {
  const { api } = useWorkbenchContext();
  return useMemo(() => {
    const localization = api.getService(LocalizationServiceId);
    const t = (key: string, defaultValue: string) =>
      localization?.t(key, { defaultValue }) ?? defaultValue;
    return {
      missingTip: t('variables.missingFallbackTip', DEFAULT_MISSING_TIP),
      pickerTitle: t('variables.pickerTitle', DEFAULT_PICKER_TITLE),
      createVariable: t('variables.create', DEFAULT_CREATE),
    };
  }, [api]);
}
