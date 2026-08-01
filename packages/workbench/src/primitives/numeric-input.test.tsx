import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

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

  it('steps with arrow keys', () => {
    const onChange = vi.fn();
    render(<NumericInput onChange={onChange} precision={0} value={12} />);
    const input = screen.getByRole('textbox');

    fireEvent.keyDown(input, { key: 'ArrowUp' });
    expect(onChange).toHaveBeenLastCalledWith(13);

    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(onChange).toHaveBeenLastCalledWith(11);

    fireEvent.keyDown(input, { key: 'ArrowUp', shiftKey: true });
    expect(onChange).toHaveBeenLastCalledWith(22);
  });
});
