import type { PropertyFieldDescriptor } from '@openenvx/core';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { NumericControl } from '../inputs/basic/numeric-control';

describe('NumericControl', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders non-scrub numeric fields without native stepper controls', () => {
    const field: PropertyFieldDescriptor = {
      key: 'opacity',
      kind: 'number',
      label: 'Opacity',
    };

    render(
      <NumericControl field={field} id="opacity" onChange={() => {}} value={12} />
    );

    expect(screen.queryByRole('spinbutton')).toBeNull();
    expect((screen.getByRole('textbox') as HTMLInputElement).value).toBe('12');
  });
});
