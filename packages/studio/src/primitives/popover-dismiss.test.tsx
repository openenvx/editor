import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import { ThemeProvider } from '../context/theme-context';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './popover';

afterEach(cleanup);

describe('Popover dismiss', () => {
  it('closes on outside pointerdown with closeOnTriggerClick=false', async () => {
    const user = userEvent.setup();

    function InspectorLikePopover() {
      const [open, setOpen] = useState(false);
      return (
        <ThemeProvider theme="light">
          <Popover closeOnTriggerClick={false} onOpenChange={setOpen} open={open}>
            <PopoverTrigger>
              <button type="button">Color</button>
            </PopoverTrigger>
            <PopoverContent>
              <div>Picker</div>
            </PopoverContent>
          </Popover>
          <div data-testid="canvas">Canvas</div>
        </ThemeProvider>
      );
    }

    render(<InspectorLikePopover />);

    await user.click(screen.getByRole('button', { name: 'Color' }));
    await waitFor(() => {
      expect(screen.getByText('Picker')).toBeTruthy();
    });

    await user.click(screen.getByTestId('canvas'));
    await waitFor(() => {
      expect(screen.queryByText('Picker')).toBeNull();
    });
  });

  it('closes combobox-style popover on outside click', async () => {
    const user = userEvent.setup();

    function ComboboxLikePopover() {
      const [open, setOpen] = useState(false);
      return (
        <ThemeProvider theme="light">
          <Popover onOpenChange={setOpen} open={open}>
            <PopoverTrigger>
              <button type="button">Select</button>
            </PopoverTrigger>
            <PopoverContent>
              <div>Options</div>
            </PopoverContent>
          </Popover>
          <div data-testid="canvas">Canvas</div>
        </ThemeProvider>
      );
    }

    render(<ComboboxLikePopover />);

    await user.click(screen.getByRole('button', { name: 'Select' }));
    await waitFor(() => {
      expect(screen.getByText('Options')).toBeTruthy();
    });

    await user.click(screen.getByTestId('canvas'));
    await waitFor(() => {
      expect(screen.queryByText('Options')).toBeNull();
    });
  });
});
