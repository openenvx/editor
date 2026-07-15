import { useMemo, useState } from 'react';
import { HexAlphaColorPicker } from 'react-colorful';

import { cn } from '../lib/cn';
import { Input } from './input';
import { InspectorAnchoredPopover } from './inspector-anchored-popover';

import styles from './color-picker.module.css';

interface RgbaColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

type ColorFormat = 'hex' | 'rgba';

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function componentToHex(value: number): string {
  return Math.round(value).toString(16).padStart(2, '0');
}

function parseHex(value: string): RgbaColor | null {
  const hex = value.replace('#', '');
  if (hex.length === 3) {
    return {
      r: Number.parseInt(hex[0] + hex[0], 16),
      g: Number.parseInt(hex[1] + hex[1], 16),
      b: Number.parseInt(hex[2] + hex[2], 16),
      a: 1,
    };
  }
  if (hex.length === 6) {
    return {
      r: Number.parseInt(hex.slice(0, 2), 16),
      g: Number.parseInt(hex.slice(2, 4), 16),
      b: Number.parseInt(hex.slice(4, 6), 16),
      a: 1,
    };
  }
  if (hex.length === 8) {
    return {
      r: Number.parseInt(hex.slice(0, 2), 16),
      g: Number.parseInt(hex.slice(2, 4), 16),
      b: Number.parseInt(hex.slice(4, 6), 16),
      a: Number.parseInt(hex.slice(6, 8), 16) / 255,
    };
  }
  return null;
}

function parseRgba(value: string): RgbaColor | null {
  const match = value.match(
    /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)$/i
  );
  if (!match) {
    return null;
  }
  return {
    r: Number(match[1]),
    g: Number(match[2]),
    b: Number(match[3]),
    a: match[4] !== undefined ? Number(match[4]) : 1,
  };
}

function parseColor(value: string | undefined): RgbaColor {
  if (!value || value === 'transparent') {
    return { r: 0, g: 0, b: 0, a: 0 };
  }
  if (value.startsWith('#')) {
    return parseHex(value) ?? { r: 0, g: 0, b: 0, a: 1 };
  }
  return parseRgba(value) ?? { r: 0, g: 0, b: 0, a: 1 };
}

function toHex6(color: RgbaColor): string {
  return `#${componentToHex(color.r)}${componentToHex(color.g)}${componentToHex(color.b)}`;
}

function toHex8(color: RgbaColor): string {
  const alpha = componentToHex(clamp01(color.a) * 255);
  return `${toHex6(color)}${alpha}`;
}

function toRgba(color: RgbaColor): string {
  const alpha = Math.round(color.a * 1000) / 1000;
  if (alpha === 1) {
    return `rgb(${color.r}, ${color.g}, ${color.b})`;
  }
  return `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
}

function detectFormat(value: string | undefined): ColorFormat {
  if (!value || value === 'transparent') {
    return 'hex';
  }
  return value.startsWith('rgb') ? 'rgba' : 'hex';
}

function formatColorValue(color: RgbaColor, format: ColorFormat): string {
  if (color.a === 0) {
    return 'transparent';
  }
  if (format === 'rgba' || color.a < 1) {
    return toRgba(color);
  }
  return toHex6(color);
}

function pickerHex(color: RgbaColor): string {
  return color.a === 1 ? toHex6(color) : toHex8(color);
}

function roundAlphaPercent(alpha: number): number {
  return Math.round(alpha * 100);
}

export interface ColorPickerPopoverProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
}

export interface ColorPickerPanelProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
}

export function ColorPickerPanel({
  value,
  onChange,
  placeholder = '#ffffff',
  className,
  id,
}: ColorPickerPanelProps) {
  const [format, setFormat] = useState<ColorFormat>(() => detectFormat(value));
  const color = useMemo(() => parseColor(value), [value]);
  const isEmpty = !value || value === 'transparent';

  const applyColor = (next: RgbaColor, nextFormat = format) => {
    onChange(formatColorValue(next, nextFormat));
  };

  return (
    <div className={cn(styles.root, className)}>
      <HexAlphaColorPicker
        className={styles.picker}
        color={pickerHex(color)}
        onChange={(next) => {
          const parsed = parseHex(next);
          if (parsed) {
            applyColor(parsed);
          }
        }}
      />
      <div className={styles.formatTabs}>
        <button
          className={cn(
            styles.formatTab,
            format === 'hex' && styles.formatTabActive
          )}
          onClick={() => setFormat('hex')}
          type="button"
        >
          HEX
        </button>
        <button
          className={cn(
            styles.formatTab,
            format === 'rgba' && styles.formatTabActive
          )}
          onClick={() => setFormat('rgba')}
          type="button"
        >
          RGBA
        </button>
      </div>
      {format === 'hex' ? (
        <div className={styles.inputRow}>
          <Input
            className={styles.monoInput}
            id={id}
            onChange={(event) => {
              const next = event.target.value.trim();
              if (!next) {
                onChange('transparent');
                return;
              }
              const parsed = parseHex(next.startsWith('#') ? next : `#${next}`);
              if (parsed) {
                applyColor({ ...parsed, a: color.a }, 'hex');
              } else {
                onChange(next);
              }
            }}
            placeholder={placeholder}
            value={isEmpty ? '' : toHex6(color)}
          />
          <Input
            aria-label="Alpha"
            className={styles.alphaInput}
            onChange={(event) => {
              const next = Number(event.target.value);
              if (Number.isNaN(next)) {
                return;
              }
              const nextAlpha = clamp01(next / 100);
              applyColor(
                { ...color, a: nextAlpha },
                nextAlpha < 1 ? 'rgba' : 'hex'
              );
            }}
            value={isEmpty ? '' : roundAlphaPercent(color.a)}
          />
          <span className={styles.alphaSuffix}>%</span>
        </div>
      ) : (
        <div className={styles.rgbaRow}>
          {(['r', 'g', 'b'] as const).map((channel) => (
            <Input
              aria-label={channel.toUpperCase()}
              className={styles.channelInput}
              key={channel}
              onChange={(event) => {
                const next = Number(event.target.value);
                if (Number.isNaN(next)) {
                  return;
                }
                applyColor(
                  { ...color, [channel]: Math.min(255, Math.max(0, next)) },
                  'rgba'
                );
              }}
              value={isEmpty ? '' : color[channel]}
            />
          ))}
          <Input
            aria-label="Alpha"
            className={styles.channelInput}
            onChange={(event) => {
              const next = Number(event.target.value);
              if (Number.isNaN(next)) {
                return;
              }
              applyColor({ ...color, a: clamp01(next) }, 'rgba');
            }}
            step="0.01"
            value={isEmpty ? '' : Math.round(color.a * 100) / 100}
          />
        </div>
      )}
    </div>
  );
}

export function ColorPickerPopover({
  value,
  onChange,
  placeholder = 'Add...',
  className,
  id,
}: ColorPickerPopoverProps) {
  const [open, setOpen] = useState(false);
  const isEmpty = !value || value === 'transparent';
  const color = useMemo(() => parseColor(value), [value]);
  const inlineValue = isEmpty
    ? ''
    : formatColorValue(color, detectFormat(value));

  return (
    <div className={cn(styles.triggerRow, className)}>
      <Input
        className={styles.input}
        id={id}
        onChange={(event) => {
          const next = event.target.value.trim();
          if (!next) {
            onChange('transparent');
            return;
          }
          const parsed = parseColor(next);
          onChange(formatColorValue(parsed, detectFormat(next)));
        }}
        placeholder={placeholder}
        value={inlineValue}
      />
      <InspectorAnchoredPopover
        onOpenChange={setOpen}
        open={open}
        trigger={
          <button
            aria-label="Open color picker"
            className={styles.swatchButton}
            style={{
              background: isEmpty ? 'transparent' : value,
            }}
            type="button"
          />
        }
      >
        <ColorPickerPanel
          id={id ? `${id}-panel` : undefined}
          onChange={onChange}
          placeholder={placeholder}
          value={value}
        />
      </InspectorAnchoredPopover>
    </div>
  );
}
