import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { NumericInput } from './numeric-input';

describe(NumericInput, () => {
  afterEach(() => {
    cleanup();
  });

  it('displays rounded whole numbers when precision is 0', () => {
    render(
      <NumericInput onChange={() => {}} precision={0} scrub value={12.6} />
    );
    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input.value).toBe('13');
  });

  it('shows the raw value when precision is not set', () => {
    render(<NumericInput onChange={() => {}} value={12.6} />);
    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input.value).toBe('12.6');
  });
});
