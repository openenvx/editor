/**
 * TipTap/StarterKit wraps plain runs in a solitary `<p>…</p>`.
 * Headings/text blocks often store bare HTML; keeping that wrap adds UA
 * paragraph margins when re-rendered via dangerouslySetInnerHTML.
 */
export function normalizeCommittedRichTextHtml(html: string): string {
  const trimmed = html.trim();
  const match = trimmed.match(/^<p(?:\s[^>]*)?>([\s\S]*)<\/p>$/i);
  if (!match) {
    return trimmed;
  }
  const inner = match[1] ?? '';
  // Multi-paragraph docs stay as-is.
  if (/<p[\s>]/i.test(inner)) {
    return trimmed;
  }
  return inner;
}
