/** Flat element snapshot for the lite SVG node attribute editor. */
export interface SvgElementNode {
  index: number;
  tag: string;
  attrs: Record<string, string>;
}

const COMMON_ATTRS = [
  'fill',
  'stroke',
  'stroke-width',
  'opacity',
  'transform',
  'id',
] as const;

const TAG_ATTRS: Record<string, readonly string[]> = {
  circle: ['cx', 'cy', 'r'],
  ellipse: ['cx', 'cy', 'rx', 'ry'],
  line: ['x1', 'y1', 'x2', 'y2'],
  path: ['d'],
  polygon: ['points'],
  polyline: ['points'],
  rect: ['x', 'y', 'width', 'height', 'rx', 'ry'],
  svg: ['viewBox', 'width', 'height'],
  text: ['x', 'y', 'font-size', 'font-family', 'text-anchor'],
  use: ['href', 'xlink:href', 'x', 'y', 'width', 'height'],
};

/** Editable attribute keys for a tag (fill/stroke first, then tag-specific). */
export function editableAttrsForTag(tag: string): string[] {
  const specific = TAG_ATTRS[tag.toLowerCase()] ?? [];
  return [...COMMON_ATTRS, ...specific];
}

function collectElements(root: Element | null): Element[] {
  if (!root || root.localName === 'parsererror') {
    return [];
  }
  const out: Element[] = [];
  const walk = (el: Element) => {
    out.push(el);
    for (const child of el.children) {
      walk(child);
    }
  };
  walk(root);
  return out;
}

function readAttrs(el: Element): Record<string, string> {
  const attrs: Record<string, string> = {};
  for (const attr of el.attributes) {
    attrs[attr.name] = attr.value;
  }
  return attrs;
}

/**
 * Parse SVG markup into a flat pre-order list of element nodes (text skipped).
 * Requires DOMParser (browser / jsdom).
 */
export function parseSvgElements(markup: string): SvgElementNode[] {
  const trimmed = markup.trim();
  if (!trimmed) {
    return [];
  }
  const doc = new DOMParser().parseFromString(trimmed, 'image/svg+xml');
  return collectElements(doc.documentElement).map((el, index) => ({
    attrs: readAttrs(el),
    index,
    tag: el.localName.toLowerCase(),
  }));
}

/**
 * Apply attribute patches to the element at `index` and return serialized markup.
 * Empty / null values remove the attribute. Untouched attrs are preserved.
 */
export function setSvgElementAttrs(
  markup: string,
  index: number,
  patch: Record<string, string | null | undefined>
): string {
  const trimmed = markup.trim();
  if (!trimmed) {
    return markup;
  }
  const doc = new DOMParser().parseFromString(trimmed, 'image/svg+xml');
  const elements = collectElements(doc.documentElement);
  const el = elements[index];
  if (!el) {
    return markup;
  }
  for (const [name, value] of Object.entries(patch)) {
    if (value === null || value === undefined || value === '') {
      el.removeAttribute(name);
    } else {
      el.setAttribute(name, value);
    }
  }
  return new XMLSerializer().serializeToString(doc.documentElement);
}
