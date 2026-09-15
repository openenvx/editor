import { sanitizeHtml } from '@openenvx/core';

import type { CanvasTextModel } from '../layers/canvas-text-layer';
import {
  DEFAULT_RICH_TEXT_FILL,
  DEFAULT_RICH_TEXT_FONT_FAMILY,
  DEFAULT_RICH_TEXT_FONT_SIZE,
} from '../rich-text-typography';

export interface ClipboardTextSnapshot {
  html: string | null;
  plain: string | null;
}

export function isTrivialHtml(html: string | null): boolean {
  if (!html?.trim()) {
    return true;
  }
  if (typeof document === 'undefined') {
    return html.replaceAll(/<[^>]+>/g, '').trim().length === 0;
  }
  const template = document.createElement('template');
  template.innerHTML = html;
  const text =
    template.content.textContent?.replaceAll(/\s+/g, '').trim() ?? '';
  return text.length === 0;
}

export function isImageFileReference(
  value: string | null | undefined
): boolean {
  const trimmed = value?.trim() ?? '';
  if (!trimmed) {
    return false;
  }
  if (trimmed.startsWith('file://')) {
    return true;
  }
  return /\.(png|jpe?g|gif|webp|svg|bmp|ico)$/i.test(trimmed);
}

export function hasExternalClipboardText(
  snapshot: ClipboardTextSnapshot
): boolean {
  const hasHtml = snapshot.html !== null && !isTrivialHtml(snapshot.html);
  const plain = snapshot.plain?.trim() ?? '';
  const hasPlain = Boolean(plain) && !isImageFileReference(plain);
  return hasHtml || hasPlain;
}

function parseStyleAttribute(style: string): Map<string, string> {
  const styleMap = new Map<string, string>();
  for (const part of style.split(';')) {
    const colonIndex = part.indexOf(':');
    if (colonIndex === -1) {
      continue;
    }
    const key = part.slice(0, colonIndex).trim().toLowerCase();
    const value = part.slice(colonIndex + 1).trim();
    if (key && value) {
      styleMap.set(key, value);
    }
  }
  return styleMap;
}

function parseFirstFontFamily(
  fontFamily: string | undefined
): string | undefined {
  if (!fontFamily?.trim()) {
    return undefined;
  }
  const first = fontFamily.split(',')[0]?.trim() ?? '';
  return first.replaceAll(/^['"]|['"]$/g, '') || undefined;
}

function parseColor(value: string | undefined): string | undefined {
  if (!value?.trim()) {
    return undefined;
  }
  return value.trim();
}

function parseFontSize(value: string | undefined): number | undefined {
  if (!value?.trim()) {
    return undefined;
  }
  const trimmed = value.trim().toLowerCase();
  const pxMatch = trimmed.match(/^([\d.]+)px$/);
  if (pxMatch?.[1]) {
    const parsed = Number.parseFloat(pxMatch[1]);
    return Number.isFinite(parsed) ? Math.round(parsed) : undefined;
  }
  const ptMatch = trimmed.match(/^([\d.]+)pt$/);
  if (ptMatch?.[1]) {
    const parsed = Number.parseFloat(ptMatch[1]);
    return Number.isFinite(parsed) ? Math.round(parsed * (96 / 72)) : undefined;
  }
  const emMatch = trimmed.match(/^([\d.]+)em$/);
  if (emMatch?.[1]) {
    const parsed = Number.parseFloat(emMatch[1]);
    return Number.isFinite(parsed) ? Math.round(parsed * 16) : undefined;
  }
  const remMatch = trimmed.match(/^([\d.]+)rem$/);
  if (remMatch?.[1]) {
    const parsed = Number.parseFloat(remMatch[1]);
    return Number.isFinite(parsed) ? Math.round(parsed * 16) : undefined;
  }
  const bareNumber = Number.parseFloat(trimmed);
  if (Number.isFinite(bareNumber) && !trimmed.includes(' ')) {
    return Math.round(bareNumber);
  }
  return undefined;
}

function parseLegacyFontSize(sizeAttr: string | undefined): number | undefined {
  if (!sizeAttr?.trim()) {
    return undefined;
  }
  const parsed = Number.parseInt(sizeAttr, 10);
  if (!Number.isFinite(parsed)) {
    return undefined;
  }
  const sizes = [10, 13, 16, 18, 24, 32, 48];
  const index = Math.max(1, Math.min(7, parsed)) - 1;
  return sizes[index];
}

function parseTextAlign(
  value: string | undefined
): CanvasTextModel['align'] | undefined {
  if (value === 'left' || value === 'center' || value === 'right') {
    return value;
  }
  if (value === 'start') {
    return 'left';
  }
  if (value === 'end') {
    return 'right';
  }
  return undefined;
}

interface ExtractedTextStyles {
  fontFamily?: string;
  fontSize?: number;
  fill?: string;
  align?: CanvasTextModel['align'];
}

function extractStylesFromElement(element: Element): ExtractedTextStyles {
  const styleMap = parseStyleAttribute(element.getAttribute('style') ?? '');

  const fontFamily = parseFirstFontFamily(
    styleMap.get('font-family') ?? element.getAttribute('face') ?? undefined
  );
  const fontSize =
    parseFontSize(styleMap.get('font-size') ?? undefined) ??
    parseLegacyFontSize(element.getAttribute('size') ?? undefined);
  const fill =
    parseColor(styleMap.get('color') ?? undefined) ??
    parseColor(element.getAttribute('color') ?? undefined);
  const align = parseTextAlign(styleMap.get('text-align') ?? undefined);

  return { align, fill, fontFamily, fontSize };
}

function mergeTextStyles(
  base: ExtractedTextStyles,
  next: ExtractedTextStyles
): ExtractedTextStyles {
  return {
    align: next.align ?? base.align,
    fill: next.fill ?? base.fill,
    fontFamily: next.fontFamily ?? base.fontFamily,
    fontSize: next.fontSize ?? base.fontSize,
  };
}

function extractStylesFromDocument(root: ParentNode): ExtractedTextStyles {
  let best: ExtractedTextStyles = {};
  let bestScore = -1;

  const walk = (
    node: Node,
    inherited: ExtractedTextStyles,
    depth: number
  ): void => {
    if (node.nodeType !== Node.ELEMENT_NODE) {
      return;
    }

    const element = node as Element;
    const own = extractStylesFromElement(element);
    const merged = mergeTextStyles(inherited, own);
    const ownScore =
      (own.fontFamily ? 100 : 0) +
      (own.fontSize ? 10 : 0) +
      (own.fill ? 5 : 0) +
      (own.align ? 1 : 0);
    const score = depth * 10 + ownScore;

    if (ownScore > 0 && score >= bestScore) {
      best = merged;
      bestScore = score;
    }

    for (const child of element.children) {
      walk(child, merged, depth + 1);
    }
  };

  for (const child of root.childNodes) {
    walk(child, {}, 0);
  }

  return best;
}

function extractFragmentHtml(html: string): string {
  const startMarker = '<!--StartFragment-->';
  const endMarker = '<!--EndFragment-->';
  const start = html.indexOf(startMarker);
  const end = html.indexOf(endMarker);
  if (start !== -1 && end !== -1 && end > start) {
    return html.slice(start + startMarker.length, end).trim();
  }
  return html;
}

function normalizeHtmlDocument(html: string): string {
  const fragment = extractFragmentHtml(html);
  if (typeof document === 'undefined') {
    return fragment.trim();
  }
  const template = document.createElement('template');
  template.innerHTML = fragment;
  const body = template.content.querySelector('body');
  return (body?.innerHTML ?? template.innerHTML).trim();
}

export function clipboardHtmlToTextModel(
  html: string,
  plain: string | null
): CanvasTextModel {
  const normalized = normalizeHtmlDocument(html);
  const sourceHtml = normalized || `<p>${plain ?? ''}</p>`;

  let fontFamily = DEFAULT_RICH_TEXT_FONT_FAMILY;
  let fontSize = DEFAULT_RICH_TEXT_FONT_SIZE;
  let fill = DEFAULT_RICH_TEXT_FILL;
  let align: CanvasTextModel['align'] = 'left';

  if (typeof document !== 'undefined') {
    const template = document.createElement('template');
    template.innerHTML = sourceHtml;
    const styles = extractStylesFromDocument(template.content);
    fontFamily = styles.fontFamily ?? fontFamily;
    fontSize = styles.fontSize ?? fontSize;
    fill = styles.fill ?? fill;
    align = styles.align ?? align;
  }

  const sanitized = sanitizeHtml(sourceHtml);

  return {
    align,
    fill,
    fontFamily,
    fontSize,
    html: sanitized,
  };
}

export type ExternalClipboardPayload =
  | {
      kind: 'image';
      blob: Blob;
      naturalWidth: number;
      naturalHeight: number;
    }
  | {
      kind: 'text';
      model: CanvasTextModel;
    };

const IMAGE_CLIPBOARD_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/svg+xml',
] as const;

async function readImageBlob(item: ClipboardItem): Promise<Blob | null> {
  for (const type of IMAGE_CLIPBOARD_TYPES) {
    if (!item.types.includes(type)) {
      continue;
    }
    try {
      return await item.getType(type);
    } catch {
      continue;
    }
  }
  return null;
}

async function measureImage(blob: Blob): Promise<{
  naturalWidth: number;
  naturalHeight: number;
}> {
  if (typeof createImageBitmap === 'function') {
    const bitmap = await createImageBitmap(blob);
    const size = { naturalWidth: bitmap.width, naturalHeight: bitmap.height };
    bitmap.close();
    return size;
  }

  if (typeof Image === 'undefined') {
    return { naturalWidth: 320, naturalHeight: 240 };
  }

  const url = URL.createObjectURL(blob);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error('Failed to load image'));
      element.src = url;
    });
    return {
      naturalWidth: image.naturalWidth || 320,
      naturalHeight: image.naturalHeight || 320,
    };
  } finally {
    URL.revokeObjectURL(url);
  }
}

function imageMimeTypeForFile(file: File): string {
  if (file.type.startsWith('image/')) {
    return file.type;
  }
  const name = file.name.toLowerCase();
  if (name.endsWith('.jpg') || name.endsWith('.jpeg')) {
    return 'image/jpeg';
  }
  if (name.endsWith('.webp')) {
    return 'image/webp';
  }
  if (name.endsWith('.svg')) {
    return 'image/svg+xml';
  }
  if (name.endsWith('.gif')) {
    return 'image/gif';
  }
  return 'image/png';
}

function isClipboardImageFile(file: File): boolean {
  return file.type.startsWith('image/') || isImageFileReference(file.name);
}

function imageBlobFromFile(file: File): Blob | null {
  if (!isClipboardImageFile(file)) {
    return null;
  }
  const mimeType = imageMimeTypeForFile(file);
  return file.type === mimeType
    ? file
    : new File([file], file.name, { type: mimeType });
}

export type CapturedClipboardPayload =
  | {
      kind: 'image';
      blob: Blob;
    }
  | {
      kind: 'text';
      model: CanvasTextModel;
    };

export function captureClipboardDataTransferSync(
  data: DataTransfer
): CapturedClipboardPayload | null {
  for (const file of data.files) {
    const blob = imageBlobFromFile(file);
    if (blob) {
      return { blob, kind: 'image' };
    }
  }

  for (const item of data.items) {
    if (item.kind !== 'file') {
      continue;
    }
    const file = item.getAsFile();
    if (!file) {
      continue;
    }
    const blob = imageBlobFromFile(file);
    if (blob) {
      return { blob, kind: 'image' };
    }
  }

  const html = data.getData('text/html') || null;
  const plain = data.getData('text/plain') || null;
  if (!hasExternalClipboardText({ html, plain })) {
    return null;
  }

  const model = clipboardHtmlToTextModel(
    html ?? `<p>${plain ?? ''}</p>`,
    plain
  );
  if (!model.html.replaceAll(/<[^>]+>/g, '').trim()) {
    return null;
  }
  return { kind: 'text', model };
}

export async function finalizeCapturedPayload(
  captured: CapturedClipboardPayload
): Promise<ExternalClipboardPayload> {
  if (captured.kind === 'text') {
    return captured;
  }

  const { naturalWidth, naturalHeight } = await measureImage(captured.blob);
  return {
    blob: captured.blob,
    kind: 'image',
    naturalHeight,
    naturalWidth,
  };
}

async function readClipboardItems(): Promise<ClipboardItem[]> {
  const clipboard = navigator.clipboard;
  if (!clipboard?.read) {
    return [];
  }

  try {
    const readWithOptions = clipboard.read as (options: {
      unsanitized: string[];
    }) => Promise<ClipboardItem[]>;
    return await readWithOptions({ unsanitized: ['text/html'] });
  } catch {
    try {
      return await clipboard.read();
    } catch {
      return [];
    }
  }
}

export async function readExternalClipboard(): Promise<ExternalClipboardPayload | null> {
  if (typeof navigator === 'undefined' || !navigator.clipboard?.read) {
    return null;
  }

  const items = await readClipboardItems();
  if (items.length === 0) {
    return null;
  }

  let html: string | null = null;
  let plain: string | null = null;
  let imageBlob: Blob | null = null;

  for (const item of items) {
    for (const type of item.types) {
      if (type === 'text/html' && html === null) {
        try {
          const blob = await item.getType('text/html');
          html = await blob.text();
        } catch {
          html = null;
        }
      }
      if (type === 'text/plain' && plain === null) {
        try {
          const blob = await item.getType('text/plain');
          plain = await blob.text();
        } catch {
          plain = null;
        }
      }
    }
    imageBlob ??= await readImageBlob(item);
  }

  if (hasExternalClipboardText({ html, plain })) {
    const model = clipboardHtmlToTextModel(
      html ?? `<p>${plain ?? ''}</p>`,
      plain
    );
    if (!model.html.replaceAll(/<[^>]+>/g, '').trim()) {
      return null;
    }
    return { kind: 'text', model };
  }

  if (!imageBlob) {
    return null;
  }

  const { naturalWidth, naturalHeight } = await measureImage(imageBlob);
  return { kind: 'image', blob: imageBlob, naturalHeight, naturalWidth };
}
