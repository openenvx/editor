import { LocalizationServiceImpl } from '#studio';
import { describe, expect, it } from 'vitest';

import { localizeWorkbench } from './localize-workbench';
import { registerWorkbenchLocalizationBundles } from './workbench-i18n';

describe('localizeWorkbench', () => {
  it('resolves keys after workbench bundles are registered', () => {
    const service = new LocalizationServiceImpl();
    registerWorkbenchLocalizationBundles(service);

    expect(localizeWorkbench({ get: () => service, has: () => true } as never, 'variables.editTitle')).toBe(
      'Edit variable'
    );
  });
});
