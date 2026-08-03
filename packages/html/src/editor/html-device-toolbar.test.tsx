import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { HtmlDeviceToolbar } from './html-device-toolbar';

afterEach(cleanup);

describe('HtmlDeviceToolbar', () => {
  it('selecting a zoom preset calls onZoomPercent', async () => {
    const user = userEvent.setup();
    const onZoomPercent = vi.fn();
    const onZoomAuto = vi.fn();
    render(
      <HtmlDeviceToolbar
        autoZoom={false}
        autoZoomValue={1}
        preset="fluid"
        zoom={1}
        onPresetChange={vi.fn()}
        onZoomAuto={onZoomAuto}
        onZoomIn={vi.fn()}
        onZoomOut={vi.fn()}
        onZoomPercent={onZoomPercent}
      />
    );

    await user.selectOptions(screen.getByRole('combobox', { name: 'Zoom' }), '0.25');
    expect(onZoomPercent).toHaveBeenCalledWith(0.25);
  });

  it('renders trailing content after zoom controls', () => {
    render(
      <HtmlDeviceToolbar
        autoZoom
        autoZoomValue={1}
        preset="desktop"
        trailing={<button type="button">Preview</button>}
        zoom={1}
        onPresetChange={vi.fn()}
        onZoomAuto={vi.fn()}
        onZoomIn={vi.fn()}
        onZoomOut={vi.fn()}
        onZoomPercent={vi.fn()}
      />
    );

    expect(screen.getByRole('button', { name: 'Preview' })).toBeTruthy();
  });
});
