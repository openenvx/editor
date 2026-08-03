import { Maximize2, Monitor, Smartphone, ZoomIn, ZoomOut } from 'lucide-react';
import {
  memo,
  type ChangeEvent,
  type PointerEvent,
  type ReactNode,
} from 'react';

import {
  formatHtmlZoomLabel,
  HTML_ZOOM_MAX,
  HTML_ZOOM_MIN,
  HTML_ZOOM_PRESETS,
  type HtmlDevicePreset,
} from './html-device-preview';

import styles from './html-device-toolbar.module.css';

function stopToolbarPointer(event: PointerEvent) {
  event.stopPropagation();
}

const DEVICE_BUTTONS: {
  preset: Exclude<HtmlDevicePreset, 'fluid'>;
  label: string;
  Icon: typeof Smartphone;
}[] = [
  { preset: 'mobile', label: 'Mobile', Icon: Smartphone },
  { preset: 'desktop', label: 'Desktop', Icon: Monitor },
];

function isPresetZoom(
  zoom: number
): zoom is (typeof HTML_ZOOM_PRESETS)[number] {
  return (HTML_ZOOM_PRESETS as readonly number[]).includes(zoom);
}

export interface HtmlDeviceToolbarProps {
  preset: HtmlDevicePreset;
  zoom: number;
  autoZoomValue: number;
  autoZoom: boolean;
  onPresetChange: (preset: HtmlDevicePreset) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomAuto: () => void;
  onZoomPercent: (zoom: number) => void;
  /** Optional controls after zoom (e.g. email Edit / Preview). */
  trailing?: ReactNode;
}

export const HtmlDeviceToolbar = memo(
  ({
    preset,
    zoom,
    autoZoomValue,
    autoZoom,
    onPresetChange,
    onZoomIn,
    onZoomOut,
    onZoomAuto,
    onZoomPercent,
    trailing,
  }: HtmlDeviceToolbarProps) => {
    const canZoomOut = zoom > HTML_ZOOM_MIN + 0.001;
    const canZoomIn = zoom < HTML_ZOOM_MAX - 0.001;
    const selectValue = autoZoom
      ? 'auto'
      : isPresetZoom(zoom)
        ? String(zoom)
        : 'custom';

    const handleZoomSelect = (event: ChangeEvent<HTMLSelectElement>) => {
      const value = event.target.value;
      if (value === 'auto') {
        onZoomAuto();
        return;
      }
      if (value === 'custom') {
        return;
      }
      onZoomPercent(Number(value));
    };

    return (
      <div
        aria-label="Device preview"
        className={styles.toolbar}
        role="toolbar"
        onPointerDown={stopToolbarPointer}
      >
        {DEVICE_BUTTONS.map(({ preset: device, label, Icon }) => (
          <button
            aria-label={label}
            aria-pressed={preset === device}
            className={[
              styles.iconButton,
              preset === device ? styles.iconButtonActive : '',
            ]
              .filter(Boolean)
              .join(' ')}
            key={device}
            title={label}
            type="button"
            onClick={() => onPresetChange(device)}
          >
            <Icon size={16} strokeWidth={1.75} />
          </button>
        ))}
        <button
          aria-label="Fit width"
          aria-pressed={preset === 'fluid'}
          className={[
            styles.iconButton,
            preset === 'fluid' ? styles.iconButtonActive : '',
          ]
            .filter(Boolean)
            .join(' ')}
          title="Fit width"
          type="button"
          onClick={() => onPresetChange('fluid')}
        >
          <Maximize2 size={16} strokeWidth={1.75} />
        </button>

        <span aria-hidden className={styles.divider} />

        <button
          aria-label="Zoom out"
          className={styles.iconButton}
          disabled={!canZoomOut}
          title="Zoom out"
          type="button"
          onClick={onZoomOut}
        >
          <ZoomOut size={16} strokeWidth={1.75} />
        </button>
        <button
          aria-label="Zoom in"
          className={styles.iconButton}
          disabled={!canZoomIn}
          title="Zoom in"
          type="button"
          onClick={onZoomIn}
        >
          <ZoomIn size={16} strokeWidth={1.75} />
        </button>

        <span aria-hidden className={styles.divider} />

        <select
          aria-label="Zoom"
          className={styles.zoomSelect}
          value={selectValue}
          onChange={handleZoomSelect}
        >
          {HTML_ZOOM_PRESETS.map((value) => (
            <option key={value} value={String(value)}>
              {Math.round(value * 100)}%
            </option>
          ))}
          <option value="auto">
            {formatHtmlZoomLabel(autoZoomValue, true)}
          </option>
          {!autoZoom && !isPresetZoom(zoom) ? (
            <option value="custom">{formatHtmlZoomLabel(zoom, false)}</option>
          ) : null}
        </select>

        {trailing ? (
          <>
            <span aria-hidden className={styles.divider} />
            {trailing}
          </>
        ) : null}
      </div>
    );
  }
);
