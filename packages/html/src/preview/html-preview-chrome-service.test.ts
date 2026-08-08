import { createContextKeyService } from '@openenvx/core';
import { describe, expect, it } from 'vitest';

import { HTML_ZOOM_MAX, HTML_ZOOM_MIN } from '../editor/html-device-preview';
import { HtmlPreviewChromeServiceImpl } from './html-preview-chrome-service';

describe('HtmlPreviewChromeService', () => {
  it('starts on initialPreset when passed to constructor', () => {
    const chrome = new HtmlPreviewChromeServiceImpl({
      initialPreset: 'desktop',
    });
    expect(chrome.getState().preset).toBe('desktop');
    chrome.seedPreset('mobile');
    expect(chrome.getState().preset).toBe('desktop');
  });

  it('seedPreset applies once and ignores remount reseeds', () => {
    const chrome = new HtmlPreviewChromeServiceImpl();
    chrome.seedPreset('desktop');
    expect(chrome.getState().preset).toBe('desktop');
    expect(chrome.getState().zoomFactor).toBe(1);

    chrome.zoomPercent(0.5);
    chrome.seedPreset('mobile');
    expect(chrome.getState().preset).toBe('desktop');
    expect(chrome.getState().zoomFactor).toBe(0.5);
  });

  it('syncs canZoom context keys at fit-width limits', () => {
    const chrome = new HtmlPreviewChromeServiceImpl();
    const keys = createContextKeyService();
    chrome.bindContextKeys(keys);
    chrome.setActive(true);
    chrome.reportFitZoom(0.5);
    chrome.zoomPercent(HTML_ZOOM_MAX);

    expect(keys.get('html.canZoomIn')).toBe(false);
    expect(keys.get('html.canZoomOut')).toBe(true);
    expect(keys.get('html.zoomLabel')).toBe('100%');
    expect(chrome.getZoom()).toBeCloseTo(0.5);

    chrome.zoomPercent(HTML_ZOOM_MIN);
    expect(keys.get('html.canZoomIn')).toBe(true);
    expect(keys.get('html.canZoomOut')).toBe(false);
    expect(keys.get('html.zoomLabel')).toBe('25%');
    expect(chrome.getZoom()).toBeCloseTo(0.125);
  });
});
