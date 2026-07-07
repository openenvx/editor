const HTML_ENTITY_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export function escapeHtml(value: string): string {
  return value.replaceAll(/[&<>"']/g, (char) => HTML_ENTITY_MAP[char]!);
}

export function escapeAttr(value: string): string {
  return escapeHtml(value);
}

const ALLOWED_TAGS = new Set([
  'a',
  'b',
  'blockquote',
  'br',
  'div',
  'em',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'i',
  'li',
  'ol',
  'p',
  's',
  'span',
  'strike',
  'del',
  'strong',
  'u',
  'ul',
]);

const ALLOWED_ATTRS = new Set(['class', 'href', 'rel', 'target']);

const UNSAFE_HREF = /^\s*(javascript|data|vbscript):/i;

function sanitizeNode(root: ParentNode): void {
  const children: Element[] = [];
  for (let index = 0; index < root.children.length; index += 1) {
    const child = root.children.item(index);
    if (child) {
      children.push(child);
    }
  }
  for (const child of children) {
    if (!ALLOWED_TAGS.has(child.tagName.toLowerCase())) {
      while (child.firstChild) {
        child.parentNode?.insertBefore(child.firstChild, child);
      }
      child.remove();
      continue;
    }

    const attributes: Attr[] = [];
    for (let index = 0; index < child.attributes.length; index += 1) {
      const attr = child.attributes.item(index);
      if (attr) {
        attributes.push(attr);
      }
    }
    for (const attr of attributes) {
      const name = attr.name.toLowerCase();
      if (name.startsWith('on') || !ALLOWED_ATTRS.has(name)) {
        child.removeAttribute(attr.name);
        continue;
      }
      if (name === 'href' && UNSAFE_HREF.test(attr.value)) {
        child.removeAttribute(attr.name);
      }
    }

    sanitizeNode(child);
  }
}

/** Strip scripts, event handlers, and unsafe URLs from rich-text HTML. */
export function sanitizeHtml(html: string): string {
  if (!html) {
    return '';
  }

  if (typeof document === 'undefined') {
    return sanitizeHtmlFallback(html);
  }

  const template = document.createElement('template');
  template.innerHTML = html;
  sanitizeNode(template.content);
  return template.innerHTML;
}

function sanitizeHtmlFallback(html: string): string {
  return html
    .replaceAll(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replaceAll(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replaceAll(
      /\s(href|src)\s*=\s*(?:"|')\s*(javascript|data|vbscript):[^"']*(?:"|')/gi,
      ''
    );
}
