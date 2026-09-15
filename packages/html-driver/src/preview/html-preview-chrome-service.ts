import { createServiceId, Emitter } from '@openenvx/core';
import type { ContextKeyService, Event } from '@openenvx/core';

import {
  clampHtmlZoom,
  DEFAULT_HTML_DEVICE_PRESET,
  formatHtmlZoomLabel,
  HTML_ZOOM_MAX,
  HTML_ZOOM_MIN,
  resolveEffectiveZoom,
  stepHtmlZoom,
  type HtmlDevicePreset,
} from '../editor/html-device-preview';

export interface HtmlPreviewChromeState {
  preset: HtmlDevicePreset;
  /**
   * User-facing zoom factor (0.25–1). 1 = 100% = artboard fits stage width
   * (Puck-style). Absolute CSS scale is zoomFactor * fitZoom.
   */
  zoomFactor: number;
  /** Latest fit-width scale from the active pane (stageWidth / frameWidth). */
  fitZoom: number;
}

export interface HtmlPreviewChromeService {
  readonly onDidChange: Event<void>;
  getState(): HtmlPreviewChromeState;
  /** Active while an html/email editor pane is mounted. */
  setActive(active: boolean): void;
  isActive(): boolean;
  bindContextKeys(keys: ContextKeyService | null): void;
  /** Pane reports current fit-width zoom (does not change zoomFactor). */
  reportFitZoom(fitZoom: number): void;
  /** Apply initial preset once per service lifetime (pane remounts are no-ops). */
  seedPreset(preset: HtmlDevicePreset): void;
  setPreset(preset: HtmlDevicePreset): void;
  zoomIn(): void;
  zoomOut(): void;
  /** Reset to 100% fit-width. */
  zoomAuto(): void;
  /** Set zoom factor (1 = fit-width). */
  zoomPercent(zoom: number): void;
  /** Absolute CSS scale applied to the artboard. */
  getZoom(): number;
  getZoomFactor(): number;
  getZoomLabel(): string;
}

export const HtmlPreviewChromeServiceId =
  createServiceId<HtmlPreviewChromeService>('htmlPreviewChrome');

export interface HtmlPreviewChromeServiceOptions {
  initialPreset?: HtmlDevicePreset;
}

export class HtmlPreviewChromeServiceImpl implements HtmlPreviewChromeService {
  private readonly changeEmitter = new Emitter<void>();
  readonly onDidChange: Event<void> = this.changeEmitter.event;

  private active = false;
  private seededPreset = false;
  private contextKeys: ContextKeyService | null = null;
  private state: HtmlPreviewChromeState;

  constructor(options?: HtmlPreviewChromeServiceOptions) {
    const preset = options?.initialPreset ?? DEFAULT_HTML_DEVICE_PRESET;
    this.state = {
      fitZoom: 1,
      preset,
      zoomFactor: 1,
    };
    if (options?.initialPreset) {
      this.seededPreset = true;
    }
  }

  getState(): HtmlPreviewChromeState {
    return this.state;
  }

  setActive(active: boolean): void {
    if (this.active === active) {
      return;
    }
    this.active = active;
    this.syncContextKeys();
    this.changeEmitter.fire();
  }

  isActive(): boolean {
    return this.active;
  }

  bindContextKeys(keys: ContextKeyService | null): void {
    if (this.contextKeys === keys) {
      return;
    }
    this.contextKeys = keys;
    this.syncContextKeys();
  }

  reportFitZoom(fitZoom: number): void {
    if (this.state.fitZoom === fitZoom) {
      return;
    }
    this.state = { ...this.state, fitZoom };
    this.syncContextKeys();
    this.changeEmitter.fire();
  }

  seedPreset(preset: HtmlDevicePreset): void {
    if (this.seededPreset) {
      return;
    }
    this.seededPreset = true;
    this.setPreset(preset);
  }

  setPreset(preset: HtmlDevicePreset): void {
    if (this.state.preset === preset && this.state.zoomFactor === 1) {
      return;
    }
    // Switching device resets to 100% fit-width (never overflow sideways).
    this.state = { ...this.state, preset, zoomFactor: 1 };
    this.syncContextKeys();
    this.changeEmitter.fire();
  }

  zoomIn(): void {
    this.state = {
      ...this.state,
      zoomFactor: stepHtmlZoom(this.state.zoomFactor, 1),
    };
    this.syncContextKeys();
    this.changeEmitter.fire();
  }

  zoomOut(): void {
    this.state = {
      ...this.state,
      zoomFactor: stepHtmlZoom(this.state.zoomFactor, -1),
    };
    this.syncContextKeys();
    this.changeEmitter.fire();
  }

  zoomAuto(): void {
    if (this.state.zoomFactor === 1) {
      return;
    }
    this.state = { ...this.state, zoomFactor: 1 };
    this.syncContextKeys();
    this.changeEmitter.fire();
  }

  zoomPercent(zoom: number): void {
    this.state = {
      ...this.state,
      zoomFactor: clampHtmlZoom(zoom),
    };
    this.syncContextKeys();
    this.changeEmitter.fire();
  }

  getZoomFactor(): number {
    return this.state.zoomFactor;
  }

  getZoom(): number {
    return resolveEffectiveZoom(this.state.zoomFactor, this.state.fitZoom);
  }

  getZoomLabel(): string {
    return formatHtmlZoomLabel(this.state.zoomFactor);
  }

  private syncContextKeys(): void {
    const keys = this.contextKeys;
    if (!keys) {
      return;
    }
    const factor = this.state.zoomFactor;
    keys.setContext('html.previewActive', this.active);
    keys.setContext('html.devicePreset', this.state.preset);
    keys.setContext('html.autoZoom', factor >= HTML_ZOOM_MAX - 0.001);
    keys.setContext('html.zoomLabel', this.getZoomLabel());
    keys.setContext('html.canZoomIn', factor < HTML_ZOOM_MAX - 0.001);
    keys.setContext('html.canZoomOut', factor > HTML_ZOOM_MIN + 0.001);
  }
}
