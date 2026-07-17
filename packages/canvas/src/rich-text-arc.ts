/** Degrees below this are treated as a straight baseline. */
const CURVE_EPSILON_DEG = 0.5;

/** Clamp extreme bends so the arc stays a simple chord (not a full loop). */
const MAX_ABS_CURVE_DEG = 180;

/**
 * Build an SVG path for text to follow.
 * `curveDeg` > 0 = smile (middle lower), < 0 = frown (middle higher), ~0 = straight.
 */
export function buildArcPath(
  width: number,
  fontSize: number,
  curveDeg: number
): string {
  const safeWidth = Math.max(width, 1);
  const baselineY = Math.max(fontSize, 1);

  if (Math.abs(curveDeg) < CURVE_EPSILON_DEG) {
    return `M 0,${baselineY} L ${safeWidth},${baselineY}`;
  }

  const clamped = Math.max(
    -MAX_ABS_CURVE_DEG,
    Math.min(MAX_ABS_CURVE_DEG, curveDeg)
  );
  const theta = (Math.abs(clamped) * Math.PI) / 180;
  const halfWidth = safeWidth / 2;
  const radius = halfWidth / Math.sin(theta / 2);
  const sagitta = radius * (1 - Math.cos(theta / 2));
  const largeArc = Math.abs(clamped) > 180 ? 1 : 0;

  if (clamped > 0) {
    // Smile: chord at baseline, arc bulges downward.
    return `M 0,${baselineY} A ${radius},${radius} 0 ${largeArc} 1 ${safeWidth},${baselineY}`;
  }

  // Frown: raise the chord so the peak stays near baseline.
  const yEnds = baselineY + sagitta;
  return `M 0,${yEnds} A ${radius},${radius} 0 ${largeArc} 0 ${safeWidth},${yEnds}`;
}

export function isCurvedText(curve: number | undefined | null): boolean {
  return typeof curve === 'number' && Math.abs(curve) >= CURVE_EPSILON_DEG;
}

/** Strip tags to a single-line plain string for TextPath rendering. */
export function stripHtmlToPlainText(html: string): string {
  return html
    .replaceAll(/<br\s*\/?>/gi, ' ')
    .replaceAll(/<\/p>/gi, ' ')
    .replaceAll(/<[^>]+>/g, '')
    .replaceAll('&nbsp;', ' ')
    .replaceAll(/\s+/g, ' ')
    .trim();
}
