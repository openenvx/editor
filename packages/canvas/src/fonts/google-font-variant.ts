/** Map Google Web Fonts variant keys → CSS2 `ital,wght` axes. */

export interface GoogleFontAxis {
  ital: 0 | 1;
  wght: number;
}

export interface GoogleFontCss2Family {
  family: string;
  variants: string[];
}

export function parseGoogleFontVariant(variant: string): GoogleFontAxis {
  const italic = variant.endsWith('italic');
  const weightKey = italic
    ? variant === 'italic'
      ? 'regular'
      : variant.slice(0, -'italic'.length)
    : variant;
  const wght = weightKey === 'regular' ? 400 : Number(weightKey);
  return {
    ital: italic ? 1 : 0,
    wght: Number.isFinite(wght) ? wght : 400,
  };
}

/** Prefer regular / italic / 700 / 700italic when present; else first available face. */
export function pickGoogleFontLoadVariants(available: string[]): string[] {
  if (available.length === 0) {
    return [];
  }
  const preferred = ['regular', 'italic', '700', '700italic'];
  const picked = preferred.filter((variant) => available.includes(variant));
  return picked.length > 0 ? picked : [available[0]!];
}

function familyCss2Segment(family: string, variants: string[]): string {
  const axes = variants.map(parseGoogleFontVariant);
  const hasItalic = axes.some((axis) => axis.ital === 1);
  const unique = new Map<string, GoogleFontAxis>();
  for (const axis of axes) {
    unique.set(`${axis.ital},${axis.wght}`, axis);
  }
  const sorted = [...unique.values()].toSorted(
    (a, b) => a.ital - b.ital || a.wght - b.wght
  );

  const encodedFamily = encodeURIComponent(family).replaceAll('%20', '+');
  if (hasItalic) {
    const spec = sorted.map((axis) => `${axis.ital},${axis.wght}`).join(';');
    return `family=${encodedFamily}:ital,wght@${spec}`;
  }
  const weights = [...new Set(sorted.map((axis) => axis.wght))].join(';');
  return `family=${encodedFamily}:wght@${weights}`;
}

export function buildGoogleFontsCss2Href(
  family: string,
  variants: string[]
): string {
  return `https://fonts.googleapis.com/css2?${familyCss2Segment(family, variants)}&display=swap`;
}

/** One stylesheet for many families (featured preload). */
export function buildGoogleFontsCss2HrefBatch(
  families: GoogleFontCss2Family[]
): string | null {
  if (families.length === 0) {
    return null;
  }
  const segments = families.map((entry) =>
    familyCss2Segment(entry.family, entry.variants)
  );
  return `https://fonts.googleapis.com/css2?${segments.join('&')}&display=swap`;
}
