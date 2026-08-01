import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { TextInput } from './text-input';

describe(TextInput, () => {
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('commits immediately without debounce', () => {
    const onChange = vi.fn();
    render(<TextInput id="url" onChange={onChange} value="" />);

    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'https://a.com' },
    });

    expect(onChange).toHaveBeenCalledExactlyOnceWith('https://a.com');
  });

  it('debounces commits and flushes on blur', () => {
    vi.useFakeTimers();
    const onChange = vi.fn();
    render(
      <TextInput debounceMs={300} id="url" onChange={onChange} value="" />
    );

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'https://a.com' } });
    fireEvent.change(input, { target: { value: 'https://ab.com' } });

    expect(onChange).not.toHaveBeenCalled();

    vi.advanceTimersByTime(300);
    expect(onChange).toHaveBeenCalledExactlyOnceWith('https://ab.com');

    onChange.mockClear();
    fireEvent.change(input, { target: { value: 'https://abc.com' } });
    fireEvent.blur(input);

    expect(onChange).toHaveBeenCalledExactlyOnceWith('https://abc.com');
  });

  it('flushes a pending debounced commit on unmount', () => {
    vi.useFakeTimers();
    const onChange = vi.fn();
    const { unmount } = render(
      <TextInput debounceMs={300} id="url" onChange={onChange} value="" />
    );

    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'https://pending.com' },
    });
    expect(onChange).not.toHaveBeenCalled();

    unmount();
    expect(onChange).toHaveBeenCalledExactlyOnceWith('https://pending.com');
  });

  it('keeps typing after a debounced commit flushes', () => {
    vi.useFakeTimers();
    const onChange = vi.fn();
    const { rerender } = render(
      <TextInput debounceMs={300} id="url" onChange={onChange} value="" />
    );

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'a' } });
    vi.advanceTimersByTime(300);
    expect(onChange).toHaveBeenCalledExactlyOnceWith('a');

    fireEvent.change(input, { target: { value: 'ab' } });
    rerender(
      <TextInput debounceMs={300} id="url" onChange={onChange} value="a" />
    );

    expect((input as HTMLInputElement).value).toBe('ab');

    vi.advanceTimersByTime(300);
    expect(onChange).toHaveBeenLastCalledWith('ab');
  });
});
