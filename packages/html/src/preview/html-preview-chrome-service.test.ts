import { createContextKeyService } from '@openenvx/core';
import { describe, expect, it } from 'vitest';

import { HTML_ZOOM_MAX, HTML_ZOOM_MIN } from '../editor/html-device-preview';
import { HtmlPreviewChromeServiceImpl } from './html-preview-chrome-service';

describe('HtmlPreviewChromeService', () => {
  it('seedPreset applies once and ignores remount reseeds', () => {
    const chrome = new HtmlPreviewChromeServiceImpl();
    chrome.seedPreset('desktop');
    expect(chrome.getState().preset).toBe('desktop');
    expect(chrome.getState().autoZoom).toBe(true);

    chrome.zoomPercent(0.5);
    chrome.seedPreset('mobile');
    expect(chrome.getState().preset).toBe('desktop');
    expect(chrome.getState().manualZoom).toBe(0.5);
    expect(chrome.getState().autoZoom).toBe(false);
  });

  it('syncs canZoom context keys at limits', () => {
    const chrome = new HtmlPreviewChromeServiceImpl();
    const keys = createContextKeyService();
    chrome.bindContextKeys(keys);
    chrome.setActive(true);
    chrome.zoomPercent(HTML_ZOOM_MAX);

    expect(keys.get('html.canZoomIn')).toBe(false);
    expect(keys.get('html.canZoomOut')).toBe(true);
    expect(keys.get('html.zoomLabel')).toBe('200%');

    chrome.zoomPercent(HTML_ZOOM_MIN);
    expect(keys.get('html.canZoomIn')).toBe(true);
    expect(keys.get('html.canZoomOut')).toBe(false);
  });
});
