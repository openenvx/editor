export function parseShadowOpacity(color: string): number {
  if (color.length === 9 && color.startsWith('#')) {
    const alpha = Number.parseInt(color.slice(7, 9), 16) / 255;
    return Number.isNaN(alpha) ? 1 : alpha;
  }
  return 1;
}

export function parseShadowColor(color: string): string {
  if (color.length === 9 && color.startsWith('#')) {
    return color.slice(0, 7);
  }
  return color;
}
