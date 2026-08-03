import { createServiceId, Emitter } from '@openenvx/core';
import type { ContextKeyService, Event } from '@openenvx/core';

import {
  clampHtmlZoom,
  DEFAULT_HTML_DEVICE_PRESET,
  formatHtmlZoomLabel,
  HTML_ZOOM_MAX,
  HTML_ZOOM_MIN,
  stepHtmlZoom,
  type HtmlDevicePreset,
} from '../editor/html-device-preview';

export interface HtmlPreviewChromeState {
  preset: HtmlDevicePreset;
  autoZoom: boolean;
  manualZoom: number;
  /** Latest auto-fit zoom from the active pane (for labels / stepping). */
  autoZoomValue: number;
}

export interface HtmlPreviewChromeService {
  readonly onDidChange: Event<void>;
  getState(): HtmlPreviewChromeState;
  /** Active while an html/email editor pane is mounted. */
  setActive(active: boolean): void;
  isActive(): boolean;
  bindContextKeys(keys: ContextKeyService | null): void;
  /** Pane reports current auto-fit zoom (does not toggle auto mode). */
  reportAutoZoomValue(autoZoomValue: number): void;
  /** Apply initial preset once per service lifetime (pane remounts are no-ops). */
  seedPreset(preset: HtmlDevicePreset): void;
  setPreset(preset: HtmlDevicePreset): void;
  zoomIn(): void;
  zoomOut(): void;
  zoomAuto(): void;
  zoomPercent(zoom: number): void;
  getZoom(): number;
  getZoomLabel(): string;
}

export const HtmlPreviewChromeServiceId =
  createServiceId<HtmlPreviewChromeService>('htmlPreviewChrome');

export class HtmlPreviewChromeServiceImpl implements HtmlPreviewChromeService {
  private readonly changeEmitter = new Emitter<void>();
  readonly onDidChange: Event<void> = this.changeEmitter.event;

  private active = false;
  private seededPreset = false;
  private contextKeys: ContextKeyService | null = null;
  private state: HtmlPreviewChromeState = {
    autoZoom: false,
    autoZoomValue: 1,
    manualZoom: 1,
    preset: DEFAULT_HTML_DEVICE_PRESET,
  };

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

  reportAutoZoomValue(autoZoomValue: number): void {
    if (this.state.autoZoomValue === autoZoomValue) {
      return;
    }
    this.state = { ...this.state, autoZoomValue };
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
    if (this.state.preset === preset && this.state.autoZoom) {
      return;
    }
    this.state = { ...this.state, autoZoom: true, preset };
    this.syncContextKeys();
    this.changeEmitter.fire();
  }

  zoomIn(): void {
    const current = this.getZoom();
    this.state = {
      ...this.state,
      autoZoom: false,
      manualZoom: stepHtmlZoom(current, 1),
    };
    this.syncContextKeys();
    this.changeEmitter.fire();
  }

  zoomOut(): void {
    const current = this.getZoom();
    this.state = {
      ...this.state,
      autoZoom: false,
      manualZoom: stepHtmlZoom(current, -1),
    };
    this.syncContextKeys();
    this.changeEmitter.fire();
  }

  zoomAuto(): void {
    if (this.state.autoZoom) {
      return;
    }
    this.state = { ...this.state, autoZoom: true };
    this.syncContextKeys();
    this.changeEmitter.fire();
  }

  zoomPercent(zoom: number): void {
    this.state = {
      ...this.state,
      autoZoom: false,
      manualZoom: clampHtmlZoom(zoom),
    };
    this.syncContextKeys();
    this.changeEmitter.fire();
  }

  getZoom(): number {
    return this.state.autoZoom
      ? this.state.autoZoomValue
      : this.state.manualZoom;
  }

  getZoomLabel(): string {
    return formatHtmlZoomLabel(this.getZoom(), this.state.autoZoom);
  }

  private syncContextKeys(): void {
    const keys = this.contextKeys;
    if (!keys) {
      return;
    }
    const zoom = this.getZoom();
    keys.setContext('html.previewActive', this.active);
    keys.setContext('html.devicePreset', this.state.preset);
    keys.setContext('html.autoZoom', this.state.autoZoom);
    keys.setContext('html.zoomLabel', this.getZoomLabel());
    keys.setContext('html.canZoomIn', zoom < HTML_ZOOM_MAX - 0.001);
    keys.setContext('html.canZoomOut', zoom > HTML_ZOOM_MIN + 0.001);
  }
}
