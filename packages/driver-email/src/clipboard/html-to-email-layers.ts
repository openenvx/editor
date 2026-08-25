import {
  escapeAttr,
  escapeHtml,
  sanitizeHtml,
  sanitizeUrl,
} from '@openenvx/core';

export interface EmailPasteLayerSpec {
  type: string;
  data: Record<string, unknown>;
}

const BLOCK_LEVEL_TAGS = new Set([
  'P',
  'H1',
  'H2',
  'H3',
  'H4',
  'H5',
  'H6',
  'UL',
  'OL',
  'HR',
  'IMG',
  'DIV',
  'BLOCKQUOTE',
  'TABLE',
]);

const DOUBLE_BREAK = /<br\s*\/?>\s*<br\s*\/?>/i;

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

function isTrivialHtml(html: string | null): boolean {
  if (!html?.trim()) {
    return true;
  }
  if (/<(img|hr|table|h[1-6]|ul|ol|p|div|blockquote)\b/i.test(html)) {
    return false;
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

function tagName(element: Element): string {
  return element.tagName.toUpperCase();
}

function textContent(element: Element): string {
  return element.textContent?.replaceAll(/\s+/g, ' ').trim() ?? '';
}

function innerHtml(element: Element): string {
  return sanitizeHtml(element.innerHTML.trim());
}

function headingLevel(tag: string): 1 | 2 | 3 {
  const level = Number.parseInt(tag.slice(1), 10);
  if (level <= 1) {
    return 1;
  }
  if (level >= 3) {
    return 3;
  }
  return 2;
}

function isHttpImageSrc(src: string): boolean {
  const trimmed = src.trim();
  return trimmed.startsWith('http://') || trimmed.startsWith('https://');
}

function isBoldElement(element: Element): boolean {
  const tag = tagName(element);
  if (tag === 'B' || tag === 'STRONG') {
    return true;
  }
  const style = element.getAttribute('style') ?? '';
  return /font-weight:\s*(700|600|bold)/i.test(style);
}

function isHeadingParagraph(element: Element): boolean {
  if (tagName(element) !== 'P') {
    return false;
  }
  const label = textContent(element);
  if (!label || label.length > 160) {
    return false;
  }
  const children = [...element.children];
  if (children.length === 1) {
    const child = children[0]!;
    if (isBoldElement(child) && textContent(child) === label) {
      return true;
    }
    if (
      textContent(child) === label &&
      /^[\p{Extended_Pictographic}]/u.test(label)
    ) {
      return true;
    }
  }
  if (children.length === 0) {
    return /^[\p{Extended_Pictographic}]/u.test(label);
  }
  return false;
}

function isLinkOnlyParagraph(element: Element): boolean {
  if (tagName(element) !== 'P') {
    return false;
  }
  const label = textContent(element);
  return /^https?:\/\//i.test(label);
}

function mapHeading(element: Element, level: 1 | 2 | 3): EmailPasteLayerSpec {
  return {
    type: 'email.heading',
    data: {
      html: innerHtml(element),
      level: String(level),
    },
  };
}

function mapTextHtml(html: string): EmailPasteLayerSpec | null {
  const sanitized = sanitizeHtml(html.trim());
  if (!sanitized.replaceAll(/<[^>]+>/g, '').trim()) {
    return null;
  }
  return {
    type: 'email.text',
    data: { html: sanitized },
  };
}

function mapText(element: Element): EmailPasteLayerSpec | null {
  return mapTextHtml(element.innerHTML);
}

function mapLinkTextFromUrl(url: string): EmailPasteLayerSpec {
  const trimmed = url.trim();
  const safeHref = sanitizeUrl(trimmed, { fallback: trimmed });
  return {
    type: 'email.text',
    data: {
      html: `<a href="${escapeAttr(safeHref)}" rel="noopener noreferrer" target="_blank">${escapeHtml(trimmed)}</a>`,
    },
  };
}

function mapImage(element: Element): EmailPasteLayerSpec | null {
  const src = element.getAttribute('src')?.trim() ?? '';
  if (!src || !isHttpImageSrc(src)) {
    return null;
  }
  const alt = element.getAttribute('alt')?.trim() ?? '';
  return {
    type: 'email.image',
    data: {
      src: sanitizeUrl(src, { fallback: '' }),
      alt,
    },
  };
}

function mapParagraphLike(element: Element): EmailPasteLayerSpec[] {
  if (isLinkOnlyParagraph(element)) {
    const link = mapLinkTextFromUrl(textContent(element));
    return [link];
  }
  if (isHeadingParagraph(element)) {
    const heading = mapHeading(element, 2);
    return heading.data.html ? [heading] : [];
  }

  const inner = element.innerHTML.trim();
  if (DOUBLE_BREAK.test(inner)) {
    const parts = inner
      .split(DOUBLE_BREAK)
      .map((part) => part.trim())
      .filter(Boolean);
    if (parts.length > 1) {
      const blocks: EmailPasteLayerSpec[] = [];
      for (const part of parts) {
        blocks.push(...mapHtmlSnippet(part));
      }
      if (blocks.length > 0) {
        return blocks;
      }
    }
  }

  const text = mapText(element);
  return text ? [text] : [];
}

function mapHtmlSnippet(html: string): EmailPasteLayerSpec[] {
  if (typeof document === 'undefined') {
    const text = mapTextHtml(html);
    return text ? [text] : [];
  }
  const template = document.createElement('template');
  template.innerHTML = html;
  const root = template.content.firstElementChild;
  if (root && tagName(root) === 'P') {
    return mapParagraphLike(root);
  }
  const text = mapTextHtml(html);
  if (!text) {
    return [];
  }
  const plain = String(text.data.html)
    .replaceAll(/<[^>]+>/g, '')
    .trim();
  if (isPlainHeadingLine(plain)) {
    return [
      { type: 'email.heading', data: { html: text.data.html, level: '2' } },
    ];
  }
  return [text];
}

function getDirectBlockChildren(element: Element): Element[] {
  return [...element.children].filter((child) =>
    BLOCK_LEVEL_TAGS.has(tagName(child))
  );
}

function mapElement(element: Element): EmailPasteLayerSpec[] {
  const tag = tagName(element);

  if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'META' || tag === 'LINK') {
    return [];
  }

  if (/^H[1-6]$/.test(tag)) {
    const mapped = mapHeading(element, headingLevel(tag));
    return mapped.data.html ? [mapped] : [];
  }

  if (tag === 'HR') {
    return [{ type: 'email.divider', data: {} }];
  }

  if (tag === 'IMG') {
    const image = mapImage(element);
    return image ? [image] : [];
  }

  if (tag === 'UL' || tag === 'OL') {
    const html = sanitizeHtml(element.outerHTML.trim());
    if (!html.replaceAll(/<[^>]+>/g, '').trim()) {
      return [];
    }
    return [{ type: 'email.text', data: { html } }];
  }

  const blockChildren = getDirectBlockChildren(element);
  if (blockChildren.length > 0 && tag !== 'P' && tag !== 'LI') {
    return blockChildren.flatMap((child) => mapElement(child));
  }

  if (tag === 'P' || tag === 'DIV') {
    return mapParagraphLike(element);
  }

  if (tag === 'TABLE') {
    const blocks: EmailPasteLayerSpec[] = [];
    for (const cell of element.querySelectorAll('td, th')) {
      blocks.push(...mapElement(cell));
    }
    return blocks;
  }

  const text = mapText(element);
  return text ? [text] : [];
}

function walkBlockNodes(root: ParentNode): EmailPasteLayerSpec[] {
  const blocks: EmailPasteLayerSpec[] = [];
  for (const node of root.childNodes) {
    if (node.nodeType !== Node.ELEMENT_NODE) {
      continue;
    }
    blocks.push(...mapElement(node as Element));
  }
  return blocks;
}

function isPlainHeadingLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed || trimmed.length > 160) {
    return false;
  }
  if (/^https?:\/\//i.test(trimmed)) {
    return false;
  }
  return /^[\p{Extended_Pictographic}]/u.test(trimmed);
}

function isPlainUrlLine(line: string): boolean {
  return /^https?:\/\//i.test(line.trim());
}

function plainChunkToLayer(chunk: string): EmailPasteLayerSpec | null {
  const trimmed = chunk.trim();
  if (!trimmed) {
    return null;
  }
  if (isPlainUrlLine(trimmed)) {
    return mapLinkTextFromUrl(trimmed);
  }
  if (isPlainHeadingLine(trimmed)) {
    return {
      type: 'email.heading',
      data: { html: sanitizeHtml(trimmed), level: '2' },
    };
  }
  return {
    type: 'email.text',
    data: { html: sanitizeHtml(trimmed.replaceAll('\n', '<br>')) },
  };
}

function plainTextToLayers(plain: string): EmailPasteLayerSpec[] {
  const normalized = plain.replaceAll('\r\n', '\n').trim();
  const blocks: EmailPasteLayerSpec[] = [];
  let paragraph: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length === 0) {
      return;
    }
    const layer = plainChunkToLayer(paragraph.join('\n'));
    if (layer) {
      blocks.push(layer);
    }
    paragraph = [];
  };

  for (const line of normalized.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) {
      flushParagraph();
      continue;
    }
    if (isPlainHeadingLine(trimmed) || isPlainUrlLine(trimmed)) {
      flushParagraph();
      const layer = plainChunkToLayer(trimmed);
      if (layer) {
        blocks.push(layer);
      }
      continue;
    }
    paragraph.push(trimmed);
  }
  flushParagraph();

  return blocks;
}

function shouldPreferPlainOverHtml(
  htmlBlocks: EmailPasteLayerSpec[],
  plain: string
): boolean {
  if (htmlBlocks.length !== 1 || htmlBlocks[0]?.type !== 'email.text') {
    return false;
  }
  return plainTextToLayers(plain).length > 1;
}

/** Map clipboard HTML or plain text into email block specs (no layer ids). */
export function clipboardHtmlToEmailLayers(
  html: string | null,
  plain: string | null
): EmailPasteLayerSpec[] {
  const trimmedPlain = plain?.trim() ?? '';
  const normalized =
    html && !isTrivialHtml(html) ? normalizeHtmlDocument(html) : '';
  if (normalized && typeof document !== 'undefined') {
    const template = document.createElement('template');
    template.innerHTML = normalized;
    const blocks = walkBlockNodes(template.content);
    if (blocks.length > 0) {
      if (trimmedPlain && shouldPreferPlainOverHtml(blocks, trimmedPlain)) {
        return plainTextToLayers(trimmedPlain);
      }
      return blocks;
    }
  }

  if (!trimmedPlain) {
    if (normalized && typeof document === 'undefined') {
      return plainTextToLayers(normalized);
    }
    return [];
  }
  return plainTextToLayers(trimmedPlain);
}
