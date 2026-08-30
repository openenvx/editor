/** Strip scripts/handlers and optionally tint currentColor fills. */
export function prepareSvgMarkup(
  raw: string,
  options?: { fill?: string; stroke?: string; viewBox?: string }
): string {
  let svg = raw.trim();
  if (!svg) {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"></svg>';
  }

  // ponytail: regex sanitizer - upgrade to DOMPurify/linkedom if untrusted SVG grows
  svg = svg
    .replaceAll(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replaceAll(/\son[a-z]+\s*=\s*(['"]).*?\1/gi, '')
    .replaceAll(/\son[a-z]+\s*=\s*[^\s>]+/gi, '');

  if (!/^<svg[\s>]/i.test(svg)) {
    const vb = options?.viewBox ?? '0 0 24 24';
    svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}">${svg}</svg>`;
  } else if (
    options?.viewBox &&
    !/\sviewBox\s*=/i.test(svg.slice(0, svg.indexOf('>') + 1))
  ) {
    svg = svg.replace(/^<svg\b/i, `<svg viewBox="${options.viewBox}"`);
  }

  if (!/\sxmlns\s*=/i.test(svg.slice(0, svg.indexOf('>') + 1))) {
    svg = svg.replace(/^<svg\b/i, '<svg xmlns="http://www.w3.org/2000/svg"');
  }

  if (options?.fill) {
    svg = svg.replaceAll('currentColor', options.fill);
  }
  if (options?.stroke) {
    // only replace stroke="currentColor" style uses - keep fill tints separate
    svg = svg.replaceAll(
      /stroke\s*=\s*(['"])currentColor\1/gi,
      `stroke="${options.stroke}"`
    );
  }

  return svg;
}

export function svgMarkupToDataUrl(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
