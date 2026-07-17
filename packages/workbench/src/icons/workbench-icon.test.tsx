import { IconRegistryImpl } from '@openenvx/core';
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { WorkbenchProvider } from '../context/workbench-context';
import { createMockWorkbenchApi } from '../test/mock-workbench-context';
import { LUCIDE_GLYPHS } from './lucide-glyphs';
import { WorkbenchIcon } from './workbench-icon';

afterEach(cleanup);

describe('WorkbenchIcon', () => {
  it('resolves default glyphs without IconRegistry bootstrap', () => {
    const { api } = createMockWorkbenchApi();
    const { container } = render(
      <WorkbenchProvider api={api}>
        <WorkbenchIcon id="layers" />
      </WorkbenchProvider>
    );

    expect(container.querySelector('svg')).toBeTruthy();
    expect(LUCIDE_GLYPHS.layers).toBeDefined();
  });

  it('prefers registry overrides over bundled defaults', () => {
    const registry = new IconRegistryImpl();
    const CustomIcon = () => <svg data-testid="custom-icon" />;
    registry.register('layers', CustomIcon);

    const { api } = createMockWorkbenchApi();
    api.getService = () => registry;

    const { getByTestId } = render(
      <WorkbenchProvider api={api}>
        <WorkbenchIcon id="layers" />
      </WorkbenchProvider>
    );

    expect(getByTestId('custom-icon')).toBeTruthy();
  });
});
